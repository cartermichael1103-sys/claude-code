"""
Healthcare Scheduling - Confirmation Waterfall Workflow
Runs as a scheduled job (cron/Celery/APScheduler) every 15-30 minutes.

Workflow timeline per appointment:
  T-72h  → SMS patient + caregiver, SMS therapist assignment
  T-24h  → SMS patient; if no response → voice call + alert coordinator
  T-2h   → SMS patient if confirmed; hold therapist if not confirmed
  T-0    → Therapist check-in trigger; "en route" → patient notified
"""

import logging
from datetime import datetime, timedelta
from typing import Protocol

from models import Appointment, AppointmentStatus, ConfirmationStatus
from notifier import HealthcareNotifier

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Storage Protocol - implement with your DB (SQLAlchemy, DynamoDB, Firestore...)
# ---------------------------------------------------------------------------

class AppointmentStore(Protocol):
    def get_appointments_in_window(
        self, start: datetime, end: datetime
    ) -> list[Appointment]: ...

    def save(self, appt: Appointment) -> None: ...

    def get_by_id(self, appt_id: str) -> Appointment | None: ...


# ---------------------------------------------------------------------------
# Confirmation Waterfall Engine
# ---------------------------------------------------------------------------

class ConfirmationWaterfall:
    """
    Drives the multi-step notification and escalation workflow.
    Call .run() from a scheduled job every 15-30 minutes.
    """

    def __init__(self, store: AppointmentStore, notifier: HealthcareNotifier):
        self.store = store
        self.notifier = notifier

    def run(self) -> None:
        """Process all upcoming appointments and trigger appropriate notifications."""
        now = datetime.utcnow()
        # Look ahead 73 hours to catch anything needing 72h notice
        upcoming = self.store.get_appointments_in_window(now, now + timedelta(hours=73))

        for appt in upcoming:
            if appt.status in (
                AppointmentStatus.COMPLETED,
                AppointmentStatus.CANCELLED_PATIENT,
                AppointmentStatus.CANCELLED_THERAPIST,
                AppointmentStatus.NO_SHOW,
            ):
                continue

            try:
                self._process_appointment(appt, now)
            except Exception as exc:
                logger.error(f"Error processing appointment {appt.id}: {exc}", exc_info=True)

    def _process_appointment(self, appt: Appointment, now: datetime) -> None:
        hours_until = (appt.scheduled_start - now).total_seconds() / 3600

        # ---- 72h window -----------------------------------------------
        if 71 <= hours_until <= 73 and not appt.reminder_72h_sent:
            logger.info(f"[{appt.id}] Sending 72h reminders")
            records = self.notifier.notify_patient_72h(appt)
            therapist_record = self.notifier.notify_therapist_assignment(appt)
            appt.notifications.extend(records + [therapist_record])
            appt.reminder_72h_sent = True
            self.store.save(appt)

        # ---- 24h window -----------------------------------------------
        elif 23 <= hours_until <= 25 and not appt.reminder_24h_sent:
            logger.info(f"[{appt.id}] Sending 24h reminders")
            record = self.notifier.notify_patient_24h(appt)
            appt.notifications.append(record)
            appt.reminder_24h_sent = True

            # If patient hasn't responded to 72h reminder → escalate
            if appt.patient_confirmation == ConfirmationStatus.PENDING:
                logger.warning(f"[{appt.id}] No patient response at 24h - escalating")
                self._escalate_no_response(appt)

            self.store.save(appt)

        # ---- 2h window ------------------------------------------------
        elif 1.5 <= hours_until <= 2.5 and not appt.reminder_2h_sent:
            logger.info(f"[{appt.id}] Sending 2h reminders")

            if appt.patient_confirmation == ConfirmationStatus.CONFIRMED:
                record = self.notifier.notify_patient_2h(appt)
                appt.notifications.append(record)
                # Notify therapist patient is confirmed and good to go
                status_record = self.notifier.notify_therapist_patient_status(appt, "confirmed")
                appt.notifications.append(status_record)
            else:
                # Still unconfirmed at 2h → hold therapist, alert coordinator
                logger.warning(f"[{appt.id}] Patient still unconfirmed at 2h - holding therapist")
                hold_record = self.notifier.notify_therapist_patient_status(appt, "no_response")
                appt.notifications.append(hold_record)
                coordinator_record = self.notifier.alert_coordinator(appt, "no_response_alert")
                appt.notifications.append(coordinator_record)

            appt.reminder_2h_sent = True
            self.store.save(appt)

    def _escalate_no_response(self, appt: Appointment) -> None:
        """
        Escalation path when patient doesn't respond to 72h SMS:
        1. Try a voice call
        2. Alert coordinator
        3. Notify caregiver (if not already done via SMS)
        """
        voice_url = (
            f"{self.notifier.webhook_base_url}/webhooks/voice/reminder/{appt.id}"
        )
        voice_record = self.notifier.send_voice_call(
            to=appt.patient.phone,
            twiml_url=voice_url,
            appointment_id=appt.id,
            recipient_id=appt.patient.id,
            recipient_type="patient",
        )
        appt.notifications.append(voice_record)
        coordinator_record = self.notifier.alert_coordinator(appt, "no_response_alert")
        appt.notifications.append(coordinator_record)

    # ------------------------------------------------------------------
    # Handle incoming SMS replies (called from webhook handler)
    # ------------------------------------------------------------------

    def handle_patient_reply(
        self,
        appt_id: str,
        confirmation_status: ConfirmationStatus,
        raw_reply: str,
    ) -> Appointment | None:
        appt = self.store.get_by_id(appt_id)
        if not appt:
            logger.warning(f"Reply for unknown appointment {appt_id}")
            return None

        appt.patient_confirmation = confirmation_status
        appt.updated_at = datetime.utcnow()

        if confirmation_status == ConfirmationStatus.CONFIRMED:
            appt.status = AppointmentStatus.CONFIRMED_PATIENT
            logger.info(f"[{appt_id}] Patient confirmed")
            # Notify therapist
            record = self.notifier.notify_therapist_patient_status(appt, "confirmed")
            appt.notifications.append(record)

        elif confirmation_status == ConfirmationStatus.CANCELLED:
            appt.status = AppointmentStatus.CANCELLED_PATIENT
            logger.info(f"[{appt_id}] Patient cancelled")
            record = self.notifier.notify_therapist_patient_status(appt, "cancelled")
            appt.notifications.append(record)
            coordinator_record = self.notifier.alert_coordinator(appt, "cancellation_alert")
            appt.notifications.append(coordinator_record)

        elif confirmation_status == ConfirmationStatus.RESCHEDULE_REQUESTED:
            logger.info(f"[{appt_id}] Patient requested reschedule")
            coordinator_record = self.notifier.alert_coordinator(appt, "reschedule_request")
            appt.notifications.append(coordinator_record)

        elif confirmation_status == ConfirmationStatus.CALL_REQUESTED:
            logger.info(f"[{appt_id}] Patient requested callback")
            coordinator_record = self.notifier.alert_coordinator(
                appt, "no_response_alert"   # re-use as general attention flag
            )
            appt.notifications.append(coordinator_record)

        self.store.save(appt)
        return appt

    def handle_therapist_checkin(
        self,
        appt_id: str,
        checkin_type: str,          # "en_route" | "arrived" | "no_answer"
        eta_minutes: int = 15,
    ) -> Appointment | None:
        appt = self.store.get_by_id(appt_id)
        if not appt:
            return None

        if checkin_type == "en_route":
            appt.status = AppointmentStatus.THERAPIST_EN_ROUTE
            record = self.notifier.notify_therapist_en_route(appt, eta_minutes)
            appt.notifications.append(record)

        elif checkin_type == "arrived":
            appt.status = AppointmentStatus.IN_PROGRESS

        elif checkin_type == "no_answer":
            appt.status = AppointmentStatus.NO_SHOW
            record = self.notifier.alert_coordinator(appt, "no_show")
            appt.notifications.append(record)

        appt.updated_at = datetime.utcnow()
        self.store.save(appt)
        return appt

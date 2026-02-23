"""
Healthcare Scheduling - Twilio Notification Service
Handles: SMS, voice calls, and two-way reply processing
"""

import uuid
import logging
from datetime import datetime
from typing import Optional

from twilio.rest import Client
from twilio.twiml.voice_response import VoiceResponse, Gather

from models import (
    Appointment, NotificationChannel, NotificationRecord,
    ConfirmationStatus, Patient, Therapist
)

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Message Templates
# ---------------------------------------------------------------------------

PATIENT_TEMPLATES = {
    "72h": (
        "Hi {name}, this is a reminder from {agency}. "
        "Your {service} visit is scheduled for {day} at {time} with {therapist}. "
        "Reply 1-Confirm, 2-Cancel, 3-Reschedule, or 4-Call me."
    ),
    "24h": (
        "Hi {name}, your {service} visit is TOMORROW at {time}. "
        "{therapist} will visit you at {address}. "
        "Reply 1-Confirm, 2-Cancel, 3-Reschedule, or 4-Call me."
    ),
    "2h": (
        "Hi {name}, your {service} visit is in about 2 hours at {time}. "
        "Reply 1-Confirm or 2-Cancel."
    ),
    "en_route": (
        "Hi {name}, {therapist} is on the way and should arrive in about {eta} minutes. "
        "Please be ready. Reply HELP if you need to reach us."
    ),
    "caregiver_72h": (
        "Hi {name}, this is {agency}. {patient}'s {service} visit is scheduled "
        "for {day} at {time}. Please ensure {patient} is available. "
        "Reply 1-Confirm or 2-Cancel."
    ),
}

THERAPIST_TEMPLATES = {
    "assignment": (
        "Hi {name}, you have a {service} visit scheduled: "
        "{day} at {time} - {patient} at {address}. "
        "Reply 1-Confirm or 2-Conflict."
    ),
    "patient_confirmed": (
        "Update: {patient} has CONFIRMED their {time} appointment. See you there."
    ),
    "patient_cancelled": (
        "Update: {patient} has CANCELLED the {time} appointment. "
        "Please contact {coordinator} for rebooking."
    ),
    "patient_no_response": (
        "Alert: {patient} has NOT confirmed the {time} appointment. "
        "Coordinator {coordinator} has been notified. Await instructions before departing."
    ),
}

COORDINATOR_TEMPLATES = {
    "no_response_alert": (
        "[ACTION NEEDED] {patient} has not confirmed their {time} appointment "
        "with {therapist}. 24h window has passed. Please follow up. Appt ID: {appt_id}"
    ),
    "cancellation_alert": (
        "[CANCELLATION] {patient} cancelled their {time} appointment "
        "with {therapist}. Appt ID: {appt_id}. Therapist has been notified."
    ),
    "reschedule_request": (
        "[RESCHEDULE REQUEST] {patient} requested to reschedule their {time} "
        "appointment with {therapist}. Appt ID: {appt_id}."
    ),
    "no_show": (
        "[NO SHOW] {therapist} reported no answer at {patient}'s address "
        "for the {time} appointment. Appt ID: {appt_id}."
    ),
}


# ---------------------------------------------------------------------------
# Twilio Notification Service
# ---------------------------------------------------------------------------

class HealthcareNotifier:
    """
    Sends SMS and voice notifications via Twilio.
    All outbound messages are logged to NotificationRecord.

    Environment variables required:
        TWILIO_ACCOUNT_SID
        TWILIO_AUTH_TOKEN
        TWILIO_FROM_NUMBER   (your Twilio phone number, E.164)
        AGENCY_NAME          (displayed in messages)
        COORDINATOR_PHONE    (for escalation alerts)
    """

    def __init__(
        self,
        account_sid: str,
        auth_token: str,
        from_number: str,
        agency_name: str,
        coordinator_phone: str,
        webhook_base_url: str,          # e.g. https://yourapp.com
    ):
        self.client = Client(account_sid, auth_token)
        self.from_number = from_number
        self.agency_name = agency_name
        self.coordinator_phone = coordinator_phone
        self.webhook_base_url = webhook_base_url.rstrip("/")

    # ------------------------------------------------------------------
    # Core send methods
    # ------------------------------------------------------------------

    def send_sms(
        self,
        to: str,
        body: str,
        appointment_id: str,
        recipient_id: str,
        recipient_type: str,
    ) -> NotificationRecord:
        record = NotificationRecord(
            id=str(uuid.uuid4()),
            appointment_id=appointment_id,
            recipient_id=recipient_id,
            recipient_type=recipient_type,
            channel=NotificationChannel.SMS,
            message=body,
            sent_at=datetime.utcnow(),
        )
        try:
            msg = self.client.messages.create(
                to=to,
                from_=self.from_number,
                body=body,
                # Twilio will POST replies to this URL
                status_callback=f"{self.webhook_base_url}/webhooks/sms/status",
            )
            record.twilio_sid = msg.sid
            record.delivered = True
            logger.info(f"SMS sent to {to} | SID={msg.sid}")
        except Exception as exc:
            logger.error(f"SMS failed to {to}: {exc}")
            record.delivered = False
        return record

    def send_voice_call(
        self,
        to: str,
        twiml_url: str,
        appointment_id: str,
        recipient_id: str,
        recipient_type: str,
    ) -> NotificationRecord:
        """Initiates an outbound voice call using a TwiML webhook URL."""
        record = NotificationRecord(
            id=str(uuid.uuid4()),
            appointment_id=appointment_id,
            recipient_id=recipient_id,
            recipient_type=recipient_type,
            channel=NotificationChannel.VOICE,
            message=f"Voice call -> {twiml_url}",
            sent_at=datetime.utcnow(),
        )
        try:
            call = self.client.calls.create(
                to=to,
                from_=self.from_number,
                url=twiml_url,
                status_callback=f"{self.webhook_base_url}/webhooks/voice/status",
                status_callback_method="POST",
            )
            record.twilio_sid = call.sid
            record.delivered = True
            logger.info(f"Voice call initiated to {to} | SID={call.sid}")
        except Exception as exc:
            logger.error(f"Voice call failed to {to}: {exc}")
            record.delivered = False
        return record

    # ------------------------------------------------------------------
    # Appointment-specific notification methods
    # ------------------------------------------------------------------

    def notify_patient_72h(self, appt: Appointment) -> list[NotificationRecord]:
        records = []
        p = appt.patient
        body = PATIENT_TEMPLATES["72h"].format(
            name=p.name.split()[0],
            agency=self.agency_name,
            service=appt.service_type or "therapy",
            day=appt.scheduled_start.strftime("%A, %B %-d"),
            time=appt.scheduled_start.strftime("%-I:%M %p"),
            therapist=appt.therapist.name,
        )
        records.append(self.send_sms(p.phone, body, appt.id, p.id, "patient"))

        # Also notify caregiver if one exists
        if p.secondary_contact_phone:
            caregiver_body = PATIENT_TEMPLATES["caregiver_72h"].format(
                name=p.secondary_contact_name or "Caregiver",
                agency=self.agency_name,
                patient=p.name.split()[0],
                service=appt.service_type or "therapy",
                day=appt.scheduled_start.strftime("%A, %B %-d"),
                time=appt.scheduled_start.strftime("%-I:%M %p"),
            )
            records.append(
                self.send_sms(
                    p.secondary_contact_phone,
                    caregiver_body,
                    appt.id,
                    f"{p.id}_caregiver",
                    "caregiver",
                )
            )
        return records

    def notify_patient_24h(self, appt: Appointment) -> NotificationRecord:
        p = appt.patient
        body = PATIENT_TEMPLATES["24h"].format(
            name=p.name.split()[0],
            service=appt.service_type or "therapy",
            time=appt.scheduled_start.strftime("%-I:%M %p"),
            therapist=appt.therapist.name,
            address=appt.address,
        )
        return self.send_sms(p.phone, body, appt.id, p.id, "patient")

    def notify_patient_2h(self, appt: Appointment) -> NotificationRecord:
        p = appt.patient
        body = PATIENT_TEMPLATES["2h"].format(
            name=p.name.split()[0],
            service=appt.service_type or "therapy",
            time=appt.scheduled_start.strftime("%-I:%M %p"),
        )
        return self.send_sms(p.phone, body, appt.id, p.id, "patient")

    def notify_therapist_assignment(self, appt: Appointment) -> NotificationRecord:
        t = appt.therapist
        body = THERAPIST_TEMPLATES["assignment"].format(
            name=t.name.split()[0],
            service=appt.service_type or "therapy",
            day=appt.scheduled_start.strftime("%A, %B %-d"),
            time=appt.scheduled_start.strftime("%-I:%M %p"),
            patient=appt.patient.name,
            address=appt.address,
        )
        return self.send_sms(t.phone, body, appt.id, t.id, "therapist")

    def notify_therapist_patient_status(
        self, appt: Appointment, status: str
    ) -> NotificationRecord:
        t = appt.therapist
        template_key = f"patient_{status}"   # patient_confirmed | patient_cancelled | patient_no_response
        body = THERAPIST_TEMPLATES[template_key].format(
            patient=appt.patient.name.split()[0],
            time=appt.scheduled_start.strftime("%-I:%M %p"),
            coordinator=self.coordinator_phone,
        )
        return self.send_sms(t.phone, body, appt.id, t.id, "therapist")

    def notify_therapist_en_route(self, appt: Appointment, eta_minutes: int) -> NotificationRecord:
        p = appt.patient
        body = PATIENT_TEMPLATES["en_route"].format(
            name=p.name.split()[0],
            therapist=appt.therapist.name.split()[0],
            eta=eta_minutes,
        )
        return self.send_sms(p.phone, body, appt.id, p.id, "patient")

    def alert_coordinator(
        self, appt: Appointment, alert_type: str
    ) -> NotificationRecord:
        body = COORDINATOR_TEMPLATES[alert_type].format(
            patient=appt.patient.name,
            therapist=appt.therapist.name,
            time=appt.scheduled_start.strftime("%A %-I:%M %p"),
            coordinator=self.coordinator_phone,
            appt_id=appt.id,
        )
        return self.send_sms(
            self.coordinator_phone, body, appt.id, "coordinator", "coordinator"
        )

    # ------------------------------------------------------------------
    # Voice call TwiML builders (served by your web app)
    # ------------------------------------------------------------------

    @staticmethod
    def build_reminder_twiml(
        patient_name: str,
        service: str,
        day: str,
        time_str: str,
        callback_url: str,
    ) -> str:
        """
        Returns TwiML XML for an outbound reminder call with keypad confirmation.
        Host this at /webhooks/voice/reminder/<appt_id>
        """
        response = VoiceResponse()
        gather = Gather(
            num_digits=1,
            action=callback_url,
            method="POST",
            timeout=10,
        )
        gather.say(
            f"Hello {patient_name}, this is a reminder from your home health agency. "
            f"You have a {service} visit scheduled for {day} at {time_str}. "
            f"Press 1 to confirm, press 2 to cancel, or press 3 to speak with a coordinator.",
            voice="Polly.Joanna",
        )
        response.append(gather)
        # If no input
        response.say("We did not receive a response. A coordinator will follow up with you.")
        return str(response)


# ---------------------------------------------------------------------------
# Reply Parser - converts "1", "2", "3", "4", "YES", "NO" to ConfirmationStatus
# ---------------------------------------------------------------------------

def parse_sms_reply(body: str) -> Optional[ConfirmationStatus]:
    """
    Normalizes free-text SMS replies into structured ConfirmationStatus values.
    Handles numeric shortcuts and common natural language responses.
    """
    text = body.strip().lower()
    confirm_words = {"1", "yes", "y", "confirm", "confirmed", "ok", "okay", "sure", "yep", "yup"}
    cancel_words  = {"2", "no", "n", "cancel", "cancelled", "cant", "can't", "nope", "no way"}
    reschedule_words = {"3", "reschedule", "change", "different", "another", "move"}
    call_words = {"4", "call", "call me", "phone", "help", "talk"}

    if text in confirm_words:
        return ConfirmationStatus.CONFIRMED
    if text in cancel_words:
        return ConfirmationStatus.CANCELLED
    if any(w in text for w in reschedule_words):
        return ConfirmationStatus.RESCHEDULE_REQUESTED
    if any(w in text for w in call_words):
        return ConfirmationStatus.CALL_REQUESTED
    return None

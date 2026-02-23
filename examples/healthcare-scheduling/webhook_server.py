"""
Healthcare Scheduling - Webhook Server (Flask)
Handles:
  - Inbound SMS replies from patients and therapists
  - Twilio voice call keypad responses
  - Therapist check-in API endpoints

Run with: flask run --host=0.0.0.0 --port=5000
Expose publicly with: ngrok http 5000  (for development)
"""

import os
import logging
from functools import wraps

from flask import Flask, request, jsonify, Response
from twilio.twiml.messaging_response import MessagingResponse
from twilio.twiml.voice_response import VoiceResponse, Gather
from twilio.request_validator import RequestValidator

from models import ConfirmationStatus
from notifier import HealthcareNotifier, parse_sms_reply
from workflow import ConfirmationWaterfall

logger = logging.getLogger(__name__)

app = Flask(__name__)


# ---------------------------------------------------------------------------
# Bootstrap - replace InMemoryStore with your real DB implementation
# ---------------------------------------------------------------------------

class InMemoryStore:
    """Simple in-memory store for demonstration. Replace with real DB."""

    def __init__(self):
        self._data: dict = {}

    def get_appointments_in_window(self, start, end):
        return [
            a for a in self._data.values()
            if start <= a.scheduled_start <= end
        ]

    def save(self, appt):
        self._data[appt.id] = appt

    def get_by_id(self, appt_id):
        return self._data.get(appt_id)

    def get_by_phone(self, phone):
        """Find the most recent active appointment for a phone number."""
        from models import AppointmentStatus
        active_statuses = {
            AppointmentStatus.SCHEDULED,
            AppointmentStatus.CONFIRMED_PATIENT,
            AppointmentStatus.CONFIRMED_BOTH,
        }
        matches = [
            a for a in self._data.values()
            if (a.patient.phone == phone or a.therapist.phone == phone)
            and a.status in active_statuses
        ]
        return sorted(matches, key=lambda a: a.scheduled_start)[0] if matches else None


store = InMemoryStore()

notifier = HealthcareNotifier(
    account_sid=os.environ["TWILIO_ACCOUNT_SID"],
    auth_token=os.environ["TWILIO_AUTH_TOKEN"],
    from_number=os.environ["TWILIO_FROM_NUMBER"],
    agency_name=os.environ.get("AGENCY_NAME", "Home Health Agency"),
    coordinator_phone=os.environ["COORDINATOR_PHONE"],
    webhook_base_url=os.environ.get("WEBHOOK_BASE_URL", "https://yourapp.com"),
)

waterfall = ConfirmationWaterfall(store=store, notifier=notifier)


# ---------------------------------------------------------------------------
# Twilio request signature validation middleware
# ---------------------------------------------------------------------------

def validate_twilio_request(f):
    """Decorator: verifies the request actually came from Twilio."""
    @wraps(f)
    def decorated(*args, **kwargs):
        validator = RequestValidator(os.environ["TWILIO_AUTH_TOKEN"])
        url = request.url
        post_vars = request.form.to_dict()
        signature = request.headers.get("X-Twilio-Signature", "")

        if not validator.validate(url, post_vars, signature):
            logger.warning(f"Invalid Twilio signature from {request.remote_addr}")
            return Response("Forbidden", status=403)
        return f(*args, **kwargs)
    return decorated


# ---------------------------------------------------------------------------
# Inbound SMS webhook  (POST /webhooks/sms/inbound)
# Twilio routes all replies to your Twilio number here
# ---------------------------------------------------------------------------

@app.route("/webhooks/sms/inbound", methods=["POST"])
@validate_twilio_request
def sms_inbound():
    from_number = request.form.get("From", "")
    body = request.form.get("Body", "").strip()
    response = MessagingResponse()

    logger.info(f"Inbound SMS from {from_number}: {body!r}")

    # Find the active appointment for this phone number
    appt = store.get_by_phone(from_number)
    if not appt:
        response.message(
            "We couldn't find an upcoming appointment linked to this number. "
            "Please call us directly for assistance."
        )
        return str(response)

    # Determine if this is a patient or therapist reply
    is_patient = appt.patient.phone == from_number
    confirmation = parse_sms_reply(body)

    if is_patient:
        if confirmation is None:
            response.message(
                f"Sorry, we didn't understand that. "
                f"Reply 1-Confirm, 2-Cancel, 3-Reschedule, or 4-Call me."
            )
            return str(response)

        waterfall.handle_patient_reply(appt.id, confirmation, body)

        reply_map = {
            ConfirmationStatus.CONFIRMED: (
                f"Got it! Your {appt.scheduled_start.strftime('%-I:%M %p')} appointment is confirmed. "
                f"We'll send you an update when your therapist is on the way."
            ),
            ConfirmationStatus.CANCELLED: (
                "Your appointment has been cancelled. A coordinator will reach out "
                "to reschedule. Thank you for letting us know."
            ),
            ConfirmationStatus.RESCHEDULE_REQUESTED: (
                "We've received your reschedule request. A coordinator will contact you "
                "within 2 hours to find a new time."
            ),
            ConfirmationStatus.CALL_REQUESTED: (
                "A coordinator will call you shortly. If urgent, please call us directly."
            ),
        }
        response.message(reply_map.get(confirmation, "Thank you for your response."))

    else:
        # Therapist reply to assignment confirmation
        if body.strip() == "1":
            appt.therapist_confirmation = ConfirmationStatus.CONFIRMED
            store.save(appt)
            response.message("Assignment confirmed. Thank you!")
        elif body.strip() == "2":
            appt.therapist_confirmation = ConfirmationStatus.CANCELLED
            store.save(appt)
            coordinator_record = notifier.alert_coordinator(appt, "cancellation_alert")
            appt.notifications.append(coordinator_record)
            response.message("Conflict noted. A coordinator has been alerted to reassign.")
        else:
            response.message("Reply 1 to confirm the assignment or 2 to report a conflict.")

    return str(response)


# ---------------------------------------------------------------------------
# Inbound voice webhook  (GET/POST /webhooks/voice/reminder/<appt_id>)
# Returns TwiML to read out reminder and collect keypad input
# ---------------------------------------------------------------------------

@app.route("/webhooks/voice/reminder/<appt_id>", methods=["GET", "POST"])
@validate_twilio_request
def voice_reminder(appt_id: str):
    appt = store.get_by_id(appt_id)
    if not appt:
        resp = VoiceResponse()
        resp.say("We could not find your appointment. Please call us directly.")
        return str(resp)

    twiml = HealthcareNotifier.build_reminder_twiml(
        patient_name=appt.patient.name.split()[0],
        service=appt.service_type or "therapy",
        day=appt.scheduled_start.strftime("%A, %B %-d"),
        time_str=appt.scheduled_start.strftime("%-I:%M %p"),
        callback_url=f"{notifier.webhook_base_url}/webhooks/voice/keypress/{appt_id}",
    )
    return Response(twiml, mimetype="text/xml")


@app.route("/webhooks/voice/keypress/<appt_id>", methods=["POST"])
@validate_twilio_request
def voice_keypress(appt_id: str):
    digit = request.form.get("Digits", "")
    resp = VoiceResponse()

    key_map = {
        "1": ConfirmationStatus.CONFIRMED,
        "2": ConfirmationStatus.CANCELLED,
        "3": ConfirmationStatus.CALL_REQUESTED,
    }

    confirmation = key_map.get(digit)
    if confirmation:
        waterfall.handle_patient_reply(appt_id, confirmation, f"voice:{digit}")
        if confirmation == ConfirmationStatus.CONFIRMED:
            resp.say("Thank you. Your appointment is confirmed. Goodbye.")
        elif confirmation == ConfirmationStatus.CANCELLED:
            resp.say("Your appointment has been cancelled. A coordinator will follow up.")
        else:
            resp.say("A coordinator will call you back shortly. Goodbye.")
    else:
        resp.say("We did not receive a valid response. A coordinator will follow up.")

    return Response(str(resp), mimetype="text/xml")


# ---------------------------------------------------------------------------
# Therapist check-in API  (POST /api/checkin)
# Called from therapist mobile app or simple SMS shortcode
# ---------------------------------------------------------------------------

@app.route("/api/checkin", methods=["POST"])
def therapist_checkin():
    """
    Expected JSON body:
    {
        "appointment_id": "abc123",
        "checkin_type": "en_route" | "arrived" | "no_answer",
        "eta_minutes": 15  (optional, only for en_route)
    }
    """
    data = request.get_json(force=True)
    appt_id = data.get("appointment_id")
    checkin_type = data.get("checkin_type")
    eta_minutes = data.get("eta_minutes", 15)

    if not appt_id or checkin_type not in ("en_route", "arrived", "no_answer"):
        return jsonify({"error": "Invalid request"}), 400

    appt = waterfall.handle_therapist_checkin(appt_id, checkin_type, eta_minutes)
    if not appt:
        return jsonify({"error": "Appointment not found"}), 404

    return jsonify({"status": "ok", "appointment_status": appt.status})


# ---------------------------------------------------------------------------
# SMS delivery status callback  (POST /webhooks/sms/status)
# ---------------------------------------------------------------------------

@app.route("/webhooks/sms/status", methods=["POST"])
@validate_twilio_request
def sms_status():
    message_sid = request.form.get("MessageSid")
    status = request.form.get("MessageStatus")
    logger.info(f"SMS {message_sid} status: {status}")
    # Update delivery status in your DB here if needed
    return "", 204


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    app.run(host="0.0.0.0", port=5000, debug=False)

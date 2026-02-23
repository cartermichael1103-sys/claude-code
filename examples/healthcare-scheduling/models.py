"""
Healthcare Scheduling - Core Data Models
Supports: patients, therapists, appointments, confirmation tracking
"""

from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Optional


class AppointmentStatus(str, Enum):
    SCHEDULED = "scheduled"
    CONFIRMED_PATIENT = "confirmed_patient"
    CONFIRMED_BOTH = "confirmed_both"
    THERAPIST_EN_ROUTE = "therapist_en_route"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED_PATIENT = "cancelled_patient"
    CANCELLED_THERAPIST = "cancelled_therapist"
    NO_SHOW = "no_show"
    RESCHEDULED = "rescheduled"


class NotificationChannel(str, Enum):
    SMS = "sms"
    VOICE = "voice"
    EMAIL = "email"


class ConfirmationStatus(str, Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    CANCELLED = "cancelled"
    RESCHEDULE_REQUESTED = "reschedule_requested"
    CALL_REQUESTED = "call_requested"
    NO_RESPONSE = "no_response"


@dataclass
class Contact:
    """Represents a patient or therapist contact."""
    id: str
    name: str
    phone: str                          # E.164 format: +15551234567
    email: Optional[str] = None
    preferred_channel: NotificationChannel = NotificationChannel.SMS
    timezone: str = "America/New_York"


@dataclass
class Patient(Contact):
    secondary_contact_name: Optional[str] = None
    secondary_contact_phone: Optional[str] = None   # Family/caregiver
    high_risk: bool = False             # Flag for extra follow-up
    language: str = "en"


@dataclass
class Therapist(Contact):
    specialty: str = ""                 # PT, OT, SLP, etc.
    active: bool = True


@dataclass
class NotificationRecord:
    """Tracks every notification sent and its outcome."""
    id: str
    appointment_id: str
    recipient_id: str
    recipient_type: str                 # "patient" | "therapist" | "caregiver" | "coordinator"
    channel: NotificationChannel
    message: str
    sent_at: datetime
    delivered: bool = False
    response: Optional[str] = None
    response_at: Optional[datetime] = None
    confirmation_status: ConfirmationStatus = ConfirmationStatus.PENDING
    twilio_sid: Optional[str] = None


@dataclass
class Appointment:
    """Core appointment model with full tracking."""
    id: str
    patient: Patient
    therapist: Therapist
    scheduled_start: datetime
    duration_minutes: int = 60
    service_type: str = ""              # PT eval, PT follow-up, OT, SLP, etc.
    address: str = ""
    notes: str = ""
    status: AppointmentStatus = AppointmentStatus.SCHEDULED
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: datetime = field(default_factory=datetime.utcnow)

    # Confirmation tracking
    patient_confirmation: ConfirmationStatus = ConfirmationStatus.PENDING
    therapist_confirmation: ConfirmationStatus = ConfirmationStatus.PENDING

    # Workflow state
    reminder_72h_sent: bool = False
    reminder_24h_sent: bool = False
    reminder_2h_sent: bool = False
    therapist_checkin_sent: bool = False
    notifications: list = field(default_factory=list)

    @property
    def is_confirmed(self) -> bool:
        return (
            self.patient_confirmation == ConfirmationStatus.CONFIRMED
            and self.therapist_confirmation == ConfirmationStatus.CONFIRMED
        )

    @property
    def needs_coordinator_attention(self) -> bool:
        """True if coordinator should be alerted."""
        hours_until = (self.scheduled_start - datetime.utcnow()).total_seconds() / 3600
        return (
            hours_until < 24
            and self.patient_confirmation == ConfirmationStatus.NO_RESPONSE
        ) or self.patient_confirmation in (
            ConfirmationStatus.CANCELLED,
            ConfirmationStatus.RESCHEDULE_REQUESTED,
        )

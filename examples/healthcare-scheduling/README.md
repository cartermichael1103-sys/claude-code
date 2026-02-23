# Home Health Scheduling Communication System

A programmatic solution for reducing no-shows, last-minute cancellations, and communication failures between home health agencies, therapists, and patients.

## Problem This Solves

| Failure Mode | Solution |
|---|---|
| Patient forgets appointment | Automated 72h + 24h + 2h SMS reminders |
| No response = wasted therapist trip | Confirmation waterfall with voice call escalation |
| Changes don't reach both parties | Bidirectional SMS with structured reply codes |
| Therapist dispatched to unconfirmed visit | Therapist held at 2h mark if patient unconfirmed |
| Coordinator unaware of problems | Automatic coordinator alerts at every failure point |
| Caregiver not in the loop | Secondary contact notified at 72h |
| Therapist arrives to empty home | "En route" notification + check-in system |

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Scheduler (cron / APScheduler)            │
│                    Runs every 15 minutes                     │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│               Confirmation Waterfall (workflow.py)           │
│  T-72h: SMS patient + caregiver + therapist assignment       │
│  T-24h: SMS patient; voice call if no response              │
│  T-2h:  Hold therapist if unconfirmed; alert coordinator    │
└────────────────────────┬────────────────────────────────────┘
                         │
                    ┌────┴─────┐
                    ▼          ▼
            ┌──────────┐  ┌──────────────┐
            │  Twilio  │  │  Your DB /   │
            │  SMS +   │  │  EHR System  │
            │  Voice   │  └──────────────┘
            └────┬─────┘
                 │  (replies)
                 ▼
┌─────────────────────────────────────────────────────────────┐
│              Webhook Server (webhook_server.py)              │
│  /webhooks/sms/inbound    ← patient/therapist replies       │
│  /webhooks/voice/reminder ← outbound voice call TwiML       │
│  /webhooks/voice/keypress ← keypad input from voice call    │
│  /api/checkin             ← therapist en-route/arrived      │
└─────────────────────────────────────────────────────────────┘
```

## Confirmation Flow

```
SCHEDULED
    │
    ├─ T-72h → SMS patient + caregiver + therapist
    │              │
    │         Patient replies?
    │         YES ──► patient_confirmation = CONFIRMED
    │         NO  ──► (continue to 24h)
    │
    ├─ T-24h → SMS patient again
    │              │
    │         Still no reply?
    │         → Voice call patient
    │         → Alert coordinator
    │
    ├─ T-2h  → Patient confirmed?
    │         YES → SMS patient reminder + notify therapist "good to go"
    │         NO  → SMS therapist "HOLD, await instructions"
    │              → Alert coordinator
    │
    └─ Day-of → Therapist marks "en route" → patient notified with ETA
               → Therapist marks "arrived" → visit timer starts
               → Therapist marks "no answer" → coordinator alerted
```

## SMS Reply Codes

Patients receive structured prompts and can reply:

| Reply | Meaning |
|---|---|
| `1` or `YES` or `CONFIRM` | Confirm appointment |
| `2` or `NO` or `CANCEL` | Cancel appointment |
| `3` or `RESCHEDULE` | Request reschedule |
| `4` or `CALL` or `HELP` | Request callback from coordinator |

## Quick Start

### 1. Install dependencies
```bash
pip install -r requirements.txt
```

### 2. Configure environment
```bash
cp .env.example .env
# Edit .env with your Twilio credentials
```

`.env.example`:
```
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_FROM_NUMBER=+15551234567
AGENCY_NAME=My Home Health Agency
COORDINATOR_PHONE=+15559876543
WEBHOOK_BASE_URL=https://yourapp.ngrok.io
```

### 3. Start the webhook server
```bash
flask --app webhook_server run --host=0.0.0.0 --port=5000
```

For local development, expose it with ngrok:
```bash
ngrok http 5000
# Set WEBHOOK_BASE_URL to the ngrok URL
```

### 4. Configure Twilio
In the Twilio console, set your phone number's:
- **Messaging webhook (inbound)**: `https://yourapp.com/webhooks/sms/inbound`
- **Voice webhook**: `https://yourapp.com/webhooks/voice/reminder/{appt_id}`

### 5. Start the scheduler
```bash
python scheduler.py
```

Or as a single cron run:
```bash
*/15 * * * * cd /path/to/app && python scheduler.py --run-once
```

## Integrating with Your Existing System

The `AppointmentStore` protocol in `workflow.py` is the only integration point you need to implement:

```python
class AppointmentStore(Protocol):
    def get_appointments_in_window(self, start, end) -> list[Appointment]: ...
    def save(self, appt: Appointment) -> None: ...
    def get_by_id(self, appt_id: str) -> Appointment | None: ...
```

Implement this against your EHR (Kinnser, WellSky, HHAeXchange, etc.) or any database, and the rest of the system works without changes.

## Files

| File | Purpose |
|---|---|
| `models.py` | Data models: Patient, Therapist, Appointment, NotificationRecord |
| `notifier.py` | Twilio SMS/voice service + message templates |
| `workflow.py` | Confirmation waterfall engine |
| `webhook_server.py` | Flask webhook server for Twilio callbacks |
| `scheduler.py` | APScheduler job runner |
| `requirements.txt` | Python dependencies |

## Beyond Automation: Strategic Recommendations

1. **High-risk flagging**: Mark patients with >2 prior no-shows as `high_risk=True`. The workflow automatically applies extra escalation for these patients.

2. **Caregiver loop**: Always collect a secondary contact. Fill `patient.secondary_contact_phone`. This alone eliminates a significant percentage of no-shows with elderly patients.

3. **Telehealth fallback**: For confirmed-but-can't-receive visits, offer a telehealth session instead of a full cancellation. Add a `4` option: "Press 4 for a video visit instead."

4. **ETA notifications**: The `handle_therapist_checkin("en_route")` call sends the patient an ETA. Therapists can trigger this via a simple mobile web page or SMS keyword.

5. **Visit verification**: On `arrived` + `completed`, log timestamps. This creates an automatic audit trail for billing and compliance.

"""
Healthcare Scheduling - Job Scheduler
Runs the confirmation waterfall on a cron-like schedule.

Supports two modes:
  1. APScheduler (in-process, good for small deployments)
  2. Print next-run times for external cron / Celery / AWS EventBridge

Usage:
    python scheduler.py            # runs APScheduler in-process
    python scheduler.py --dry-run  # prints schedule without running
"""

import sys
import os
import logging
from datetime import datetime, timezone

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


def build_services():
    """Wire up notifier, store, and waterfall from environment variables."""
    from notifier import HealthcareNotifier
    from workflow import ConfirmationWaterfall
    from webhook_server import InMemoryStore  # swap with real DB store

    store = InMemoryStore()
    notifier = HealthcareNotifier(
        account_sid=os.environ["TWILIO_ACCOUNT_SID"],
        auth_token=os.environ["TWILIO_AUTH_TOKEN"],
        from_number=os.environ["TWILIO_FROM_NUMBER"],
        agency_name=os.environ.get("AGENCY_NAME", "Home Health Agency"),
        coordinator_phone=os.environ["COORDINATOR_PHONE"],
        webhook_base_url=os.environ.get("WEBHOOK_BASE_URL", "https://yourapp.com"),
    )
    return ConfirmationWaterfall(store=store, notifier=notifier)


def run_waterfall():
    """Single execution of the waterfall - call this from cron or task queue."""
    logger.info("--- Waterfall run started ---")
    try:
        waterfall = build_services()
        waterfall.run()
        logger.info("--- Waterfall run complete ---")
    except Exception as exc:
        logger.error(f"Waterfall run failed: {exc}", exc_info=True)


def run_with_apscheduler():
    """Run in-process with APScheduler (pip install apscheduler)."""
    from apscheduler.schedulers.blocking import BlockingScheduler
    from apscheduler.triggers.interval import IntervalTrigger

    scheduler = BlockingScheduler(timezone="UTC")

    # Main waterfall: every 15 minutes
    scheduler.add_job(
        run_waterfall,
        trigger=IntervalTrigger(minutes=15),
        id="confirmation_waterfall",
        name="Confirmation Waterfall",
        replace_existing=True,
        next_run_time=datetime.now(timezone.utc),  # run immediately on start
    )

    logger.info("Scheduler started. Press Ctrl+C to exit.")
    try:
        scheduler.start()
    except (KeyboardInterrupt, SystemExit):
        logger.info("Scheduler stopped.")


if __name__ == "__main__":
    if "--dry-run" in sys.argv:
        print("Scheduler would run confirmation_waterfall every 15 minutes.")
        print("Set up as external cron with: */15 * * * * python scheduler.py --run-once")
    elif "--run-once" in sys.argv:
        run_waterfall()
    else:
        run_with_apscheduler()

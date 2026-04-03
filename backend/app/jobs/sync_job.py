"""APScheduler background sync job."""
from __future__ import annotations

import asyncio
import logging

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger

logger = logging.getLogger(__name__)

_scheduler: BackgroundScheduler | None = None


def _run_sync():
    from app.database import SessionLocal
    from app.config import get_settings
    from app.services.ingestion_service import ingest_all_topics

    settings = get_settings()
    db = SessionLocal()
    try:
        results = asyncio.run(ingest_all_topics(db, max_results=settings.arxiv_max_results))
        logger.info("Scheduled sync complete: %s", results)
    except Exception as exc:
        logger.error("Scheduled sync failed: %s", exc)
    finally:
        db.close()


def start_scheduler(interval_hours: int = 6):
    global _scheduler
    _scheduler = BackgroundScheduler()
    _scheduler.add_job(
        _run_sync,
        trigger=IntervalTrigger(hours=interval_hours),
        id="paper_sync",
        replace_existing=True,
    )
    _scheduler.start()
    logger.info("Sync scheduler started (every %d hours)", interval_hours)


def stop_scheduler():
    global _scheduler
    if _scheduler and _scheduler.running:
        _scheduler.shutdown(wait=False)

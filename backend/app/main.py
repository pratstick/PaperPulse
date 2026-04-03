"""Auto Research Digest — FastAPI application entry point."""
from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.database import init_db, SessionLocal
from app.jobs.sync_job import start_scheduler, stop_scheduler

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s %(message)s")
logger = logging.getLogger(__name__)


def _seed_topics():
    from app.models.topic import Topic
    from app.utils.seed_data import DEFAULT_TOPICS

    db = SessionLocal()
    try:
        for t in DEFAULT_TOPICS:
            existing = db.query(Topic).filter(Topic.name == t["name"]).first()
            if not existing:
                db.add(Topic(**t))
        db.commit()
        logger.info("Default topics seeded.")
    finally:
        db.close()


def _ensure_default_user():
    from app.models.user import User

    db = SessionLocal()
    try:
        user = db.query(User).filter(User.id == 1).first()
        if not user:
            db.add(User(id=1, name="Local User"))
            db.commit()
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    init_db()
    _seed_topics()
    _ensure_default_user()
    start_scheduler(interval_hours=settings.sync_interval_hours)
    logger.info("PaperPulse backend started.")
    yield
    stop_scheduler()
    logger.info("PaperPulse backend stopped.")


settings = get_settings()

app = FastAPI(
    title="PaperPulse API",
    description="Auto Research Digest backend",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from app.api.users import router as users_router
from app.api.topics import router as topics_router
from app.api.papers import router as papers_router
from app.api.digest import router as digest_router
from app.api.sync import router as sync_router

app.include_router(users_router, prefix="/api")
app.include_router(topics_router, prefix="/api")
app.include_router(papers_router, prefix="/api")
app.include_router(digest_router, prefix="/api")
app.include_router(sync_router, prefix="/api")


@app.get("/api/health")
def health():
    return {"status": "ok"}

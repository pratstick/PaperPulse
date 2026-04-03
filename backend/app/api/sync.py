"""Admin/sync endpoints."""
from fastapi import APIRouter, Depends, BackgroundTasks
from sqlalchemy.orm import Session

from app.database import get_db
from app.services.ingestion_service import ingest_all_topics

router = APIRouter(prefix="/sync", tags=["sync"])


@router.post("/", status_code=202)
async def trigger_sync(background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """Trigger a paper sync in the background."""
    background_tasks.add_task(_run_sync, db)
    return {"message": "Sync started in background"}


async def _run_sync(db: Session):
    from app.config import get_settings
    settings = get_settings()
    await ingest_all_topics(db, max_results=settings.arxiv_max_results)

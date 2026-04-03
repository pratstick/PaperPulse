"""Digest endpoints."""
from datetime import date
from typing import Optional, List

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.models.digest import Digest
from app.models.paper import Paper, PaperTopic
from app.schemas.digest import DigestRead
from app.schemas.paper import PaperRead
from app.services.digest_service import generate_digest
from app.api.users import get_or_create_default_user
from app.api.papers import _enrich

router = APIRouter(prefix="/digest", tags=["digest"])


def _build_digest_response(digest: Digest, user_id: int, db: Session) -> DigestRead:
    paper_ids = digest.paper_ids or []
    papers_map: dict[int, Paper] = {}
    if paper_ids:
        rows = (
            db.query(Paper)
            .options(
                joinedload(Paper.topics).joinedload(PaperTopic.topic),
                joinedload(Paper.summary),
            )
            .filter(Paper.id.in_(paper_ids))
            .all()
        )
        papers_map = {p.id: p for p in rows}

    enriched = [_enrich(papers_map[pid], user_id, db) for pid in paper_ids if pid in papers_map]

    result = DigestRead.model_validate(digest)
    result.papers = enriched
    return result


@router.get("/today", response_model=DigestRead)
def get_today_digest(db: Session = Depends(get_db)):
    user = get_or_create_default_user(db)
    digest = generate_digest(db, user.id)
    return _build_digest_response(digest, user.id, db)


@router.get("/", response_model=List[DigestRead])
def list_digests(db: Session = Depends(get_db)):
    user = get_or_create_default_user(db)
    digests = (
        db.query(Digest)
        .filter(Digest.user_id == user.id)
        .order_by(Digest.date.desc())
        .limit(30)
        .all()
    )
    return [_build_digest_response(d, user.id, db) for d in digests]

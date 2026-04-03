"""Paper listing, search, and state endpoints."""
from __future__ import annotations

from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.models.paper import Paper, PaperTopic
from app.models.user_paper_state import UserPaperState
from app.schemas.paper import PaperRead, PaperListResponse
from app.schemas.user import UserPaperStateUpdate, UserPaperStateRead
from app.api.users import get_or_create_default_user

router = APIRouter(prefix="/papers", tags=["papers"])


def _enrich(paper: Paper, user_id: int, db: Session) -> PaperRead:
    state = db.query(UserPaperState).filter(
        UserPaperState.user_id == user_id,
        UserPaperState.paper_id == paper.id,
    ).first()
    data = PaperRead.model_validate(paper)
    if state:
        data.is_saved = state.is_saved
        data.is_read = state.is_read
    # flatten topics
    data.topics = [pt.topic for pt in paper.topics]
    return data


@router.get("/", response_model=PaperListResponse)
def list_papers(
    topic_id: Optional[int] = None,
    search: Optional[str] = None,
    min_score: Optional[float] = None,
    is_saved: Optional[bool] = None,
    is_read: Optional[bool] = None,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    user = get_or_create_default_user(db)

    query = db.query(Paper).options(
        joinedload(Paper.topics).joinedload(PaperTopic.topic),
        joinedload(Paper.summary),
    )

    if topic_id is not None:
        query = query.join(PaperTopic).filter(PaperTopic.topic_id == topic_id)

    if search:
        like = f"%{search}%"
        query = query.filter(
            Paper.title.ilike(like) | Paper.abstract.ilike(like)
        )

    if min_score is not None:
        query = query.filter(Paper.importance_score >= min_score)

    if is_saved is not None or is_read is not None:
        query = query.join(
            UserPaperState,
            (UserPaperState.paper_id == Paper.id) & (UserPaperState.user_id == user.id),
        )
        if is_saved is not None:
            query = query.filter(UserPaperState.is_saved == is_saved)
        if is_read is not None:
            query = query.filter(UserPaperState.is_read == is_read)

    total = query.count()
    papers = (
        query.order_by(Paper.importance_score.desc(), Paper.published_at.desc())
        .offset((page - 1) * per_page)
        .limit(per_page)
        .all()
    )

    return PaperListResponse(
        items=[_enrich(p, user.id, db) for p in papers],
        total=total,
        page=page,
        per_page=per_page,
    )


@router.get("/{paper_id}", response_model=PaperRead)
def get_paper(paper_id: int, db: Session = Depends(get_db)):
    user = get_or_create_default_user(db)
    paper = (
        db.query(Paper)
        .options(
            joinedload(Paper.topics).joinedload(PaperTopic.topic),
            joinedload(Paper.summary),
        )
        .filter(Paper.id == paper_id)
        .first()
    )
    if not paper:
        raise HTTPException(404, "Paper not found")
    return _enrich(paper, user.id, db)


@router.patch("/{paper_id}/state", response_model=UserPaperStateRead)
def update_paper_state(paper_id: int, data: UserPaperStateUpdate, db: Session = Depends(get_db)):
    user = get_or_create_default_user(db)
    paper = db.query(Paper).filter(Paper.id == paper_id).first()
    if not paper:
        raise HTTPException(404, "Paper not found")

    state = db.query(UserPaperState).filter(
        UserPaperState.user_id == user.id,
        UserPaperState.paper_id == paper_id,
    ).first()
    if not state:
        state = UserPaperState(user_id=user.id, paper_id=paper_id)
        db.add(state)

    if data.is_saved is not None:
        state.is_saved = data.is_saved
    if data.is_read is not None:
        state.is_read = data.is_read

    db.commit()
    db.refresh(state)
    return state


@router.get("/{paper_id}/related", response_model=List[PaperRead])
def get_related_papers(paper_id: int, db: Session = Depends(get_db)):
    user = get_or_create_default_user(db)
    paper = db.query(Paper).filter(Paper.id == paper_id).first()
    if not paper:
        raise HTTPException(404, "Paper not found")

    topic_ids = [pt.topic_id for pt in paper.topics]
    if not topic_ids:
        return []

    related = (
        db.query(Paper)
        .options(
            joinedload(Paper.topics).joinedload(PaperTopic.topic),
            joinedload(Paper.summary),
        )
        .join(PaperTopic)
        .filter(PaperTopic.topic_id.in_(topic_ids), Paper.id != paper_id)
        .order_by(Paper.importance_score.desc())
        .limit(5)
        .all()
    )
    return [_enrich(p, user.id, db) for p in related]

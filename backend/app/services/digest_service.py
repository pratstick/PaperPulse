"""Digest generation service."""
from __future__ import annotations

from datetime import date, datetime, timezone
from typing import Optional

from sqlalchemy.orm import Session

from app.models.digest import Digest
from app.models.paper import Paper, PaperTopic
from app.models.topic import UserTopic
from app.models.user_paper_state import UserPaperState


def generate_digest(db: Session, user_id: int, digest_date: Optional[date] = None, top_n: int = 10) -> Digest:
    """Generate or regenerate the digest for a user on a given date."""
    if digest_date is None:
        digest_date = date.today()

    # user's topic IDs
    user_topic_ids = [
        ut.topic_id for ut in db.query(UserTopic).filter(UserTopic.user_id == user_id).all()
    ]

    # paper IDs already read
    read_paper_ids = {
        s.paper_id
        for s in db.query(UserPaperState).filter(
            UserPaperState.user_id == user_id,
            UserPaperState.is_read == True,  # noqa
        ).all()
    }

    # query papers linked to user topics, ordered by importance score
    query = db.query(Paper)
    if user_topic_ids:
        query = query.join(PaperTopic).filter(PaperTopic.topic_id.in_(user_topic_ids))
    papers = query.order_by(Paper.importance_score.desc()).limit(top_n * 3).all()

    # filter out read papers and take top_n
    selected = [p for p in papers if p.id not in read_paper_ids][:top_n]
    paper_ids = [p.id for p in selected]

    # estimated read time: ~1 min per paper summary
    read_mins = max(1, len(paper_ids))

    existing = (
        db.query(Digest)
        .filter(Digest.user_id == user_id, Digest.date == digest_date)
        .first()
    )
    if existing:
        existing.paper_ids = paper_ids
        existing.generated_at = datetime.now(timezone.utc)
        existing.estimated_read_minutes = read_mins
        db.commit()
        db.refresh(existing)
        return existing

    digest = Digest(
        user_id=user_id,
        date=digest_date,
        paper_ids=paper_ids,
        estimated_read_minutes=read_mins,
    )
    db.add(digest)
    db.commit()
    db.refresh(digest)
    return digest

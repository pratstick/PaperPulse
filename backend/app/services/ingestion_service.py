"""Paper ingestion pipeline: fetch → deduplicate → summarize → score → store."""
from __future__ import annotations

import logging
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.models.paper import Paper, PaperTopic
from app.models.paper_summary import PaperSummary
from app.models.topic import Topic
from app.services.arxiv_service import fetch_papers
from app.services.llm_service import get_llm_provider
from app.services.ranking_service import compute_importance_score

logger = logging.getLogger(__name__)


async def ingest_papers_for_topic(db: Session, topic: Topic, max_results: int = 25) -> int:
    """Fetch, store, summarize, and score papers for a topic. Returns count of new papers."""
    raw_papers = await fetch_papers(
        arxiv_category=topic.arxiv_category,
        arxiv_query=topic.arxiv_query,
        max_results=max_results,
    )

    llm = get_llm_provider()
    new_count = 0

    for raw in raw_papers:
        existing = db.query(Paper).filter(Paper.arxiv_id == raw["arxiv_id"]).first()
        if existing:
            # still link topic if not already linked
            _ensure_topic_link(db, existing, topic)
            continue

        paper = Paper(
            arxiv_id=raw["arxiv_id"],
            title=raw["title"],
            authors=raw["authors"],
            abstract=raw["abstract"],
            published_at=raw["published_at"],
            updated_at=raw.get("updated_at"),
            arxiv_url=raw.get("arxiv_url"),
            pdf_url=raw.get("pdf_url"),
        )
        db.add(paper)
        db.flush()  # get paper.id

        _ensure_topic_link(db, paper, topic)

        # summarize
        try:
            result = await llm.summarize(paper.title, paper.abstract)
        except Exception as exc:
            logger.warning("LLM summarization failed for %s: %s", paper.arxiv_id, exc)
            result = {}

        summary = PaperSummary(
            paper_id=paper.id,
            summary=result.get("summary", "Summary unavailable."),
            key_contributions=result.get("key_contributions", []),
            practical_relevance=result.get("practical_relevance"),
            limitations=result.get("limitations"),
            why_it_matters=result.get("why_it_matters"),
        )
        db.add(summary)

        # score
        llm_score = result.get("importance_score")
        paper.importance_score = compute_importance_score(
            published_at=paper.published_at,
            abstract=paper.abstract,
            paper_topic_ids=[topic.id],
            user_topic_ids=[topic.id],
            llm_score=float(llm_score) if llm_score is not None else None,
        )

        db.commit()
        new_count += 1
        logger.info("Ingested paper: %s", paper.arxiv_id)

    return new_count


def _ensure_topic_link(db: Session, paper: Paper, topic: Topic) -> None:
    exists = db.query(PaperTopic).filter(
        PaperTopic.paper_id == paper.id,
        PaperTopic.topic_id == topic.id,
    ).first()
    if not exists:
        db.add(PaperTopic(paper_id=paper.id, topic_id=topic.id))
        db.commit()


async def ingest_all_topics(db: Session, max_results: int = 25) -> dict:
    topics = db.query(Topic).all()
    results = {}
    for topic in topics:
        try:
            count = await ingest_papers_for_topic(db, topic, max_results)
            results[topic.name] = count
        except Exception as exc:
            logger.error("Ingestion failed for topic %s: %s", topic.name, exc)
            results[topic.name] = 0
    return results

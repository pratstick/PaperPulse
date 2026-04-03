"""Paper ranking / scoring service."""
from __future__ import annotations

import math
from datetime import datetime, timezone
from typing import Any


NOVELTY_KEYWORDS = {
    "novel", "new", "propose", "introduce", "outperform", "state-of-the-art",
    "sota", "surpass", "first", "efficient", "scalable", "robust", "generalize",
    "breakthrough", "significant", "substantial", "large-scale",
}


def _recency_score(published_at: datetime, max_days: int = 30) -> float:
    """Return 0–40 based on how recent the paper is."""
    now = datetime.now(timezone.utc)
    if published_at.tzinfo is None:
        published_at = published_at.replace(tzinfo=timezone.utc)
    age_days = (now - published_at).days
    if age_days < 0:
        age_days = 0
    return max(0.0, 40.0 * (1 - age_days / max_days))


def _novelty_score(abstract: str) -> float:
    """Return 0–30 based on novelty keywords in abstract."""
    words = set(abstract.lower().split())
    hits = words & NOVELTY_KEYWORDS
    return min(30.0, len(hits) * 3.0)


def _topic_match_score(paper_topic_ids: list[int], user_topic_ids: list[int]) -> float:
    """Return 0–30 based on topic overlap."""
    if not user_topic_ids:
        return 15.0
    overlap = set(paper_topic_ids) & set(user_topic_ids)
    return min(30.0, len(overlap) * 15.0)


def compute_importance_score(
    published_at: datetime,
    abstract: str,
    paper_topic_ids: list[int],
    user_topic_ids: list[int],
    llm_score: float | None = None,
) -> float:
    """Combine signals into a 0–100 importance score."""
    base = _recency_score(published_at) + _novelty_score(abstract) + _topic_match_score(paper_topic_ids, user_topic_ids)
    if llm_score is not None:
        # blend: 60% computed + 40% LLM
        return round(min(100.0, base * 0.6 + llm_score * 0.4), 1)
    return round(min(100.0, base), 1)

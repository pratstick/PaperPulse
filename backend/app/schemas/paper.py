from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from .topic import TopicRead


class PaperSummaryRead(BaseModel):
    id: int
    summary: str
    key_contributions: List[str]
    practical_relevance: Optional[str] = None
    limitations: Optional[str] = None
    why_it_matters: Optional[str] = None

    model_config = {"from_attributes": True}


class PaperRead(BaseModel):
    id: int
    arxiv_id: str
    title: str
    authors: List[str]
    abstract: str
    published_at: datetime
    updated_at: Optional[datetime] = None
    arxiv_url: Optional[str] = None
    pdf_url: Optional[str] = None
    importance_score: float
    fetched_at: datetime
    topics: List[TopicRead] = []
    summary: Optional[PaperSummaryRead] = None
    is_saved: bool = False
    is_read: bool = False

    model_config = {"from_attributes": True}


class PaperListResponse(BaseModel):
    items: List[PaperRead]
    total: int
    page: int
    per_page: int

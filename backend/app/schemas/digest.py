from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime
from .paper import PaperRead


class DigestRead(BaseModel):
    id: int
    user_id: int
    date: date
    paper_ids: List[int]
    generated_at: datetime
    estimated_read_minutes: int
    papers: List[PaperRead] = []

    model_config = {"from_attributes": True}

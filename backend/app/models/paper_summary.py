from sqlalchemy import Column, Integer, Text, JSON, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.database import Base


class PaperSummary(Base):
    __tablename__ = "paper_summaries"

    id = Column(Integer, primary_key=True, index=True)
    paper_id = Column(Integer, ForeignKey("papers.id"), unique=True, nullable=False)
    summary = Column(Text, nullable=False)           # 3–5 sentence summary
    key_contributions = Column(JSON, default=list)   # bullet list
    practical_relevance = Column(Text, nullable=True)
    limitations = Column(Text, nullable=True)
    why_it_matters = Column(Text, nullable=True)
    llm_provider = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    paper = relationship("Paper", back_populates="summary")

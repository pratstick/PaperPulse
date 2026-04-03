from sqlalchemy import Column, Integer, String, Text, DateTime, Float, JSON, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.database import Base


class Paper(Base):
    __tablename__ = "papers"

    id = Column(Integer, primary_key=True, index=True)
    arxiv_id = Column(String, unique=True, index=True)
    title = Column(String, nullable=False)
    authors = Column(JSON, default=list)       # list of author names
    abstract = Column(Text, nullable=False)
    published_at = Column(DateTime, nullable=False)
    updated_at = Column(DateTime, nullable=True)
    arxiv_url = Column(String, nullable=True)
    pdf_url = Column(String, nullable=True)
    importance_score = Column(Float, default=0.0)  # 0–100
    fetched_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    topics = relationship("PaperTopic", back_populates="paper", cascade="all, delete-orphan")
    summary = relationship("PaperSummary", back_populates="paper", uselist=False, cascade="all, delete-orphan")
    user_states = relationship("UserPaperState", back_populates="paper", cascade="all, delete-orphan")


class PaperTopic(Base):
    __tablename__ = "paper_topics"

    id = Column(Integer, primary_key=True, index=True)
    paper_id = Column(Integer, ForeignKey("papers.id"), nullable=False)
    topic_id = Column(Integer, ForeignKey("topics.id"), nullable=False)

    paper = relationship("Paper", back_populates="topics")
    topic = relationship("Topic", back_populates="paper_topics")

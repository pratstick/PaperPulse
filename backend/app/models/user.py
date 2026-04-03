from sqlalchemy import Column, Integer, String, DateTime, Boolean, JSON
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, default="Local User")
    email = Column(String, unique=True, index=True, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    preferences = Column(JSON, default=dict)

    topics = relationship("UserTopic", back_populates="user", cascade="all, delete-orphan")
    paper_states = relationship("UserPaperState", back_populates="user", cascade="all, delete-orphan")
    digests = relationship("Digest", back_populates="user", cascade="all, delete-orphan")

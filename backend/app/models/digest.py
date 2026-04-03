from sqlalchemy import Column, Integer, String, Date, JSON, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.database import Base


class Digest(Base):
    __tablename__ = "digests"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    date = Column(Date, nullable=False)
    paper_ids = Column(JSON, default=list)      # ordered list of paper IDs
    generated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    estimated_read_minutes = Column(Integer, default=5)

    user = relationship("User", back_populates="digests")

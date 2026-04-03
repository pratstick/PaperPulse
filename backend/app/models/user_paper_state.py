from sqlalchemy import Column, Integer, Boolean, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.database import Base


class UserPaperState(Base):
    __tablename__ = "user_paper_states"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    paper_id = Column(Integer, ForeignKey("papers.id"), nullable=False)
    is_saved = Column(Boolean, default=False)
    is_read = Column(Boolean, default=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    __table_args__ = (UniqueConstraint("user_id", "paper_id", name="uq_user_paper"),)

    user = relationship("User", back_populates="paper_states")
    paper = relationship("Paper", back_populates="user_states")

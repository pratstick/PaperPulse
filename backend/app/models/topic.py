from sqlalchemy import Column, Integer, String, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class Topic(Base):
    __tablename__ = "topics"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    display_name = Column(String)
    arxiv_category = Column(String, nullable=True)  # e.g. cs.LG, cs.CV
    arxiv_query = Column(String, nullable=True)     # free-form query
    is_default = Column(Boolean, default=False)
    icon = Column(String, nullable=True)

    user_topics = relationship("UserTopic", back_populates="topic", cascade="all, delete-orphan")
    paper_topics = relationship("PaperTopic", back_populates="topic", cascade="all, delete-orphan")


class UserTopic(Base):
    __tablename__ = "user_topics"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    topic_id = Column(Integer, ForeignKey("topics.id"), nullable=False)

    user = relationship("User", back_populates="topics")
    topic = relationship("Topic", back_populates="user_topics")

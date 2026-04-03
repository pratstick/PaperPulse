"""Topic management endpoints."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models.topic import Topic, UserTopic
from app.schemas.topic import TopicCreate, TopicRead, UserTopicCreate, UserTopicRead
from app.api.users import get_or_create_default_user

router = APIRouter(prefix="/topics", tags=["topics"])


@router.get("/", response_model=List[TopicRead])
def list_topics(db: Session = Depends(get_db)):
    return db.query(Topic).order_by(Topic.is_default.desc(), Topic.display_name).all()


@router.post("/", response_model=TopicRead, status_code=201)
def create_topic(data: TopicCreate, db: Session = Depends(get_db)):
    existing = db.query(Topic).filter(Topic.name == data.name).first()
    if existing:
        raise HTTPException(400, "Topic already exists")
    topic = Topic(**data.model_dump())
    db.add(topic)
    db.commit()
    db.refresh(topic)
    return topic


@router.delete("/{topic_id}", status_code=204)
def delete_topic(topic_id: int, db: Session = Depends(get_db)):
    topic = db.query(Topic).filter(Topic.id == topic_id).first()
    if not topic:
        raise HTTPException(404, "Topic not found")
    if topic.is_default:
        raise HTTPException(400, "Cannot delete default topics")
    db.delete(topic)
    db.commit()


# ── User ↔ Topic subscriptions ─────────────────────────────────────────────

@router.get("/subscriptions", response_model=List[UserTopicRead])
def get_subscriptions(db: Session = Depends(get_db)):
    user = get_or_create_default_user(db)
    return user.topics


@router.post("/subscriptions", response_model=UserTopicRead, status_code=201)
def subscribe(data: UserTopicCreate, db: Session = Depends(get_db)):
    user = get_or_create_default_user(db)
    topic = db.query(Topic).filter(Topic.id == data.topic_id).first()
    if not topic:
        raise HTTPException(404, "Topic not found")
    existing = db.query(UserTopic).filter(
        UserTopic.user_id == user.id, UserTopic.topic_id == data.topic_id
    ).first()
    if existing:
        return existing
    ut = UserTopic(user_id=user.id, topic_id=data.topic_id)
    db.add(ut)
    db.commit()
    db.refresh(ut)
    return ut


@router.delete("/subscriptions/{topic_id}", status_code=204)
def unsubscribe(topic_id: int, db: Session = Depends(get_db)):
    user = get_or_create_default_user(db)
    ut = db.query(UserTopic).filter(
        UserTopic.user_id == user.id, UserTopic.topic_id == topic_id
    ).first()
    if not ut:
        raise HTTPException(404, "Subscription not found")
    db.delete(ut)
    db.commit()

#!/usr/bin/env python3
"""Seed script: initializes DB, seeds topics, and optionally fetches demo papers."""
import asyncio
import os
import sys

# ensure we run from backend/
sys.path.insert(0, os.path.dirname(__file__))

from app.database import init_db, SessionLocal
from app.models.topic import Topic, UserTopic
from app.models.user import User
from app.utils.seed_data import DEFAULT_TOPICS


def seed():
    init_db()
    db = SessionLocal()
    try:
        # default user
        user = db.query(User).filter(User.id == 1).first()
        if not user:
            user = User(id=1, name="Local User")
            db.add(user)
            db.commit()
            db.refresh(user)
            print("✓ Default user created")

        # topics
        for t in DEFAULT_TOPICS:
            existing = db.query(Topic).filter(Topic.name == t["name"]).first()
            if not existing:
                topic = Topic(**t)
                db.add(topic)
                db.commit()
                db.refresh(topic)
                print(f"✓ Topic created: {t['display_name']}")

        # subscribe user to all default topics
        topics = db.query(Topic).filter(Topic.is_default == True).all()  # noqa
        for topic in topics:
            exists = db.query(UserTopic).filter(
                UserTopic.user_id == 1, UserTopic.topic_id == topic.id
            ).first()
            if not exists:
                db.add(UserTopic(user_id=1, topic_id=topic.id))
        db.commit()
        print("✓ User subscribed to default topics")

        # optionally fetch demo papers
        if "--fetch" in sys.argv:
            print("\nFetching demo papers from arXiv (this may take a minute)...")
            from app.services.ingestion_service import ingest_papers_for_topic
            from app.config import get_settings
            settings = get_settings()

            async def run():
                for topic in topics[:3]:  # fetch for first 3 topics
                    print(f"  Fetching: {topic.display_name}...")
                    count = await ingest_papers_for_topic(db, topic, max_results=10)
                    print(f"  ✓ {count} new papers for {topic.display_name}")

            asyncio.run(run())

        print("\n✅ Seed complete! Start the server with: uvicorn app.main:app --reload")
    finally:
        db.close()


if __name__ == "__main__":
    seed()

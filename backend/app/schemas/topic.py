from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class TopicBase(BaseModel):
    name: str
    display_name: str
    arxiv_category: Optional[str] = None
    arxiv_query: Optional[str] = None
    is_default: bool = False
    icon: Optional[str] = None


class TopicCreate(TopicBase):
    pass


class TopicRead(TopicBase):
    id: int

    model_config = {"from_attributes": True}


class UserTopicCreate(BaseModel):
    topic_id: int


class UserTopicRead(BaseModel):
    id: int
    user_id: int
    topic_id: int
    topic: TopicRead

    model_config = {"from_attributes": True}

from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from .topic import UserTopicRead


class UserCreate(BaseModel):
    name: str = "Local User"
    email: Optional[str] = None


class UserRead(BaseModel):
    id: int
    name: str
    email: Optional[str] = None
    created_at: datetime
    topics: List[UserTopicRead] = []

    model_config = {"from_attributes": True}


class UserPaperStateUpdate(BaseModel):
    is_saved: Optional[bool] = None
    is_read: Optional[bool] = None


class UserPaperStateRead(BaseModel):
    id: int
    user_id: int
    paper_id: int
    is_saved: bool
    is_read: bool

    model_config = {"from_attributes": True}

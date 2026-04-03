"""User endpoints — auth-free single-user mode."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserRead

router = APIRouter(prefix="/users", tags=["users"])

DEFAULT_USER_ID = 1


def get_or_create_default_user(db: Session) -> User:
    user = db.query(User).filter(User.id == DEFAULT_USER_ID).first()
    if not user:
        user = User(id=DEFAULT_USER_ID, name="Local User")
        db.add(user)
        db.commit()
        db.refresh(user)
    return user


@router.get("/me", response_model=UserRead)
def get_me(db: Session = Depends(get_db)):
    return get_or_create_default_user(db)


@router.put("/me", response_model=UserRead)
def update_me(data: UserCreate, db: Session = Depends(get_db)):
    user = get_or_create_default_user(db)
    user.name = data.name
    if data.email:
        user.email = data.email
    db.commit()
    db.refresh(user)
    return user

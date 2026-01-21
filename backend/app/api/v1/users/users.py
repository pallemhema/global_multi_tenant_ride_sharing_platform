from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.dependencies import get_db
from app.core.security.jwt import verify_access_token
from app.models.core.users.users import User

router = APIRouter(prefix="/users")


@router.get("/{user_id}")
def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    _: dict = Depends(verify_access_token),
):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(404, "User not found")
    return user

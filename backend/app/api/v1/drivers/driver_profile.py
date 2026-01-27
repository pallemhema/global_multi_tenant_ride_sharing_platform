from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.dependencies import get_db
from app.models.core.drivers.drivers import Driver
from app.models.core.users.users import User
from app.models.core.users.user_profiles import UserProfile
from app.core.security.roles import require_driver


router = APIRouter(prefix="/driver", tags=["Driver"])
@router.get("/profile")
def get_driver_profile(
    db: Session = Depends(get_db),
    driver=Depends(require_driver),
):
    result = (
        db.query(Driver, User, UserProfile)
        .join(User, User.user_id == Driver.user_id)
        .outerjoin(UserProfile, UserProfile.user_id == User.user_id)
        .filter(Driver.user_id == driver.user_id)  # ✅ FIX
        .first()
    )

    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Driver profile not found"
        )

    driver, user_obj, user_profile = result

    return {
        "driver": driver,
        "user": user_obj,
        "user_profile": user_profile,
    }

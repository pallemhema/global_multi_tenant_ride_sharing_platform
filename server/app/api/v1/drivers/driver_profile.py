from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.dependencies import get_db
from app.models.core.drivers.drivers import Driver
from app.models.core.users.users import User
from app.models.core.users.user_profiles import UserProfile
from app.core.security.roles import require_driver
from app.models.core.drivers.driver_current_status import DriverCurrentStatus

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
        .filter(Driver.user_id == driver.user_id)
        .first()
    )

    if not result:
        raise HTTPException(
            status_code=404,
            detail="Driver profile not found"
        )

    driver_obj, user_obj, user_profile = result

    # Fetch city_id from DriverCurrentStatus
    status = db.query(DriverCurrentStatus).filter_by(driver_id=driver_obj.driver_id, tenant_id=driver_obj.tenant_id).first()
    city_id = status.city_id if status else None

    # Convert driver_obj to dict and add city_id
    driver_dict = driver_obj.__dict__.copy()
    driver_dict['city_id'] = city_id

    return {
        "driver": driver_dict,
        "user": user_obj,
        "user_profile": user_profile,
    }

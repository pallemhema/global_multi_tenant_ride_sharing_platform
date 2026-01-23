from fastapi import Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.dependencies import get_db
from app.core.security.jwt import verify_access_token
from app.models.core.users.users import User
from app.models.core.drivers.drivers import Driver
from app.models.core.fleet_owners.fleet_owners import FleetOwner
from app.models.core.tenants.tenant_staff import TenantStaff

# -------------------------------
# GUARDS
# -------------------------------
def require_rider(
    db: Session = Depends(get_db),
    user: dict = Depends(verify_access_token),
):
    if user.get("role") != "rider":
        raise HTTPException(403, "Rider access required")

    user_id = int(user.get("sub"))

    rider = (
        db.query(User)
        .filter(
            User.user_id == user_id,
            User.is_active.is_(True),
        )
        .first()
    )

    if not rider:
        raise HTTPException(403, "Rider not active")

    return rider   # ✅ ORM User object




def require_driver(
    db: Session = Depends(get_db),
    user: dict = Depends(verify_access_token),
):
    if user["role"] != "driver":
        raise HTTPException(403, "Driver access required")

    driver_id = user.get("driver_id")
    if not driver_id:
        raise HTTPException(401, "Invalid driver token")

    driver = (
        db.query(Driver)
        .filter(
            Driver.driver_id == driver_id,
            Driver.is_active.is_(True),
        )
        .first()
    )

    if not driver:
        raise HTTPException(403, "Driver not active")

    return driver   # ✅ ORM object



def require_fleet_owner(
    db: Session = Depends(get_db),
    user: dict = Depends(verify_access_token),
):
    if user["role"] != "fleet-owner":
        raise HTTPException(403, "Fleet owner access required")

    fleet = (
        db.query(FleetOwner)
        .filter(
            FleetOwner.fleet_owner_id == user.get("fleet_owner_id"),
            FleetOwner.is_active.is_(True),
        )
        .first()
    )

    if not fleet:
        raise HTTPException(403, "Fleet owner not active")

    return fleet



def require_tenant_admin(user=Depends(verify_access_token)):
    if user["role"] != "tenant-admin":
        raise HTTPException(403)
    return user


def require_app_admin(user=Depends(verify_access_token)):
    if user["role"] != "app-admin":
        raise HTTPException(403)
    return user

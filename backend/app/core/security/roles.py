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
    """
    Allow driver access for:
    1. Users with role="driver" and active driver record
    2. Users during driver onboarding (role="rider" but has driver record)
    """
    user_id = int(user.get("sub"))
    
    # Try to find driver by user_id (works during onboarding)
    driver = (
        db.query(Driver)
        .filter(Driver.user_id == user_id)
        .first()
    )

    if not driver:
        raise HTTPException(403, "Driver record not found. Please select a tenant first.")

    return driver   # ✅ ORM object - works even if pending/inactive

def get_or_create_driver(
    db: Session = Depends(get_db),
    user: dict = Depends(verify_access_token),
) -> Driver:
    user_id = int(user.get("sub"))

    driver = (
        db.query(Driver)
        .filter(Driver.user_id == user_id)
        .first()
    )

    if not driver:
        driver = Driver(
            user_id=user_id,
            onboarding_status="draft",
        )
        db.add(driver)
        db.commit()
        db.refresh(driver)

    return driver


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



def require_tenant_admin(
    user: dict = Depends(verify_access_token),
):
    if user.get("role") != "tenant-admin":
        raise HTTPException(403, "Tenant admin access required")

    if user.get("context") != "tenant":
        raise HTTPException(403, "Invalid tenant context")

    if not user.get("tenant_id"):
        raise HTTPException(403, "Tenant scope missing")

    return user




def require_app_admin(user=Depends(verify_access_token)):
    if user["role"] != "app-admin":
        raise HTTPException(403)
    return user

def require_vehicle_owner(
    db: Session = Depends(get_db),
    user: dict = Depends(verify_access_token),
):
    role = user["role"]

    # ===== DRIVER =====
    if role == "driver":
        driver = (
            db.query(Driver)
            .filter(
                Driver.user_id == int(user["sub"]),
                Driver.driver_type == "individual",
                Driver.kyc_status=="approved"
            )
            .first()
        )

        if not driver:
            raise HTTPException(403, "Not a vehicle owner")

        return {
            "type": "driver",
            "id": driver.driver_id,
            "tenant_id": driver.tenant_id,
            "user_id": driver.user_id,   # ✅ FIX
            "role": "driver",
        }

    # ===== FLEET OWNER =====
    if role == "fleet_owner":
        fleet = (
            db.query(FleetOwner)
            .filter(
                FleetOwner.user_id == int(user["sub"]),
                FleetOwner.approval_status=="approved"
                )
            .first()
        )

        if not fleet:
            raise HTTPException(403, "Not a vehicle owner")

        return {
            "type": "fleet_owner",
            "id": fleet.fleet_owner_id,
            "tenant_id": fleet.tenant_id,
            "user_id": fleet.user_id,    # ✅ FIX
            "role": "fleet_owner",
        }

    raise HTTPException(403, "Not a vehicle owner")

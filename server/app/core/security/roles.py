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

def ensure_user_can_be_driver(db: Session, user_id: int):
    if db.query(FleetOwner).filter(FleetOwner.user_id == user_id).first():
        raise HTTPException(
            status_code=400,
            detail="User is already registered as fleet owner"
        )

    if db.query(TenantStaff).filter(TenantStaff.user_id == user_id).first():
        raise HTTPException(
            status_code=400,
            detail="Tenant staff cannot become driver"
        )
def get_or_create_driver(
    db: Session = Depends(get_db),
    user: dict = Depends(verify_access_token),
) -> Driver:
    user_id = int(user.get("sub"))
    ensure_user_can_be_driver(db, user_id)  
    
    # Try to get existing driver with FOR UPDATE lock to prevent race conditions
    driver = (
        db.query(Driver)
        .filter(Driver.user_id == user_id)
        .with_for_update()  # Lock the row to prevent concurrent modifications
        .first()
    )
    
    if not driver:
        driver = Driver(
            user_id=user_id,
            onboarding_status="not_started",
        )
        db.add(driver)
        db.commit()
        db.refresh(driver)

    return driver



def require_fleet_owner(
    db: Session = Depends(get_db),
    user: dict = Depends(verify_access_token),
):
    """
    STRICT GUARD: Requires role="fleet-owner" AND is_active=True.
    Used only for sensitive operations that need an approved fleet owner.
    
    This is the old require_fleet_owner logic - kept for backward compatibility
    but should gradually be replaced with require_fleet_owner_any_status.
    """
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

def ensure_user_can_be_fleet_owner(db: Session, user_id: int):
    if db.query(Driver).filter(Driver.user_id == user_id).first():
        raise HTTPException(
            status_code=400,
            detail="User is already registered as driver"
        )

    if db.query(TenantStaff).filter(TenantStaff.user_id == user_id).first():
        raise HTTPException(
            status_code=400,
            detail="Tenant staff cannot become fleet owner"
        )

def get_or_create_fleet_owner(
    db: Session = Depends(get_db),
    user: dict = Depends(verify_access_token),
) -> FleetOwner:
    """
    Get or create a fleet owner for the authenticated user.
    
    Note: We DON'T validate that user isn't a driver/tenant here because:
    1. The check happens when user first tries to REGISTER as fleet owner
    2. If user is already a driver/tenant, they simply can't register
    3. But we should still allow reading their fleet data if they have it
    """
    user_id = int(user.get("sub"))
    print("found fleet user :", user_id)
    
    # Try to get existing fleet owner with FOR UPDATE lock to prevent race conditions
    fleet_owner = (
        db.query(FleetOwner)
        .filter(FleetOwner.user_id == user_id)
        .with_for_update()  # Lock the row to prevent concurrent modifications
        .first()
    )

    # If not found, create one
    if not fleet_owner:
        fleet_owner = FleetOwner(
            user_id=user_id,
            business_name="",  # Empty string - will be filled during onboarding
            onboarding_status="draft",
        )
        db.add(fleet_owner)
        db.commit()
        db.refresh(fleet_owner)

    print("fleet user fleet id:",fleet_owner.fleet_owner_id)
    return fleet_owner
    




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
            )
            .first()
        )

        if not driver:
            raise HTTPException(403, "Not a vehicle owner")

        return {
            "type": "driver",
            "id": driver.driver_id,
            "tenant_id": driver.tenant_id,
            "user_id": driver.user_id,
            "role": "driver",
        }

    # ===== FLEET OWNER =====
    if role == "fleet-owner":
        fleet = (
            db.query(FleetOwner)
            .filter(
                FleetOwner.user_id == int(user["sub"]),
            )
            .first()
        )

        if not fleet:
            raise HTTPException(403, "Not a vehicle owner")

        return {
            "type": "fleet_owner",
            "id": fleet.fleet_owner_id,
            "tenant_id": fleet.tenant_id,
            "user_id": fleet.user_id,
            "role": "fleet_owner",
        }

    raise HTTPException(403, "Not a vehicle owner")

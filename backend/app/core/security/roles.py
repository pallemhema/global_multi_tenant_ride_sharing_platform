from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.security.jwt import verify_access_token
from app.core.dependencies import get_db
from app.models.core.tenants.tenant_staff import TenantStaff

from app.models.core.fleet_owners.fleet_owners import FleetOwner
from app.models.core.drivers.drivers import Driver
from app.models.core.users.users import User

# -------------------------------------------------
# Platform-level: APP ADMIN
# -------------------------------------------------
def require_app_admin(user=Depends(verify_access_token)):
    """
    Only users with global role = app-admin
    """
    if user.get("role") != "app-admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="App-admin access required",
        )
    return user


# -------------------------------------------------
# Tenant-level: TENANT ADMIN
# -------------------------------------------------

def require_tenant_admin(
    tenant_id: int,
    user: dict = Depends(verify_access_token),
    db: Session = Depends(get_db),
):
    user_id = int(user["sub"])

    staff = (
        db.query(TenantStaff)
        .filter(
            TenantStaff.tenant_id == tenant_id,
            TenantStaff.user_id == user_id,
            TenantStaff.role_code == "admin",
            TenantStaff.status == "active",
        )
        .first()
    )

    if not staff:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Tenant admin access required",
        )

    return user
# -------------------------------------------------
# Fleet-level: Fleet Owner
# -------------------------------------------------



# 🔹 Fleet owner – ANY status (onboarding, docs upload)
def require_fleet_owner_any_status(
    db: Session = Depends(get_db),
    user: dict = Depends(verify_access_token),
):
    fleet = (
        db.query(FleetOwner)
        .filter(FleetOwner.user_id == int(user["sub"]))
        .first()
    )
    print(fleet.fleet_owner_id)

    if not fleet:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Fleet owner access required",
        )

    return fleet


# 🔹 Fleet owner – APPROVED only (vehicles, drivers, revenue)
def require_fleet_owner_active(
    db: Session = Depends(get_db),
    user: dict = Depends(verify_access_token),
):
    fleet = (
        db.query(FleetOwner)
        .filter(
            FleetOwner.user_id == int(user["sub"]),
            FleetOwner.approval_status == "approved",
            FleetOwner.is_active.is_(True),
        )
        .first()
    )
    print(fleet)
    if not fleet:
        raise HTTPException(
            status_code=403,
            detail="Approved fleet owner access required",
        )

    return fleet


def require_driver(
    db: Session = Depends(get_db),
    user: dict = Depends(verify_access_token),
):
    driver = (
        db.query(Driver)
        .filter(Driver.user_id == int(user["sub"]))
        .first()
    )
    if not driver:
        raise HTTPException(403, "Driver access required")
    return driver


def require_user(
    db: Session = Depends(get_db),
    user: dict = Depends(verify_access_token),
):
    u = (
        db.query(User)
        .filter(
            User.user_id == int(user["sub"]),
            User.is_active.is_(True),
        )
        .first()
    )

    if not u:
        raise HTTPException(403, "Login required")

    return u

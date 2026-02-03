from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from app.core.dependencies import get_db
from app.core.security.roles import require_fleet_owner
from app.schemas.core.drivers.driver_invites import DriverInviteCreate
from app.models.core.drivers.drivers import Driver
from app.schemas.core.drivers.driver_invites import DriverListOut

from sqlalchemy import and_, exists
from app.models.core.fleet_owners.driver_invites import DriverInvite
from app.models.core.fleet_owners.driver_vehicle_assignments import DriverVehicleAssignment
from app.models.core.fleet_owners.fleet_owner_drivers import FleetOwnerDriver
from app.models.core.vehicles.vehicles import Vehicle
from app.models.core.users.users import User
from app.models.core.users.user_profiles import UserProfile

router = APIRouter(
    tags=["Fleet Owner – invites"],
)

@router.get("/drivers/available")
def list_available_drivers(
    db: Session = Depends(get_db),
    fleet_owner=Depends(require_fleet_owner),
):
    tenant_id = fleet_owner.tenant_id
    approved_vehicle_exists = (
        db.query(Vehicle)
        .filter(
            Vehicle.tenant_id == fleet_owner.tenant_id,
            Vehicle.fleet_owner_id == fleet_owner.fleet_owner_id,
            Vehicle.status == "approved",
        )
    )
    
    print("approved_vehicle_exists:",approved_vehicle_exists)

    if not approved_vehicle_exists:
        return []

    # ❌ Drivers already active under any fleet
    active_fleet_membership = (
        db.query(FleetOwnerDriver.driver_id)
        .filter(
            FleetOwnerDriver.driver_id == Driver.driver_id,
            FleetOwnerDriver.is_active.is_(True),
        )
        .exists()
    )

    # ❌ Drivers with active invites (sent / accepted)
    active_invite = (
        db.query(DriverInvite.driver_id)
        .filter(
            DriverInvite.driver_id == Driver.driver_id,
            DriverInvite.invite_status.in_(["sent", "accepted"]),
        )
        .exists()
    )

    results = (
        db.query(
            Driver,
            User.phone_e164,
            UserProfile.full_name,
        )
        .join(User, User.user_id == Driver.user_id)
        .outerjoin(UserProfile, UserProfile.user_id == User.user_id)
        .filter(
            Driver.tenant_id == tenant_id,
            Driver.is_active.is_(True),
            Driver.kyc_status == "approved",
            Driver.driver_type == "fleet_driver",

            ~active_fleet_membership,
            ~active_invite,
        )
        .all()
    )
    print("eligible-drivers:",results)

    # 🎯 Normalize response
    return [
        {
            "driver_id": driver.driver_id,
            "driver_type": driver.driver_type,
            "phone_e164": phone,
            "full_name": full_name,
        }
        for driver, phone, full_name in results
    ]

@router.post("/drivers/invite")

def invite_driver(
    payload: DriverInviteCreate,
    db: Session = Depends(get_db),
    fleet_owner=Depends(require_fleet_owner),
):
    # Validate driver
    driver = (
        db.query(Driver)
        .filter(
            Driver.driver_id == payload.driver_id,
            Driver.tenant_id == fleet_owner.tenant_id,
            Driver.is_active.is_(True),
        )
        .first()
    )
    if not driver:
        raise HTTPException(404, "Driver not found or not eligible")

    # Prevent duplicate active invite
    existing = (
        db.query(DriverInvite)
        .filter(
            DriverInvite.tenant_id == fleet_owner.tenant_id,
            DriverInvite.fleet_owner_id == fleet_owner.fleet_owner_id,
            DriverInvite.driver_id == payload.driver_id,
            DriverInvite.invite_status == "sent",
        )
        .first()
    )
    if existing:
        raise HTTPException(400, "Invite already sent")

    invite = DriverInvite(
        tenant_id=fleet_owner.tenant_id,
        fleet_owner_id=fleet_owner.fleet_owner_id,
        driver_id=payload.driver_id,
        invite_status="sent",
        created_by=fleet_owner.user_id,
    )

    db.add(invite)
    db.commit()

    return {
        "status": "invite sent",
        "driver_id": payload.driver_id,
        "invite_id": invite.invite_id,
    }

@router.put("/drivers/invites/{invite_id}/cancel")
def cancel_driver_invite(
    invite_id: int,
    db: Session = Depends(get_db),
    fleet_owner = Depends(require_fleet_owner),
):
    invite = (
        db.query(DriverInvite)
        .filter(
            DriverInvite.invite_id == invite_id,
            DriverInvite.fleet_owner_id == fleet_owner.fleet_owner_id,
            DriverInvite.tenant_id == fleet_owner.tenant_id,
        )
        .first()
    )

    # 1️⃣ Invite must exist & belong to this fleet owner
    if not invite:
        raise HTTPException(404, "Invite not found")

    # 2️⃣ Already cancelled
    if invite.invite_status == "cancelled":
        raise HTTPException(400, "Invite already cancelled")

    # 3️⃣ Already accepted (critical rule)
    if invite.invite_status == "accepted":
        raise HTTPException(
            status_code=400,
            detail="Invite already accepted by driver and cannot be cancelled",
        )

    # 4️⃣ Already rejected
    if invite.invite_status == "rejected":
        raise HTTPException(
            status_code=400,
            detail="Invite already rejected by driver",
        )

    # 5️⃣ Only SENT invites can be cancelled
    if invite.invite_status != "sent":
        raise HTTPException(
            status_code=400,
            detail=f"Invite cannot be cancelled in '{invite.invite_status}' state",
        )

    # ✅ Cancel invite
    invite.invite_status = "cancelled"
    invite.cancelled_at_utc = datetime.now(timezone.utc)
    invite.cancelled_by = fleet_owner.user_id

    db.commit()

    return {
        "status": "cancelled",
        "invite_id": invite.invite_id,
        "driver_id": invite.driver_id,
    }

@router.get("/drivers/invite", response_model=list[DriverListOut])
def list_drivers_for_fleet_owner(
    db: Session = Depends(get_db),
    fleet_owner=Depends(require_fleet_owner),
):
    drivers = (
        db.query(Driver)
        .filter(
            Driver.tenant_id == fleet_owner.tenant_id,
            Driver.is_active.is_(True),
            Driver.kyc_status == "approved",
        )
        .all()
    )

    return drivers

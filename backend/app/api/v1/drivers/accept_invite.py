from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import timezone
from app.core.dependencies import get_db
from app.models.core.fleet_owners.driver_invites import DriverInvite
from app.core.security.roles import require_driver
from datetime import datetime
from app.models.core.vehicles.vehicles import Vehicle
from app.models.core.fleet_owners.driver_vehicle_assignments import DriverVehicleAssignment
from app.models.core.fleet_owners.fleet_owner_drivers import FleetOwnerDriver
from app.models.core.fleet_owners.fleet_owners import FleetOwner
ACTION_TO_STATUS = {
    "accept": "accepted",
    "reject": "rejected",
    "cancel": "cancelled",
}

router = APIRouter(
    prefix="/driver",
    tags=["Driver – invite status"],
)

@router.get("/fleet-invites")
def list_fleet_invites(
    db: Session = Depends(get_db),
    driver = Depends(require_driver),
):
    invites = (
        db.query(DriverInvite)
        .filter(
            DriverInvite.driver_id == driver.driver_id,
            DriverInvite.invite_status.in_(["sent", "accepted", "rejected"]),
        )
        .order_by(DriverInvite.created_at_utc.desc())
        .all()
    )

    return invites


@router.put("/fleet-invite/{invite_id}/accept")
def accept_fleet_invite(
    invite_id: int,
    db: Session = Depends(get_db),
    driver = Depends(require_driver),
):
    invite = (
        db.query(DriverInvite)
        .filter(
            DriverInvite.invite_id == invite_id,
            DriverInvite.driver_id == driver.driver_id,
            DriverInvite.invite_status == "sent",
        )
        .first()
    )

    if not invite:
        raise HTTPException(404, "Invite not found")

    # 🚫 Check active fleet membership
    active_membership = (
        db.query(FleetOwnerDriver)
        .filter(
            FleetOwnerDriver.driver_id == driver.driver_id,
            FleetOwnerDriver.is_active.is_(True),
        )
        .first()
    )

    if active_membership:
        raise HTTPException(
            400,
            "You are already part of a fleet. Leave current fleet first.",
        )

    # ✅ Accept invite
    invite.invite_status = "accepted"
    invite.accepted_at_utc = datetime.now(timezone.utc)

    # ✅ Add to fleet_owner_drivers
    membership = FleetOwnerDriver(
        tenant_id=invite.tenant_id,
        fleet_owner_id=invite.fleet_owner_id,
        driver_id=driver.driver_id,
        joined_at_utc=datetime.now(timezone.utc),
        is_active=True,
        created_by=driver.user_id,
    )

    # ❌ Auto-reject other pending invites
    (
        db.query(DriverInvite)
        .filter(
            DriverInvite.driver_id == driver.driver_id,
            DriverInvite.invite_status == "sent",
            DriverInvite.invite_id != invite.invite_id,
        )
        .update(
            {
                DriverInvite.invite_status: "rejected",
                DriverInvite.rejected_at_utc: datetime.now(timezone.utc),
            },
            synchronize_session=False,
        )
    )

    db.add(membership)
    db.commit()

    return {
        "status": "accepted",
        "fleet_owner_id": invite.fleet_owner_id,
    }


@router.put("/fleet-invite/{invite_id}/reject")
def reject_fleet_invite(
    invite_id: int,
    db: Session = Depends(get_db),
    driver = Depends(require_driver),
):
    invite = (
        db.query(DriverInvite)
        .filter(
            DriverInvite.invite_id == invite_id,
            DriverInvite.driver_id == driver.driver_id,
            DriverInvite.invite_status == "sent",
        )
        .first()
    )

    if not invite:
        raise HTTPException(404, "Invite not found")

    invite.invite_status = "rejected"
    invite.rejected_at_utc = datetime.now(timezone.utc)

    db.commit()

    return {"status": "rejected"}


@router.get("/assigned-vehicle")
def get_assigned_vehicle(
    db: Session = Depends(get_db),
    driver = Depends(require_driver),
):
    # 🚫 Only fleet drivers
    if driver.driver_type != "fleet_driver":
        return None

    # 1️⃣ Active vehicle assignment
    assignment = (
        db.query(DriverVehicleAssignment)
        .filter(
            DriverVehicleAssignment.driver_id == driver.driver_id,
            DriverVehicleAssignment.end_time_utc.is_(None),
        )
        .first()
    )

    if not assignment:
        return None

    # 2️⃣ Vehicle
    vehicle = (
        db.query(Vehicle)
        .filter(Vehicle.vehicle_id == assignment.vehicle_id)
        .first()
    )

    # 3️⃣ Fleet membership
    fleet_link = (
        db.query(FleetOwnerDriver)
        .filter(
            FleetOwnerDriver.driver_id == driver.driver_id,
            FleetOwnerDriver.is_active.is_(True),
        )
        .first()
    )

    fleet = None
    if fleet_link:
        fleet = (
            db.query(FleetOwner)
            .filter(FleetOwner.fleet_owner_id == fleet_link.fleet_owner_id)
            .first()
        )

    return {
        "assignment_id": assignment.assignment_id,
        "assigned_at_utc": assignment.start_time_utc,

        "vehicle": {
            "vehicle_id": vehicle.vehicle_id,
            "license_plate": vehicle.license_plate,
            "category_code": vehicle.category_code,
            "model": vehicle.model,
        },

        "fleet": {
            "fleet_owner_id": fleet.fleet_owner_id,
            "business_name": fleet.business_name,
        } if fleet else None,
    }

# @router.put("/return/{assignment_id}")
# def return_vehicle(
#     assignment_id: int,
#     db: Session = Depends(get_db),
#     fleet_owner=Depends(require_fleet_owner),
# ):
#     assignment = (
#         db.query(DriverVehicleAssignment)
#         .filter(
#             DriverVehicleAssignment.assignment_id == assignment_id,
#             DriverVehicleAssignment.end_time_utc.is_(None),
#         )
#         .first()
#     )

#     if not assignment:
#         raise HTTPException(
#             status_code=404,
#             detail="Active assignment not found",
#         )

#     assignment.end_time_utc = datetime.now(timezone.utc)
#     assignment.is_active = False
#     assignment.updated_by = fleet_owner.user_id

#     db.commit()

#     return {
#         "status": "returned",
#         "assignment_id": assignment_id,
#         "returned_at": assignment.end_time_utc,
#     }

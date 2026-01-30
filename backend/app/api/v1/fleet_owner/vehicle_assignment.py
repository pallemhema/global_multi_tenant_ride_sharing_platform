from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime

from app.core.dependencies import get_db
from app.core.security.roles import require_fleet_owner
from app.models.core.fleet_owners.driver_invites import DriverInvite
from app.models.core.fleet_owners.driver_vehicle_assignments import DriverVehicleAssignment
from app.models.core.vehicles.vehicles import Vehicle


from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime


from app.models.core.vehicles.vehicles import Vehicle
from app.schemas.core.drivers.driver_vehicle_assigment import DriverVehicleAssignmentCreate

router = APIRouter(
    tags=["Fleet Owner – Vehicle Assignment"],
)


@router.post("/drivers/assign-vehicle")
def assign_vehicle_to_driver(
    payload:DriverVehicleAssignmentCreate,
    db: Session = Depends(get_db),
    fleet_owner=Depends(require_fleet_owner),
):
    # 1️⃣ Driver must have accepted invite
    invite = (
        db.query(DriverInvite)
        .filter(
            DriverInvite.tenant_id == fleet_owner.tenant_id,
            DriverInvite.fleet_owner_id == fleet_owner.fleet_owner_id,
            DriverInvite.driver_id == payload.driver_id,
            DriverInvite.invite_status == "accepted",
        )
        .first()
    )
    if not invite:
        raise HTTPException(400, "Driver not part of fleet")

    # 2️⃣ Driver must NOT already have an active assignment
    active_assignment = (
        db.query(DriverVehicleAssignment)
        .filter(
            DriverVehicleAssignment.driver_id == payload.driver_id,
            DriverVehicleAssignment.is_active.is_(True),
        )
        .first()
    )
    if active_assignment:
        raise HTTPException(
            400,
            "Driver already has a vehicle assigned. Return it before reassigning.",
        )

    # 3️⃣ Vehicle must belong to fleet owner and be active
    vehicle = (
        db.query(Vehicle)
        .filter(
            Vehicle.vehicle_id == payload.vehicle_id,
            Vehicle.fleet_owner_id == fleet_owner.fleet_owner_id,
            Vehicle.status == "active",
        )
        .first()
    )
    if not vehicle:
        raise HTTPException(400, "Invalid or inactive vehicle")

    # 4️⃣ Create assignment
    assignment = DriverVehicleAssignment(
        tenant_id=fleet_owner.tenant_id,
        driver_id=payload.driver_id,
        vehicle_id=payload.vehicle_id,
        start_time_utc=datetime.utcnow(),
        is_active=True,
        created_by=fleet_owner.user_id,
    )

    db.add(assignment)
    db.commit()

    return {
        "status": "vehicle assigned",
        "driver_id": payload.driver_id,
        "vehicle_id": payload.vehicle_id,
    }

@router.post("/drivers/{driver_id}/return-vehicle")
def return_vehicle_from_driver(
    driver_id: int,
    db: Session = Depends(get_db),
    fleet_owner=Depends(require_fleet_owner),
):
    assignment = (
        db.query(DriverVehicleAssignment)
        .filter(
            DriverVehicleAssignment.driver_id == driver_id,
            DriverVehicleAssignment.is_active.is_(True),
        )
        .first()
    )

    if not assignment:
        raise HTTPException(404, "No active vehicle assignment found")

    assignment.is_active = False
    assignment.end_time_utc = datetime.utcnow()
    assignment.updated_by = fleet_owner.user_id

    db.commit()

    return {
        "status": "vehicle returned",
        "driver_id": driver_id,
        "vehicle_id": assignment.vehicle_id,
    }

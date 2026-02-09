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

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from app.core.dependencies import get_db
from app.core.security.roles import require_fleet_owner
from app.models.core.fleet_owners.driver_vehicle_assignments import DriverVehicleAssignment

router = APIRouter(
    tags=["Fleet Owner – Vehicle Assignment"],
)

# app/schemas/core/fleet_owners/vehicle_assignments.py

from pydantic import BaseModel

class VehicleAssignmentCreate(BaseModel):
    driver_id: int
    vehicle_id: int

# @router.post("/vehicle-assignments")
# def assign_vehicle(
#     driver_id: int,
#     vehicle_id: int,
#     db: Session = Depends(get_db),
#     fleet_owner=Depends(require_fleet_owner),
# ):
#     # 🚫 Rule 1: Vehicle already assigned?
#     active_vehicle_assignment = (
#         db.query(DriverVehicleAssignment)
#         .filter(
#             DriverVehicleAssignment.vehicle_id == vehicle_id,
#             DriverVehicleAssignment.end_time_utc.is_(None),
#         )
#         .first()
#     )

#     if active_vehicle_assignment:
#         raise HTTPException(
#             status_code=409,
#             detail="Vehicle is already assigned to another driver",
#         )

#     # 🚫 Rule 2: Driver already has a vehicle?
#     active_driver_assignment = (
#         db.query(DriverVehicleAssignment)
#         .filter(
#             DriverVehicleAssignment.driver_id == driver_id,
#             DriverVehicleAssignment.end_time_utc.is_(None),
#         )
#         .first()
#     )

#     if active_driver_assignment:
#         raise HTTPException(
#             status_code=409,
#             detail="Driver already has an active vehicle assignment",
#         )

#     # ✅ Assign vehicle
#     assignment = DriverVehicleAssignment(
#         tenant_id=fleet_owner.tenant_id,
#         driver_id=driver_id,
#         vehicle_id=vehicle_id,
#         start_time_utc=datetime.now(timezone.utc),
#         is_active=True,
#         created_by=fleet_owner.user_id,
#     )

#     db.add(assignment)
#     db.commit()

#     return {
#         "status": "assigned",
#         "driver_id": driver_id,
#         "vehicle_id": vehicle_id,
#         "assigned_at": assignment.start_time_utc,
#     }

@router.post("/vehicle-assignments")
def assign_vehicle(
    payload: VehicleAssignmentCreate,
    db: Session = Depends(get_db),
    fleet_owner=Depends(require_fleet_owner),
):
    driver_id = payload.driver_id
    vehicle_id = payload.vehicle_id

    # 🚫 Rule 1: Vehicle already assigned?
    active_vehicle_assignment = (
        db.query(DriverVehicleAssignment)
        .filter(
            DriverVehicleAssignment.vehicle_id == vehicle_id,
            DriverVehicleAssignment.end_time_utc.is_(None),
        )
        .first()
    )

    if active_vehicle_assignment:
        raise HTTPException(
            status_code=409,
            detail="Vehicle is already assigned to another driver",
        )

    # 🚫 Rule 2: Driver already has a vehicle?
    active_driver_assignment = (
        db.query(DriverVehicleAssignment)
        .filter(
            DriverVehicleAssignment.driver_id == driver_id,
            DriverVehicleAssignment.end_time_utc.is_(None),
        )
        .first()
    )

    if active_driver_assignment:
        raise HTTPException(
            status_code=409,
            detail="Driver already has an active vehicle assignment",
        )

    assignment = DriverVehicleAssignment(
        tenant_id=fleet_owner.tenant_id,
        driver_id=driver_id,
        vehicle_id=vehicle_id,
        start_time_utc=datetime.now(timezone.utc),
        is_active=True,
        created_by=fleet_owner.user_id,
    )

    db.add(assignment)
    db.commit()
    db.refresh(assignment)

    return {
        "assignment_id": assignment.assignment_id,
        "driver_id": driver_id,
        "vehicle_id": vehicle_id,
        "assigned_at": assignment.start_time_utc,
    }


@router.get("/vehicle-assignments/vehicle/{vehicle_id}/lock-status")
def check_vehicle_lock(
    vehicle_id: int,
    db: Session = Depends(get_db),
    fleet_owner=Depends(require_fleet_owner),
):
    active = (
        db.query(DriverVehicleAssignment)
        .filter(
            DriverVehicleAssignment.vehicle_id == vehicle_id,
            DriverVehicleAssignment.end_time_utc.is_(None),
        )
        .first()
    )

    return {
        "vehicle_id": vehicle_id,
        "is_locked": bool(active),
        "assigned_driver_id": active.driver_id if active else None,
        "assigned_at": active.start_time_utc if active else None,
    }
@router.get("/vehicle-assignments/driver/{driver_id}/lock-status")
def check_driver_lock(
    driver_id: int,
    db: Session = Depends(get_db),
    fleet_owner=Depends(require_fleet_owner),
):
    active = (
        db.query(DriverVehicleAssignment)
        .filter(
            DriverVehicleAssignment.driver_id == driver_id,
            DriverVehicleAssignment.end_time_utc.is_(None),
        )
        .first()
    )

    return {
        "driver_id": driver_id,
        "is_busy": bool(active),
        "vehicle_id": active.vehicle_id if active else None,
        "assigned_at": active.start_time_utc if active else None,
    }

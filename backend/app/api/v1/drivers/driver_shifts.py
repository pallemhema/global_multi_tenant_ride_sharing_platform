from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from app.core.dependencies import get_db
from app.core.security.roles import require_driver
from app.models.core.drivers.driver_shifts import DriverShift
from app.models.core.drivers.driver_vehicle_assignments import DriverVehicleAssignment
from app.models.core.vehicles.vehicles import Vehicle
from app.models.core.tenants.tenant_cities import TenantCity
from app.models.core.fleet_owners.fleet_owner_cities import FleetOwnerCity
from app.schemas.core.drivers.driver_shifts import DriverShiftStart

router = APIRouter(
    prefix="/driver",
    tags=["Driver – Shifts"],
)

@router.post("/shifts/start")
def start_shift(
    payload: DriverShiftStart,
    db: Session = Depends(get_db),
    driver=Depends(require_driver),
):
    city_id = payload.city_id

    # 1️⃣ Driver must have an active vehicle assignment
    assignment = (
        db.query(DriverVehicleAssignment)
        .filter(
            DriverVehicleAssignment.driver_id == driver.driver_id,
            DriverVehicleAssignment.is_active.is_(True),
        )
        .first()
    )
    if not assignment:
        raise HTTPException(400, "No vehicle assigned")

    # 2️⃣ Prevent multiple active shifts
    active_shift = (
        db.query(DriverShift)
        .filter(
            DriverShift.driver_id == driver.driver_id,
            DriverShift.shift_status == "online",
        )
        .first()
    )
    if active_shift:
        raise HTTPException(400, "Shift already active")

    # 3️⃣ Validate city belongs to TENANT
    tenant_city = (
        db.query(TenantCity)
        .filter(
            TenantCity.tenant_id == driver.tenant_id,
            TenantCity.city_id == city_id,
            TenantCity.is_active.is_(True),
        )
        .first()
    )
    if not tenant_city:
        raise HTTPException(
            400,
            "Tenant does not operate in this city",
        )
    vehicle = (
        db.query(Vehicle)
        .filter(Vehicle.vehicle_id == assignment.vehicle_id)
        .first()    
    )

    if not vehicle or not vehicle.fleet_owner_id:
        raise HTTPException(400, "Vehicle is not owned by a fleet owner")


    # 4️⃣ Validate city belongs to FLEET OWNER
    fleet_owner_city = (
        db.query(FleetOwnerCity)
        .filter(
            FleetOwnerCity.fleet_owner_id == vehicle.fleet_owner_id,
            FleetOwnerCity.city_id == city_id,
            FleetOwnerCity.is_active.is_(True),
        )
        .first()
    )
    if not fleet_owner_city:
        raise HTTPException(
            400,
            "Fleet owner does not operate in this city",
        )

    # 5️⃣ Start shift
    shift = DriverShift(
        tenant_id=driver.tenant_id,
        driver_id=driver.driver_id,
        city_id=city_id,
        shift_status="online",
        shift_start_utc=datetime.utcnow(),
        created_by=driver.user_id,
    )

    db.add(shift)
    db.commit()

    return {
        "status": "shift started",
        "shift_id": shift.shift_id,
    }

@router.post("/shifts/end/{shift_id}")
def end_shift(
    shift_id: int,
    db: Session = Depends(get_db),
    driver=Depends(require_driver),
):
    shift = (
        db.query(DriverShift)
        .filter(
            DriverShift.shift_id == shift_id,
            DriverShift.driver_id == driver.driver_id,
            DriverShift.shift_status == "online",
        )
        .first()
    )

    if not shift:
        raise HTTPException(404, "Active shift not found")

    shift.shift_end_utc = datetime.utcnow()
    shift.shift_status = "offline"
    shift.updated_by = driver.user_id

    delta = shift.shift_end_utc - shift.shift_start_utc
    shift.total_online_minutes = int(delta.total_seconds() / 60)

    db.commit()

    return {
        "status": "shift ended",
        "total_minutes": shift.total_online_minutes,
    }

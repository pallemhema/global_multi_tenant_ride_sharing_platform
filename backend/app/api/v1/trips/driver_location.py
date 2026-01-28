# app/api/v1/driver/location.py

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from app.core.dependencies import get_db
from app.core.security.roles import require_driver
from app.schemas.core.drivers.driver_location import DriverLocationUpdate
from app.models.core.drivers.driver_shifts import DriverShift
from app.models.core.drivers.driver_vehicle_assignments import DriverVehicleAssignment
from app.core.redis import redis_client
from app.models.core.drivers.driver_current_status import DriverCurrentStatus


router = APIRouter(
    prefix="/driver",
    tags=["Driver – Location"],
)

@router.post("/location")

def update_driver_location(
    payload: DriverLocationUpdate,
    db: Session = Depends(get_db),
    driver=Depends(require_driver),
):
    now = datetime.now(timezone.utc)

    # 1️⃣ Online shift required
    shift = (
        db.query(DriverShift)
        .filter(
            DriverShift.driver_id == driver.driver_id,
            DriverShift.shift_status == "online",
        )
        .first()
    )
    if not shift:
        raise HTTPException(400, "Driver is not online")

    # 2️⃣ Active vehicle required
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

    tenant_id = driver.tenant_id
    city_id = shift.city_id

    # 3️⃣ Update GEO location
    geo_key = f"drivers:geo:{tenant_id}:{city_id}"
    redis_client.geoadd(
        geo_key,
        payload.longitude,
        payload.latitude,
        str(driver.driver_id),
    )

    # 4️⃣ Heartbeat
    redis_client.setex(
        f"driver:last_seen:{driver.driver_id}",
        60,
        now.isoformat(),
    )

    # 5️⃣ Runtime status (DB → Redis)
    runtime = (
        db.query(DriverCurrentStatus)
        .filter(
            DriverCurrentStatus.driver_id == driver.driver_id,
            DriverCurrentStatus.tenant_id == tenant_id,
        )
        .first()
    )

    status = runtime.runtime_status if runtime else "available"

    redis_client.setex(
        f"driver:runtime:{driver.driver_id}",
        60,
        status,
    )

    return {
        "status": "location updated",
        "driver_id": driver.driver_id,
        "city_id": city_id,
        "timestamp_utc": now,
    }

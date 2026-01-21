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

router = APIRouter(
    prefix="/driver",
    tags=["Driver – Location"],
)

@router.post("/location")
def update_driver_location(
    payload: DriverLocationUpdate,
    db: Session = Depends(get_db),              # ✅ DB session
    driver=Depends(require_driver),             # ✅ Driver identity
):
    now = datetime.now(timezone.utc)

    # 1️⃣ Must have active shift
    active_shift = (
        db.query(DriverShift)
        .filter(
            DriverShift.driver_id == driver.driver_id,
            DriverShift.shift_status == "online",
        )
        .first()
    )
    if not active_shift:
        raise HTTPException(400, "Driver is not online")

    # 2️⃣ Must have active vehicle assignment
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
    city_id = active_shift.city_id

    # 3️⃣ Redis GEO key (tenant + city scoped)
    geo_key = f"drivers:geo:{tenant_id}:{city_id}"

    # 4️⃣ Store location in Redis GEO
    redis_client.execute_command(
        "GEOADD",
        geo_key,
        payload.longitude,
        payload.latitude,
        str(driver.driver_id),
    )


    # 5️⃣ Heartbeat & runtime metadata (Redis = real-time)
    redis_client.setex(
        f"driver:last_seen:{driver.driver_id}",
        60,
        now.isoformat(),
    )

    redis_client.setex(
        f"driver:runtime:{driver.driver_id}",
        60,
        "available",
    )

    return {
        "status": "location updated",
        "driver_id": driver.driver_id,
        "city_id": city_id,
        "timestamp_utc": now,
    }

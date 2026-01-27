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
from app.models.core.drivers.driver_current_status import DriverCurrentStatus
from app.core.redis import redis_client
from app.schemas.core.drivers.location_heartbeat import LocationHeartbeatSchema
from app.core.redis import get_redis
from redis import Redis
from datetime import timezone

from app.schemas.core.drivers.runtime_status import RuntimeStatusSchema

router = APIRouter(
    prefix="/driver",
    tags=["Driver – Shifts"],
)

@router.get("/shift/current")
def get_current_shift(
    db: Session = Depends(get_db),
    driver=Depends(require_driver),
):
    status = (
        db.query(DriverCurrentStatus)
        .filter(
            DriverCurrentStatus.driver_id == driver.driver_id,
            DriverCurrentStatus.tenant_id == driver.tenant_id,
        )
        .first()
    )

    if not status:
        return {"shift_status": "offline"}

    return {
        "shift_status": status.runtime_status,
        "last_updated_utc": status.last_updated_utc,
    }


@router.post("/shift/start")
def start_shift(
    payload: dict,
    db: Session = Depends(get_db),
    driver=Depends(require_driver),
):
    now = datetime.now(timezone.utc)

    # 1️⃣ Create shift history
    shift = DriverShift(
        tenant_id=driver.tenant_id,
        driver_id=driver.driver_id,
        shift_status="online",
        shift_start_utc=now,
        created_by=driver.user_id,
    )
    db.add(shift)

    # 2️⃣ Update realtime status
    current = (
        db.query(DriverCurrentStatus)
        .filter(
            DriverCurrentStatus.driver_id == driver.driver_id,
            DriverCurrentStatus.tenant_id == driver.tenant_id,
        )
        .first()
    )

    if not current:
        current = DriverCurrentStatus(
            tenant_id=driver.tenant_id,
            driver_id=driver.driver_id,
        
            runtime_status="available",
            last_updated_utc=now,
        )
        db.add(current)
    else:
        current.runtime_status = "available"
        current.last_updated_utc = now

    db.commit()

    return {
        "shift_status": "online",
        "started_at": now,
    }

@router.post("/shift/end")
def end_shift(
    db: Session = Depends(get_db),
    driver=Depends(require_driver),
):
    now = datetime.now(timezone.utc)

    # 1️⃣ Close active shift
    shift = (
        db.query(DriverShift)
        .filter(
            DriverShift.driver_id == driver.driver_id,
            DriverShift.tenant_id == driver.tenant_id,
            DriverShift.shift_end_utc.is_(None),
        )
        .first()
    )

    if shift:
        shift.shift_end_utc = now
        shift.shift_status = "offline"

    # 2️⃣ Update realtime status
    current = (
        db.query(DriverCurrentStatus)
        .filter(
            DriverCurrentStatus.driver_id == driver.driver_id,
            DriverCurrentStatus.tenant_id == driver.tenant_id,
        )
        .first()
    )

    if current:
        current.runtime_status = "offline"
        current.last_updated_utc = now

    db.commit()

    return {
        "shift_status": "offline",
        "ended_at": now,
    }


@router.get("/runtime-status")
def get_runtime_status(
    db: Session = Depends(get_db),
    driver=Depends(require_driver),
):
    status = (
        db.query(DriverCurrentStatus)
        .filter(
            DriverCurrentStatus.driver_id == driver.driver_id,
            DriverCurrentStatus.tenant_id == driver.tenant_id,
        )
        .first()
    )

    if not status:
        return {
            "runtime_status": "offline",
            "city_id": None,
            "last_updated_utc": None,
        }

    return {
        "runtime_status": status.runtime_status,
        "city_id": status.city_id,
        "last_updated_utc": status.last_updated_utc,
    }

@router.post("/driver/runtime-status")
def update_runtime_status(
    payload: RuntimeStatusSchema,
    db: Session = Depends(get_db),
    driver=Depends(require_driver),
):
    status = db.query(DriverCurrentStatus).filter_by(
        tenant_id=driver.tenant_id,
        driver_id=driver.driver_id,
    ).first()

    if not status:
        raise HTTPException(400, "Driver is offline")

    status.runtime_status = payload.runtime_status
    status.last_updated_utc = datetime.utcnow()
    db.commit()

    return {"runtime_status": payload.runtime_status}


@router.post("/location/heartbeat")
def location_heartbeat(
    payload: LocationHeartbeatSchema,
    redis: Redis = Depends(get_redis),
    driver=Depends(require_driver),
):
    redis.hset(
        f"driver:{driver.driver_id}:location",
        mapping={
            "lat": payload.latitude,
            "lng": payload.longitude,
            "accuracy": payload.accuracy,
            "timestamp": payload.timestamp,
        }
    )
    redis.expire(f"driver:{driver.driver_id}:location", 60)
    return {"ok": True}

@router.get("/driver/shift/current")
def get_shift_status(
    db: Session = Depends(get_db),
    driver=Depends(require_driver),
):
    shift = (
        db.query(DriverShift)
        .filter(
            DriverShift.driver_id == driver.driver_id,
            DriverShift.shift_status == "online",
        )
        .first()
    )

    return {
        "shift_status": "online" if shift else "offline",
        "started_at": shift.shift_start_utc if shift else None,
    }

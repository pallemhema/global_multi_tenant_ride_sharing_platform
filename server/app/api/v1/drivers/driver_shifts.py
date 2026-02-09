from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from app.core.dependencies import get_db
from app.core.security.roles import require_driver
from app.models.core.drivers.driver_shifts import DriverShift
from app.models.core.fleet_owners.driver_vehicle_assignments import DriverVehicleAssignment
from app.models.core.vehicles.vehicles import Vehicle
from app.models.core.tenants.tenant_cities import TenantCity
from app.models.core.fleet_owners.fleet_owner_cities import FleetOwnerCity
from app.schemas.core.drivers.driver_shifts import DriverShiftStart
from app.models.core.drivers.driver_current_status import DriverCurrentStatus
from app.core.redis import redis_client
from app.schemas.core.drivers.location_heartbeat import LocationHeartbeatSchema
from app.schemas.core.drivers.shift_end import ShiftEndRequest
from app.core.redis import get_redis
from redis import Redis
from datetime import timezone

from app.schemas.core.drivers.runtime_status import RuntimeStatusSchema
from app.models.core.trips.trip_dispatch_candidates import TripDispatchCandidate

router = APIRouter(
    prefix="/driver",
    tags=["Driver – Shifts"],
)

@router.get("/shift/current")
def get_current_shift(
    db: Session = Depends(get_db),
    driver=Depends(require_driver),
):
    # Get the most recent shift for this driver
    shift = (
        db.query(DriverShift)
        .filter(
            DriverShift.driver_id == driver.driver_id,
            DriverShift.tenant_id == driver.tenant_id,
        )
        .order_by(DriverShift.shift_id.desc())
        .first()
    )

    # If no shift exists, or shift is ended, return offline status
    if not shift or shift.shift_status == "offline":
        return {
            "shift_status": "offline",
            "runtime_status": "offline",
            "shift_start_utc": None,
            "shift_end_utc": None,
            "duration_minutes": None,
        }

    # Get current runtime status
    status = (
        db.query(DriverCurrentStatus)
        .filter(
            DriverCurrentStatus.driver_id == driver.driver_id,
            DriverCurrentStatus.tenant_id == driver.tenant_id,
        )
        .first()
    )

    runtime = status.runtime_status if status else "available"

    # Calculate duration if shift is ended
    duration_minutes = None
    if shift.shift_end_utc:
        delta = shift.shift_end_utc - shift.shift_start_utc
        duration_minutes = int(delta.total_seconds() / 60)

    return {
        "shift_status": "online",
        "runtime_status": runtime,
        "shift_start_utc": shift.shift_start_utc,
        "shift_end_utc": shift.shift_end_utc,
        "shift_start_lat": shift.shift_start_lat,
        "shift_start_lng": shift.shift_start_lng,
        "shift_end_lat": shift.shift_end_lat,
        "shift_end_lng": shift.shift_end_lng,
        "duration_minutes": duration_minutes,
    }


@router.post("/shift/start")
def start_shift(
    payload: dict,
    db: Session = Depends(get_db),
    driver=Depends(require_driver),
):
    now = datetime.now(timezone.utc)

    # 1️⃣ Create shift history with start location
    shift = DriverShift(
        tenant_id=driver.tenant_id,
        driver_id=driver.driver_id,
        shift_status="online",
        shift_start_utc=now,
        shift_start_lat=payload.get("latitude"),
        shift_start_lng=payload.get("longitude"),
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
    payload: ShiftEndRequest,
    db: Session = Depends(get_db),
    driver=Depends(require_driver),
):
    now = datetime.now(timezone.utc)
    print(f"end shift payload: latitude={payload.latitude}, longitude={payload.longitude}")

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
        # Capture end location if provided
        if payload.latitude is not None and payload.longitude is not None:
            shift.shift_end_lat = payload.latitude
            shift.shift_end_lng = payload.longitude
            print(f"✅ End location saved: lat={shift.shift_end_lat}, lng={shift.shift_end_lng}")

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
        # Delete the driver's current status when going offline
        db.delete(current)

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
            "runtime_status": "not_available",
            "city_id": None,
            "last_updated_utc": None,
        }
    
    if status.runtime_status == "trip_accepted":
        return{
            "current_trip_id": status.current_trip_id,
            "runtime_status": status.runtime_status,
            "city_id": status.city_id,
            "last_updated_utc": status.last_updated_utc,
        }

    return {
        "runtime_status": status.runtime_status,
        "city_id": status.city_id,
        "last_updated_utc": status.last_updated_utc,
    }

@router.put("/runtime-status")
def update_runtime_status(
    payload: RuntimeStatusSchema,
    db: Session = Depends(get_db),
    driver=Depends(require_driver),
):
    # 🚫 ENFORCE: on_trip is system-controlled, never user-controlled
    if payload.runtime_status == "on_trip":
        raise HTTPException(
            status_code=403,
            detail="Cannot manually set on_trip status. It is automatically managed by the system when trips start."
        )
    
    # ✅ Only allow: available, unavailable
    if payload.runtime_status not in ("available", "unavailable"):
        raise HTTPException(
            status_code=400,
            detail=f"Invalid runtime status: {payload.runtime_status}. Only 'available' and 'unavailable' are allowed."
        )
    
    status = db.query(DriverCurrentStatus).filter_by(
        tenant_id=driver.tenant_id,
        driver_id=driver.driver_id,
    ).first()

    if not status:
        raise HTTPException(400, "Driver is offline")

    # 🚫 Cannot change status while on trip
    if status.runtime_status == "on_trip":
        raise HTTPException(
            status_code=409,
            detail="Cannot change status while on an active trip. Complete or cancel the trip first."
        )

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
    # Build mapping with only non-None values (Redis doesn't accept None)
    mapping = {
        "lat": str(payload.latitude),
        "lng": str(payload.longitude),
    }

    print("payload:",payload)
    
    # Add timestamp - use provided or current time in milliseconds
    if payload.timestamp is not None:
        mapping["timestamp"] = str(payload.timestamp)
    else:
        mapping["timestamp"] = str(int(datetime.utcnow().timestamp() * 1000))
    
    # Add optional fields only if they're not None
    if payload.accuracy is not None:
        mapping["accuracy"] = str(payload.accuracy)
    if payload.speed is not None:
        mapping["speed"] = str(payload.speed)
    if payload.heading is not None:
        mapping["heading"] = str(payload.heading)
    
    redis.hset(
        f"driver:{driver.driver_id}:location",
        mapping=mapping
    )
    redis.expire(f"driver:{driver.driver_id}:location", 60)

    # --- Add/update driver location in Redis GEO key for driver discovery ---
    # Get tenant_id from driver, city_id from payload if present, else from driver
    tenant_id = getattr(driver, "tenant_id", None)
    city_id = getattr(payload, "city_id", None)
    if city_id is None:
        city_id = getattr(driver, "city_id", None)
    print(f"[HEARTBEAT DEBUG] driver_id={driver.driver_id}, tenant_id={tenant_id}, city_id={city_id}, lat={payload.latitude}, lng={payload.longitude}")
    # Only update GEO if all required info is present
    if tenant_id and city_id and payload.latitude is not None and payload.longitude is not None:
        geo_key = f"drivers:geo:{tenant_id}:{city_id}"
        print(f"[HEARTBEAT DEBUG] GEOADD {geo_key} {payload.longitude} {payload.latitude} {driver.driver_id}")
        try:
            redis.execute_command('GEOADD', geo_key, str(payload.longitude), str(payload.latitude), str(driver.driver_id))
            redis.expire(geo_key, 120)
            print(f"[HEARTBEAT DEBUG] GEOADD success for driver {driver.driver_id}")
        except Exception as exc:
            print(f"[HEARTBEAT DEBUG] Failed to update GEO for driver {driver.driver_id}: {exc}")
    else:
        print(f"[HEARTBEAT DEBUG] Missing tenant_id or city_id, GEOADD skipped for driver {driver.driver_id}")
    return {"ok": True}

@router.get("/trip-requests")
def get_trip_requests(
    db: Session = Depends(get_db),
    driver=Depends(require_driver),
):
    """
    Get pending trip requests for this driver.
    
    🔒 STRICT OWNERSHIP: Only return candidates where response_code is None (pending)
    🚫 Filter out: Already accepted, rejected, or expired trips
    
    Server-side filtering ensures frontend shows only actionable trips.
    """
    # Return all trip_dispatch_candidates for this driver where response_code is pending
    candidates = db.query(TripDispatchCandidate).filter(
        TripDispatchCandidate.driver_id == driver.driver_id,
        TripDispatchCandidate.response_code.is_(None)  # Only pending (not accepted/rejected/expired)
    ).all()
    
    # Return minimal info for UI
    return [
        {
            "trip_request_id": c.trip_request_id,
            "batch_id": c.trip_batch_id,
            "request_sent_at": c.request_sent_at_utc,
        }
        for c in candidates
    ]

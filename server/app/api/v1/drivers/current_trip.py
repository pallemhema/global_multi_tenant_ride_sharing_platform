from http.client import HTTPException

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.dependencies import get_db
from app.core.security.roles import require_driver
from app.models.core.trips.trips import Trip
from app.models.core.drivers.drivers import Driver
from app.models.core.trips.trip_request import TripRequest
from app.models.core.trips.trip_status_history import TripStatusHistory
from app.core.trips.trip_lifecycle import TripLifecycle
import json
from app.core.redis import redis_client

router = APIRouter(
    prefix="/driver/trip",
    tags=["Driver – Current Trip"],
)

@router.get("/active")
def get_driver_active_trip(
    db: Session = Depends(get_db),
    driver: Driver = Depends(require_driver),
):
    """
    Get the active trip for this driver.
    
     STRICT OWNERSHIP: Only return if:
    - Trip belongs to authenticated driver (driver.driver_id === trip.driver_id)
    - Trip is not completed
    
    Returns: trip_id, trip_status, trip_request_id
    """
    print(f"[Active Trip] Fetching for driver_id={driver.driver_id}")
    
    #  Strict filter: Only this driver's active trips
    trip = (
        db.query(Trip)
        .filter(
            Trip.driver_id == driver.driver_id,  # MANDATORY ownership check
            Trip.trip_status.not_in(["completed", "cancelled"]),
        )
        .order_by(Trip.created_at_utc.desc())
        .first()
    )

    print(f"[Active Trip] Result: {trip.trip_id if trip else None}")

    if not trip:
        return {"active_trip": None}

    return {
        "trip_id": trip.trip_id,
        "trip_status": trip.trip_status,
        "trip_request_id": trip.trip_request_id,
    }
@router.get("/{trip_id}/status")
def get_trip_status_by_trip_id_driver(
    trip_id: int,
    db: Session = Depends(get_db),
    driver: Driver = Depends(require_driver),
):
    trip = (
        db.query(Trip)
        .join(TripRequest, Trip.trip_request_id == TripRequest.trip_request_id)
        .filter(
            Trip.trip_id == trip_id,
            Trip.driver_id == driver.driver_id,
        )
        .first()
    )

    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    # ✅ Proper TripRequest fetch
    trip_request = db.query(TripRequest).filter(
        TripRequest.trip_request_id == trip.trip_request_id
    ).first()

    # ✅ Redis GEO key (must match heartbeat exactly)
    geo_key = f"drivers:geo:{driver.tenant_id}:{driver.city_id}"
    driver_id_str = str(trip.driver_id)

    position = redis_client.geopos(geo_key, driver_id_str)

    driver_lat = None
    driver_lng = None

    if position and position[0]:
        driver_lng = float(position[0][0])
        driver_lat = float(position[0][1])

    return {
        "trip_id": trip.trip_id,
        "status": trip.trip_status,
        "driver_id": trip.driver_id,
        "driver_lat": driver_lat,
        "driver_lng": driver_lng,
        "trip_request": {
            "trip_request_id": trip_request.trip_request_id,
            "pickup_lat": trip_request.pickup_lat,
            "pickup_lng": trip_request.pickup_lng,
            "drop_lat": trip_request.drop_lat,
            "drop_lng": trip_request.drop_lng,
            "pickup_address": trip_request.pickup_address,
            "drop_address": trip_request.drop_address,
            "user_id": trip_request.user_id,
        }
    }
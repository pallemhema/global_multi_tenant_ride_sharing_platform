from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.dependencies import get_db
from app.core.security.roles import require_driver
from app.models.core.trips.trips import Trip
from app.models.core.drivers.drivers import Driver

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
    
    🔒 STRICT OWNERSHIP: Only return if:
    - Trip belongs to authenticated driver (driver.driver_id === trip.driver_id)
    - Trip is not completed
    
    Returns: trip_id, trip_status, trip_request_id
    """
    print(f"[Active Trip] Fetching for driver_id={driver.driver_id}")
    
    # 🔒 Strict filter: Only this driver's active trips
    trip = (
        db.query(Trip)
        .filter(
            Trip.driver_id == driver.driver_id,  # MANDATORY ownership check
            Trip.trip_status != "completed",
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

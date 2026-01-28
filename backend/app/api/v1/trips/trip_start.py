# app/api/v1/driver/trips_start.py

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from app.core.dependencies import get_db
from app.core.security.roles import require_driver
from app.core.security.trip_otp import verify_trip_otp

from app.models.core.trips.trips import Trip
from app.models.core.trips.trip_status_history import TripStatusHistory

from app.schemas.core.trips.trip_request import TripStartRequest

router = APIRouter(
    prefix="/driver/trips",
    tags=["Driver – Trips"],
)


@router.post("/{trip_id}/start")
def start_trip(
    trip_id: int,
    payload: TripStartRequest,
    db: Session = Depends(get_db),
    driver=Depends(require_driver),
):
    now = datetime.now(timezone.utc)

    # ------------------------------------------------
    # 1️⃣ Validate trip ownership & state
    # ------------------------------------------------
    trip = (
        db.query(Trip)
        .filter(
            Trip.trip_id == trip_id,
            Trip.driver_id == driver.driver_id,
            Trip.trip_status == "assigned",
        )
        .first()
    )

    if not trip:
        raise HTTPException(404, "Trip not eligible for start")

    # ------------------------------------------------
    # 2️⃣ Verify OTP (Redis)
    # ------------------------------------------------
    if not verify_trip_otp(trip_id, payload.otp):
        raise HTTPException(400, "Invalid or expired OTP")

    # ------------------------------------------------
    # 3️⃣ Start trip
    # ------------------------------------------------
    trip.trip_status = "picked_up"
    trip.picked_up_at_utc = now

    db.add(
        TripStatusHistory(
            tenant_id=trip.tenant_id,
            trip_id=trip.trip_id,
            from_status="assigned",
            to_status="picked_up",
            changed_at_utc=now,
            changed_by=driver.user_id,
        )
    )

    db.commit()

    return {
        "status": "trip_started",
        "trip_id": trip.trip_id,
        "started_at": now,
    }

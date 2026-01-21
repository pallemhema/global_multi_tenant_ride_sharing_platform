from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from app.core.dependencies import get_db
from app.core.security.roles import require_driver
from app.core.security.trip_otp import generate_trip_otp, store_trip_otp

from app.models.core.trips.trips import Trip
from app.models.core.trips.trip_dispatch_candidates import TripDispatchCandidate
from app.models.core.trips.trip_driver_assignment import TripDriverAssignment
from app.models.core.trips.trip_status_history import TripStatusHistory
from app.models.core.drivers.driver_current_status import DriverCurrentStatus
from app.models.core.drivers.driver_vehicle_assignments import DriverVehicleAssignment

from app.schemas.core.trips.trip_driver_response import DriverTripResponse

router = APIRouter(
    prefix="/driver/trips",
    tags=["Driver – Trips"],
)


@router.post("/{trip_id}/respond")
def respond_to_trip(
    trip_id: int,
    payload: DriverTripResponse,
    db: Session = Depends(get_db),
    driver=Depends(require_driver),
):
    now = datetime.now(timezone.utc)

    # 1️⃣ Fetch trip
    trip = db.query(Trip).filter(Trip.trip_id == trip_id).first()
    

    if not trip or trip.trip_status != "dispatching":
        raise HTTPException(404, "Trip not available")
    if trip.trip_status != "dispatching":
        raise HTTPException(409, "Trip already assigned")

    # 2️⃣ Fetch dispatch candidate
    candidate = (
        db.query(TripDispatchCandidate)
        .filter(
            TripDispatchCandidate.trip_id == trip_id,
            TripDispatchCandidate.driver_id == driver.driver_id,
        )
        .first()
    )

    if not candidate:
        raise HTTPException(403, "Not authorized for this trip")

    if candidate.response_code:
        raise HTTPException(400, "Already responded")

    # 3️⃣ Handle rejection
    if payload.response == "rejected":
        candidate.response_code = "rejected"
        candidate.response_at_utc = now
        db.commit()
        return {"status": "rejected"}

    # 4️⃣ ACCEPT FLOW
    # Check vehicle assignment
    assignment = (
        db.query(DriverVehicleAssignment)
        .filter(
            DriverVehicleAssignment.driver_id == driver.driver_id,
            DriverVehicleAssignment.is_active.is_(True),
        )
        .first()
    )

    if not assignment:
        raise HTTPException(400, "No active vehicle assigned")

    # Update dispatch candidate
    candidate.response_code = "accepted"
    candidate.response_at_utc = now

    # Assign trip
    trip.driver_id = driver.driver_id
    trip.vehicle_id = assignment.vehicle_id
    trip.trip_status = "assigned"
    trip.assigned_at_utc = now

    db.query(TripDispatchCandidate).filter(
        TripDispatchCandidate.trip_id == trip_id,
        TripDispatchCandidate.driver_id != driver.driver_id,
        TripDispatchCandidate.response_code.is_(None),  
        ).update(
        {"response_code": "timeout"}
    )

    db.add(
        TripDriverAssignment(
            tenant_id=trip.tenant_id,
            trip_id=trip.trip_id,
            driver_id=driver.driver_id,
            vehicle_id=assignment.vehicle_id,
            assigned_at_utc=now,
            created_by=driver.user_id,
        )
    )

    # Generate OTP
    otp = generate_trip_otp()
    store_trip_otp(trip.trip_id, otp)

    # Driver runtime status
    db.query(DriverCurrentStatus).filter(
        DriverCurrentStatus.driver_id == driver.driver_id
    ).update(
        {
            "runtime_status": "on_trip",
            "last_updated_utc": now,
        }
    )

    # Status history
    db.add(
        TripStatusHistory(
            tenant_id=trip.tenant_id,
            trip_id=trip.trip_id,
            from_status="dispatching",
            to_status="assigned",
            changed_at_utc=now,
            changed_by=driver.user_id,
        )
    )

    db.commit()

    return {
        "status": "accepted",
        "trip_id": trip.trip_id,
    }

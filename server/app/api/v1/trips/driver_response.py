"""
Driver Response Handler - Accept/Reject trip offers

When drivers receive batch notifications:
- ACCEPT: Creates Trip record, stops further batches
- REJECT: Marks candidate as rejected, moves to next batch if available
- TIMEOUT: Auto-rejected after timeout window
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from app.core.dependencies import get_db
from app.core.security.roles import require_driver
from app.models.core.trips.trip_request import TripRequest
from app.models.core.trips.trip_batch import TripBatch
from app.models.core.trips.trip_dispatch_candidates import TripDispatchCandidate
from app.models.core.trips.trips import Trip
from app.models.core.drivers.drivers import Driver
from app.schemas.core.trips.driver_response import DriverTripResponse
from app.core.trips.trip_otp_service import generate_trip_otp, store_trip_otp
from app.core.trips.trip_lifecycle import TripLifecycle
from app.models.core.trips.trip_status_history import TripStatusHistory

router = APIRouter(
    prefix="/driver/trips",
    tags=["Driver – Trip Response"],
)


@router.post("/respond/{trip_request_id}/{batch_id}")
def driver_respond_to_batch(
    trip_request_id: int,
    batch_id: int,
    payload: DriverTripResponse,
    db: Session = Depends(get_db),
    driver: Driver = Depends(require_driver),
):
    now = datetime.now(timezone.utc)

    #  Lock TripRequest
    trip_req = (
        db.query(TripRequest)
        .filter(TripRequest.trip_request_id == trip_request_id)
        .with_for_update()
        .first()
    )

    if not trip_req:
        raise HTTPException(status_code=404, detail="Trip request not found")

    #  ACCEPT 
    if payload.response == "accepted":
        print(f"[DRIVER_ACCEPT] Trip request {trip_request_id} from driver {driver.driver_id}")
        print(f"[DRIVER_ACCEPT] Current status: {trip_req.status}")

        # ATOMIC CHECK: Trip must still be in "driver_searching" status
        # Another driver may have already accepted between the lock check and now
        if trip_req.status != "driver_searching":
            raise HTTPException(
                status_code=409,
                detail="This trip was accepted by another driver",
            )

        # ATOMIC UPDATE: Change status to "driver_assigned" and create trip in same transaction
        trip_req.status = "driver_assigned"
        print(f"[DRIVER_ACCEPT] Status set to: {trip_req.status}")

        trip = TripLifecycle.create_trip_from_request(
            db=db,
            trip_request=trip_req,
            driver=driver,
            vehicle_category=None,
            now=now,
        )
        print(f"[DRIVER_ACCEPT] Trip created with trip_id={trip.trip_id}")

        # Generate OTP for trip
        otp = generate_trip_otp()
        store_trip_otp(trip.trip_id, otp)

        # Record status transition
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

        #Expire ALL other candidates for this trip request BEFORE committing
        db.query(TripDispatchCandidate).filter(
            TripDispatchCandidate.trip_request_id == trip_request_id,
            TripDispatchCandidate.driver_id != driver.driver_id,
        ).update(
            {"response_code": "expired"},
            synchronize_session=False,
        )

        # Mark this driver's candidate as accepted
        candidate = db.query(TripDispatchCandidate).filter(
            TripDispatchCandidate.trip_request_id == trip_request_id,
            TripDispatchCandidate.driver_id == driver.driver_id,
        ).first()

        if candidate:
            candidate.response_code = "accepted"
            candidate.response_at_utc = now

        #Commit all changes atomically
        print(f"[DRIVER_ACCEPT] Committing transaction...")
        db.commit()
        print(f"[DRIVER_ACCEPT] Commit successful. Status after commit: {trip_req.status}")
        
        # Verify status was persisted
        refreshed_req = db.query(TripRequest).filter(TripRequest.trip_request_id == trip_request_id).first()
        print(f"[DRIVER_ACCEPT] Status verified from DB: {refreshed_req.status if refreshed_req else 'NOT FOUND'}")
        
        # Lock driver after commit
        print(f"[DRIVER_ACCEPT] Calling TripLifecycle.lock_driver()...")
        TripLifecycle.lock_driver(db, driver.driver_id, trip.trip_id)
        print(f"[DRIVER_ACCEPT] Driver lock complete")

        return {
            "response": "accepted",
            "trip_id": trip.trip_id,
            "message": "Trip accepted successfully",
        }
    
    #  REJECT
    if payload.response == "rejected":

        candidate = db.query(TripDispatchCandidate).filter(
            TripDispatchCandidate.trip_request_id == trip_request_id,
            TripDispatchCandidate.driver_id == driver.driver_id,
        ).with_for_update().first()

        if not candidate:
            raise HTTPException(status_code=404, detail="Dispatch candidate not found")

        candidate.response_code = "rejected"
        candidate.response_at_utc = now

        # Lock batch
        batch = db.query(TripBatch).filter(
            TripBatch.trip_batch_id == batch_id
        ).with_for_update().first()

        # Check pending drivers in this batch
        pending_exists = db.query(TripDispatchCandidate).filter(
            TripDispatchCandidate.trip_batch_id == batch_id,
            TripDispatchCandidate.response_code.is_(None)
        ).first()

        if pending_exists:
            db.commit()
            return {
                "response": "rejected",
                "trip_request_id": trip_request_id,
                "message": "Trip rejected.",
            }

        # 🚀 No pending drivers → batch is finished
        batch.batch_status = "completed"

        # Check next batch
        next_batch = db.query(TripBatch).filter(
            TripBatch.trip_request_id == trip_request_id,
            TripBatch.batch_number > batch.batch_number
        ).order_by(TripBatch.batch_number).first()

        if not next_batch:
            trip_req.status = "no_drivers_available"
            trip_req.updated_at_utc = now
            print("[DISPATCH] All batches exhausted → no drivers available")

        db.commit()

        return {
            "response": "rejected",
            "trip_request_id": trip_request_id,
            "message": "Trip rejected.",
        }
    # CANCEL 
    if payload.response == "cancelled":

        trip = db.query(Trip).filter(
            Trip.trip_request_id == trip_request_id,
            Trip.driver_id == driver.driver_id,
        ).first()

        if not trip:
            raise HTTPException(
                status_code=404,
                detail="Active trip not found"
            )

        if trip.status != "assigned":
            raise HTTPException(
                status_code=409,
                detail=f"Trip cannot be cancelled (status={trip.status})"
            )

        #  Reset TripRequest
        trip_req.status = "driver_searching"
        trip_req.assigned_driver_id = None
        trip_req.assigned_at_utc = None

        # Cancel trip
        trip.trip_status = "cancelled"
        trip.cancelled_at_utc = now

        db.add(
            TripStatusHistory(
                tenant_id=trip.tenant_id,
                trip_id=trip.trip_id,
                from_status="assigned",
                to_status="cancelled",
                changed_at_utc=now,
                changed_by=driver.user_id,
            )
        )

        db.commit()

        return {
            "response": "cancelled",
            "trip_id": trip.trip_id,
            "message": "Trip cancelled. Dispatch restarted.",
        }
    raise HTTPException(
        status_code=400,
        detail="Invalid response. Use accepted | rejected | cancelled"
    )


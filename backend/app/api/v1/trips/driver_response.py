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
from app.schemas.core.trips.trip_driver_response import DriverTripResponse

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
    """
    Driver responds to a trip offer from a batch.
    
    Payload:
    - response: "accepted" | "rejected"
    
    On ACCEPT:
    - Create Trip record
    - Set trip_request.status = "driver_assigned"
    - Mark other candidates in batch as "cancelled"
    - Stop further batches
    
    On REJECT:
    - Mark candidate as "rejected"
    - Check if batch has more drivers
    - If batch exhausted, trigger next batch
    """
    now = datetime.now(timezone.utc)
    
    # ====== Get TripRequest ======
    trip_req = db.query(TripRequest).filter(
        TripRequest.trip_request_id == trip_request_id
    ).first()
    
    if not trip_req:
        raise HTTPException(status_code=404, detail="Trip request not found")
    
    if trip_req.status != "driver_searching":
        raise HTTPException(
            status_code=400,
            detail=f"Trip request not in searching state: {trip_req.status}"
        )
    
    # ====== Get TripBatch ======
    batch = db.query(TripBatch).filter(
        TripBatch.trip_batch_id == batch_id,
        TripBatch.trip_request_id == trip_request_id,
    ).first()
    
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")
    
    # ====== Get candidate (driver's offer) ======
    candidate = db.query(TripDispatchCandidate).filter(
        TripDispatchCandidate.round_id == batch_id,
        TripDispatchCandidate.driver_id == driver.driver_id,
    ).first()
    
    if not candidate:
        raise HTTPException(
            status_code=403,
            detail="You are not in this batch"
        )
    
    if candidate.response_code is not None:
        raise HTTPException(
            status_code=400,
            detail="You have already responded to this offer"
        )
    
    # ====== HANDLE REJECTION ======
    if payload.response == "rejected":
        candidate.response_code = "rejected"
        candidate.response_at_utc = now
        db.add(candidate)
        db.commit()
        db.refresh(candidate)
        
        # Check if all drivers in batch rejected
        pending_candidates = db.query(TripDispatchCandidate).filter(
            TripDispatchCandidate.round_id == batch_id,
            TripDispatchCandidate.response_code.is_(None),  # Still pending
        ).count()
        
        if pending_candidates == 0:
            # Batch exhausted - try next batch or mark no drivers
            batch.batch_status = "no_acceptance"
            batch.ended_at_utc = now
            db.add(batch)
            
            # TODO: Trigger next batch logic here
            # For now, mark as no drivers available
            trip_req.status = "no_drivers_available"
            trip_req.updated_at_utc = now
            db.add(trip_req)
            db.commit()
            
            return {
                "response": "rejected",
                "trip_request_id": trip_request_id,
                "message": "Your response recorded. Batch exhausted, trying next batch...",
            }
        
        return {
            "response": "rejected",
            "trip_request_id": trip_request_id,
            "message": "Your rejection recorded",
        }
    
    # ====== HANDLE ACCEPTANCE ======
    if payload.response == "accepted":
        # Lock trip request to prevent race conditions
        trip_req = db.query(TripRequest).filter(
            TripRequest.trip_request_id == trip_request_id
        ).with_for_update().first()
        
        # Double-check no other driver accepted yet
        other_accepted = db.query(TripDispatchCandidate).filter(
            TripDispatchCandidate.round_id == batch_id,
            TripDispatchCandidate.response_code == "accepted",
        ).first()
        
        if other_accepted:
            raise HTTPException(
                status_code=409,
                detail="Another driver already accepted this trip"
            )
        
        # ====== Create Trip record ======
        trip = Trip(
            trip_request_id=trip_req.trip_request_id,
            tenant_id=trip_req.selected_tenant_id,
            rider_id=trip_req.rider_id,
            driver_id=driver.driver_id,
            city_id=trip_req.city_id,
            trip_status="accepted",
            pickup_latitude=trip_req.pickup_lat,
            pickup_longitude=trip_req.pickup_lng,
            pickup_address=trip_req.pickup_address,
            drop_latitude=trip_req.drop_lat,
            drop_longitude=trip_req.drop_lng,
            drop_address=trip_req.drop_address,
            requested_at_utc=trip_req.created_at_utc,
            assigned_at_utc=now,
            distance_km=trip_req.estimated_distance_km,
            duration_minutes=trip_req.estimated_duration_minutes,
            created_at_utc=now,
            created_by=driver.driver_id,
        )
        db.add(trip)
        db.flush()
        
        # ====== Mark candidate as accepted ======
        candidate.response_code = "accepted"
        candidate.response_at_utc = now
        candidate.trip_id = trip.trip_id  # Link to created trip
        db.add(candidate)
        
        # ====== Mark other batch candidates as cancelled ======
        other_candidates = db.query(TripDispatchCandidate).filter(
            TripDispatchCandidate.round_id == batch_id,
            TripDispatchCandidate.driver_id != driver.driver_id,
        ).all()
        
        for other in other_candidates:
            if other.response_code is None:
                other.response_code = "cancelled"
                other.response_at_utc = now
            db.add(other)
        
        # ====== Update batch status ======
        batch.batch_status = "completed"
        batch.ended_at_utc = now
        db.add(batch)
        
        # ====== Update TripRequest status ======
        trip_req.status = "driver_assigned"
        trip_req.updated_at_utc = now
        db.add(trip_req)
        
        db.commit()
        db.refresh(trip)
        
        return {
            "response": "accepted",
            "trip_id": trip.trip_id,
            "trip_request_id": trip_request_id,
            "driver_id": driver.driver_id,
            "message": "Trip accepted! You are now assigned.",
            "otp_code": trip.otp_code,  # Will be generated during trip start
        }
    
    raise HTTPException(
        status_code=400,
        detail="Invalid response. Use 'accepted' or 'rejected'"
    )
    candidate.response_at_utc = now

    trip.driver_id = driver.driver_id
    trip.vehicle_id = assignment.vehicle_id
    trip.trip_status = "assigned"
    trip.assigned_at_utc = now
    db.query(TripDispatchCandidate).filter(
        TripDispatchCandidate.trip_id == trip_id,
        TripDispatchCandidate.driver_id != driver.driver_id,
        TripDispatchCandidate.response_code.is_(None),
    ).update(
        {"response_code": "timeout"},
        synchronize_session=False,
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
    otp = generate_trip_otp()
    store_trip_otp(trip.trip_id, otp)
    runtime_status.runtime_status = "on_trip"
    runtime_status.last_updated_utc = now
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

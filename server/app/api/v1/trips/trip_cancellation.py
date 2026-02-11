"""
Trip Cancellation Endpoint - Step 16 of Trip Lifecycle

Handle trip cancellations at any stage with proper penalties.

Cancellation stages:
- Before assigned: No fee
- After assigned (before pickup): Rider pays 50% of estimated fare
- After pickup: Rider pays 100% of estimated fare
- Driver cancellation: Driver pays cancellation fee
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from pydantic import BaseModel
from decimal import Decimal

from app.core.dependencies import get_db
from app.core.security.roles import require_rider, require_driver
from app.models.core.drivers.drivers import Driver
from app.models.core.trips.trips import Trip
from app.models.core.users.users import User
from app.models.core.trips.trip_status_history import TripStatusHistory
from app.models.core.drivers.driver_current_status import DriverCurrentStatus
from app.core.ledger.ledger_service import LedgerService
from app.schemas.core.trips.trip_cancel import CancellationRequest, CancellationResponse
from app.models.core.trips.trip_request import TripRequest

router = APIRouter(
    prefix="/trips",
    tags=["Trips – Cancellation"],
)





@router.post("/rider/{trip_id}/cancel", response_model=CancellationResponse, status_code=status.HTTP_200_OK)
def cancel_trip_rider(
    trip_id: int,
    payload: CancellationRequest,
    db: Session = Depends(get_db),
    rider: User = Depends(require_rider),
):
    now = datetime.now(timezone.utc)
    
    # ------------------------------------------------
    # 1️⃣ Validate trip ownership
    # ------------------------------------------------
    trip = db.query(Trip).filter(
        Trip.trip_id == trip_id,
        Trip.user_id == rider.user_id,
    ).with_for_update().first()
    
    if not trip:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trip not found"
        )
    
    # ------------------------------------------------
    # 2️⃣ Check if cancellation allowed
    # ------------------------------------------------
    if trip.trip_status in ["completed", "cancelled"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot cancel trip in '{trip.trip_status}' state"
        )
    
    # ------------------------------------------------
    # 3️⃣ Calculate cancellation fee
    # ------------------------------------------------
    cancellation_fee = Decimal("0")
    
    if trip.trip_status == "assigned":
        # 50% of estimated fare
        estimated_fare = Decimal(str(trip.fare_total or 0))
        cancellation_fee = (estimated_fare * Decimal("0.5"))
    
    elif trip.trip_status == "picked_up":
        # 100% of estimated fare (max 500)
        estimated_fare = Decimal(str(trip.fare_total or 0))
        cancellation_fee = min(estimated_fare, Decimal("500"))
    
    # ------------------------------------------------
    # 4️⃣ Release driver
    # ------------------------------------------------
    if trip.driver_id:
        driver_status = db.query(DriverCurrentStatus).filter(
            DriverCurrentStatus.driver_id == trip.driver_id,
        ).with_for_update().first()
        
        if driver_status:
            driver_status.runtime_status = "available"
            driver_status.current_trip_id = None
            driver_status.updated_at_utc = now
            db.add(driver_status)
            db.flush()
    
    # ------------------------------------------------
    # 5️⃣ Create cancellation ledger entry
    # ------------------------------------------------
    if cancellation_fee > 0:
        LedgerService.create_cancellation_entries(
            db=db,
            trip=trip,
            cancellation_fee=cancellation_fee,
            cancelled_by="rider",
            now=now,
        )
    
    # ------------------------------------------------
    # 6️⃣ Move trip to cancelled
    # ------------------------------------------------
    trip.trip_status = "cancelled"
    trip.cancelled_at_utc = now
    db.add(trip)
    
    db.add(TripStatusHistory(
        tenant_id=trip.tenant_id,
        trip_id=trip.trip_id,
        from_status=trip.trip_status,
        to_status="cancelled",
        changed_at_utc=now,
        changed_by=rider.user_id,
    ))
    
    db.commit()
    
    return CancellationResponse(
        status="trip_cancelled",
        trip_id=trip.trip_id,
        cancellation_fee=float(cancellation_fee) if cancellation_fee > 0 else None,
        message=f"Trip cancelled by rider. Reason: {payload.reason}" + (
            f". Cancellation fee: ₹{cancellation_fee:.2f}" if cancellation_fee > 0 else ""
        )
    )

@router.post(
    "/driver/{trip_id}/cancel",
    response_model=CancellationResponse,
    status_code=status.HTTP_200_OK,
)
def cancel_trip_driver(
    trip_id: int,
    payload: CancellationRequest,
    db: Session = Depends(get_db),
    driver: Driver = Depends(require_driver),
):
    now = datetime.now(timezone.utc)

    trip = (
        db.query(Trip)
        .filter(
            Trip.trip_id == trip_id,
            Trip.driver_id == driver.driver_id,
        )
        .with_for_update()
        .first()
    )

    if not trip:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trip not found",
        )


    if trip.trip_status in ["picked_up", "completed", "cancelled"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Driver cannot cancel trip in '{trip.trip_status}' state",
        )

    previous_status = trip.trip_status

    # ------------------------------------------------
    # 3️⃣ Unlock Driver Runtime
    # ------------------------------------------------
    driver_status = (
        db.query(DriverCurrentStatus)
        .filter(DriverCurrentStatus.driver_id == driver.driver_id)
        .with_for_update()
        .first()
    )

    if driver_status:
        driver_status.runtime_status = "available"
        driver_status.current_trip_id = None
        driver_status.updated_at_utc = now
        db.add(driver_status)

    # ------------------------------------------------
    # 4️⃣ Cancel Trip
    # ------------------------------------------------
    trip.trip_status = "cancelled"
    trip.cancelled_at_utc = now
    trip.updated_at_utc = now
    db.add(trip)

    # ------------------------------------------------
    # 5️⃣ Reset TripRequest (Important for re-dispatch)
    # ------------------------------------------------
    trip_req = (
        db.query(TripRequest)
        .filter(TripRequest.trip_request_id == trip.trip_request_id)
        .with_for_update()
        .first()
    )

    if trip_req:
        trip_req.status = "driver_searching"
       
        trip_req.updated_at_utc = now
        db.add(trip_req)

  
    db.add(
        TripStatusHistory(
            tenant_id=trip.tenant_id,
            trip_id=trip.trip_id,
            from_status=previous_status,
            to_status="cancelled",
            changed_at_utc=now,
            changed_by=driver.user_id,
        )
    )

    # ------------------------------------------------
    # 7️⃣ Commit
    # ------------------------------------------------
    db.commit()

    return CancellationResponse(
        status="trip_cancelled",
        trip_id=trip.trip_id,
        message=f"Trip cancelled by driver. Reason: {payload.reason}",
    )
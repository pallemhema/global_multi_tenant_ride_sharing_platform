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
    """
    STEP 16A: Rider cancels trip.
    
    Cancellation fees:
    - Before assignment: No fee
    - After assignment (before pickup): 50% of estimated fare
    - After pickup: 100% of estimated fare (up to max 500)
    
    Flow:
    1. Validate trip ownership
    2. Check if cancellation is allowed
    3. Calculate cancellation fee based on stage
    4. Release driver
    5. Create cancellation ledger entry
    6. Move trip to cancelled status
    """
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


@router.post("/driver/{trip_id}/cancel", response_model=CancellationResponse, status_code=status.HTTP_200_OK)
def cancel_trip_driver(
    trip_id: int,
    payload: CancellationRequest,
    db: Session = Depends(get_db),
    driver: Driver = Depends(require_driver),
):
    """
    STEP 16B: Driver cancels trip.
    
    Driver cancellation fee: ₹100 (fixed)
    Only allowed before/during pickup, not after trip started.
    
    Flow:
    1. Validate trip ownership
    2. Check if cancellation allowed
    3. Apply driver cancellation fee (₹100)
    4. Release driver
    5. Create cancellation ledger entry
    6. Move trip to cancelled status
    """
    now = datetime.now(timezone.utc)
    
    # ------------------------------------------------
    # 1️⃣ Validate trip ownership
    # ------------------------------------------------
    trip = db.query(Trip).filter(
        Trip.trip_id == trip_id,
        Trip.driver_id == driver.driver_id,
    ).with_for_update().first()
    
    if not trip:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trip not found"
        )
    
    # ------------------------------------------------
    # 2️⃣ Check if cancellation allowed
    # ------------------------------------------------
    # Driver cannot cancel after picking up rider
    if trip.trip_status in ["picked_up", "completed", "cancelled"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Driver cannot cancel trip in '{trip.trip_status}' state"
        )
    
    # ------------------------------------------------
    # 3️⃣ Apply cancellation fee (₹100)
    # ------------------------------------------------
    cancellation_fee = Decimal("100")
    
    # ------------------------------------------------
    # 4️⃣ Release driver back to available
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
    # LedgerService.create_cancellation_entries(
    #     db=db,
    #     trip=trip,
    #     cancellation_fee=cancellation_fee,
    #     cancelled_by="driver",
    #     now=now,
    # )
    
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
        changed_by=driver.driver_id,
    ))
    
    db.commit()
    
    return CancellationResponse(
        status="trip_cancelled",
        trip_id=trip.trip_id,
        cancellation_fee=float(cancellation_fee),
        message=f"Trip cancelled by driver. Reason: {payload.reason}. Cancellation fee: ₹{cancellation_fee:.2f}"
    )

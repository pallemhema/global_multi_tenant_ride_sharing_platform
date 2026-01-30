"""
Trip Start Endpoint - Step 11 of Trip Lifecycle

Driver reaches pickup location and verifies OTP from rider.
Once verified, trip moves to picked_up status.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from pydantic import BaseModel

from app.core.dependencies import get_db
from app.core.security.roles import require_driver
from app.core.trips.trip_otp_service import TripOTPService
from app.models.core.trips.trips import Trip
from app.models.core.trips.trip_status_history import TripStatusHistory
from app.models.core.drivers.drivers import Driver

router = APIRouter(
    prefix="/driver/trips",
    tags=["Driver – Trips"],
)


# ================================================================
# REQUEST/RESPONSE SCHEMAS
# ================================================================

class TripStartRequest(BaseModel):
    """Trip start OTP verification"""
    otp: str


class TripStartResponse(BaseModel):
    """Trip start success response"""
    status: str
    trip_id: int
    message: str


# ================================================================
# STEP 11: TRIP START - OTP VERIFICATION
# ================================================================

@router.post("/{trip_id}/start", response_model=TripStartResponse, status_code=status.HTTP_200_OK)
def start_trip(
    trip_id: int,
    payload: TripStartRequest,
    db: Session = Depends(get_db),
    driver: Driver = Depends(require_driver),
):
    """
    STEP 11: Driver reaches pickup & starts trip via OTP verification.
    
    Flow:
    1. Validate trip ownership & current status (assigned)
    2. Verify OTP matches and hasn't expired
    3. Mark trip as picked_up
    4. Record status history
    
    Returns: Confirmation with trip_id
    """
    now = datetime.now(timezone.utc)
    
    # ------------------------------------------------
    # 1️⃣ Validate trip ownership & state
    # ------------------------------------------------
    trip = db.query(Trip).filter(
        Trip.trip_id == trip_id,
        Trip.driver_id == driver.driver_id,
        Trip.trip_status == "assigned",
    ).with_for_update().first()
    
    if not trip:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trip not found or not eligible for start (must be in 'assigned' state)"
        )
    
    # ------------------------------------------------
    # 2️⃣ Verify OTP
    # ------------------------------------------------
    is_valid = TripOTPService.verify_otp(
        db=db,
        trip_id=trip_id,
        provided_otp=payload.otp,
    )
    
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired OTP"
        )
    
    # ------------------------------------------------
    # 3️⃣ Mark trip as started (picked_up)
    # ------------------------------------------------
    trip.trip_status = "picked_up"
    trip.picked_up_at_utc = now
    db.add(trip)
    
    # Record status transition
    db.add(TripStatusHistory(
        tenant_id=trip.tenant_id,
        trip_id=trip.trip_id,
        from_status="assigned",
        to_status="picked_up",
        changed_at_utc=now,
        changed_by=driver.driver_id,
    ))
    
    db.commit()
    
    return TripStartResponse(
        status="trip_started",
        trip_id=trip.trip_id,
        message=f"Trip {trip_id} successfully started with rider onboard"
    )

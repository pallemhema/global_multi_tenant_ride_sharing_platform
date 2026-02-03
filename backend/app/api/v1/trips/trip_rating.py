"""
Post-Trip Activities Endpoint - Step 15 of Trip Lifecycle

Handle post-trip activities:
- Rider rating of driver
- Analytics recording
- Driver availability reset
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from pydantic import BaseModel
from decimal import Decimal

from app.core.dependencies import get_db
from app.core.security.roles import require_rider
from app.models.core.users.users import User
from app.models.core.trips.trips import Trip
from app.models.core.drivers.drivers import Driver

router = APIRouter(
    prefix="/rider/trips",
    tags=["Rider – Trips"],
)


# ================================================================
# REQUEST/RESPONSE SCHEMAS
# ================================================================

class TripRatingRequest(BaseModel):
    """Rider rating of trip and driver"""
    rating: int  # 1-5 stars
    comment: str | None = None


class TripRatingResponse(BaseModel):
    """Rating submission response"""
    status: str
    trip_id: int
    message: str


# ================================================================
# STEP 15: POST-TRIP ACTIVITIES
# ================================================================

@router.post("/{trip_id}/rate", response_model=TripRatingResponse, status_code=status.HTTP_200_OK)
def rate_trip(
    trip_id: int,
    payload: TripRatingRequest,
    db: Session = Depends(get_db),
    rider: User = Depends(require_rider),
):
    """
    STEP 15: Rider rates completed trip.
    
    Flow:
    1. Validate trip ownership & state (completed)
    2. Validate rating (1-5 stars)
    3. Store rating
    4. Update driver rating aggregate
    5. Record analytics
    
    Returns: Confirmation
    """
    now = datetime.now(timezone.utc)
    
    if payload.rating < 1 or payload.rating > 5:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Rating must be between 1 and 5"
        )
    
    # ------------------------------------------------
    # 1️⃣ Validate trip ownership & state
    # ------------------------------------------------
    trip = db.query(Trip).filter(
        Trip.trip_id == trip_id,
        Trip.user_id == rider.user_id,
        Trip.trip_status == "completed",
    ).first()
    
    if not trip:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trip not found or not eligible for rating (must be completed)"
        )
    
    # Check if already rated
    # (Assuming there's a trip_rating column or separate ratings table)
    if hasattr(trip, 'rider_rating') and trip.rider_rating:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Trip already rated"
        )
    
    # ------------------------------------------------
    # 2️⃣ Store rating
    # ------------------------------------------------
    trip.rider_rating = payload.rating
    trip.rider_comment = payload.comment
    trip.rated_at_utc = now
    db.add(trip)
    db.flush()
    
    # ------------------------------------------------
    # 3️⃣ Update driver rating aggregate
    # ------------------------------------------------
    driver = db.query(Driver).filter(
        Driver.driver_id == trip.driver_id
    ).first()
    
    if driver:
        # Calculate new average rating
        # (This is simplified - in production, use trigger or separate calculation)
        from sqlalchemy import func
        
        ratings = db.query(
            func.avg(Trip.rider_rating)
        ).filter(
            Trip.driver_id == trip.driver_id,
            Trip.rider_rating.isnot(None),
        ).scalar() or Decimal("0")
        
        driver.rating_avg = float(ratings)
        db.add(driver)
        db.flush()
    
    # ------------------------------------------------
    # 4️⃣ Record analytics
    # ------------------------------------------------
    # TODO: Implement analytics recording if needed
    # Could be:
    # - TripAnalytics model
    # - Redis counter for daily stats
    # - Analytics service
    
    db.commit()
    
    return TripRatingResponse(
        status="rating_submitted",
        trip_id=trip.trip_id,
        message=f"Thank you for rating! You rated driver {trip.driver_id} as {payload.rating}/5 stars"
    )


@router.get("/{trip_id}/receipt", status_code=status.HTTP_200_OK)
def get_trip_receipt(
    trip_id: int,
    db: Session = Depends(get_db),
    rider: User = Depends(require_rider),
):
    """
    Get trip receipt/invoice after completion.
    
    Returns all trip details, fare breakdown, and payment info.
    Verifies ownership through TripRequest -> Trip relationship.
    """
    from app.models.core.trips.trip_request import TripRequest
    
    # Query trip first
    trip = db.query(Trip).filter(
        Trip.trip_id == trip_id,
    ).first()
    
    if not trip:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trip not found"
        )
    
    # Query trip request to verify ownership and get addresses
    trip_req = db.query(TripRequest).filter(
        TripRequest.trip_request_id == trip.trip_request_id,
        TripRequest.user_id == rider.user_id,
    ).first()
    
    if not trip_req:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trip not found or access denied"
        )
    
    # Fetch fare details
    from app.models.core.trips.trip_fare import TripFare
    
    fare = db.query(TripFare).filter(
        TripFare.trip_id == trip_id
    ).first()
    
    # Try to get OTP from Redis with logging
    otp = None
    try:
        from app.core.redis import redis_client
        from app.core.trips.trip_otp_service import _otp_plain_key
        otp_key = _otp_plain_key(trip_id)
        otp_bytes = redis_client.get(otp_key)
        if otp_bytes:
            otp = otp_bytes.decode() if isinstance(otp_bytes, bytes) else otp_bytes
            print(f"[RECEIPT] Successfully retrieved OTP from Redis for trip_id={trip_id}: {otp}")
        else:
            print(f"[RECEIPT] No OTP found in Redis for trip_id={trip_id}")
    except Exception as e:
        print(f"[RECEIPT] ERROR reading OTP from Redis for trip_id={trip_id}: {e}")
        otp = None
    
    receipt = {
        "trip_id": trip.trip_id,
        "status": trip.trip_status,
        "otp": otp,
        "pickup_address": trip_req.pickup_address,
        "drop_address": trip_req.drop_address,
        "distance_km": float(trip.distance_km or 0),
        "duration_minutes": trip.duration_minutes or 0,
        "base_fare": float(fare.base_fare) if fare else 0,
        "distance_charge": float(fare.distance_fare) if fare else 0,
        "time_charge": float(fare.time_fare) if fare else 0,
        "tax": float(fare.tax_amount) if fare else 0,
        "discount": float(fare.discount_amount) if fare else 0,
        "total_fare": float(fare.final_fare) if fare else 0,
        "currency": "INR",
        "driver": {
            "driver_id": trip.driver_id,
            "vehicle_category": trip.selected_vehicle_category,
        },
        "surge_multiplier": float(fare.surge_multiplier) if fare and hasattr(fare, 'surge_multiplier') else 1.0,
    }
    
    return receipt

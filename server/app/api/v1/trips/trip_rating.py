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

from decimal import Decimal

from app.core.dependencies import get_db
from app.core.security.roles import require_rider
from app.models.core.users.users import User
from app.models.core.trips.trips import Trip
from app.models.core.drivers.drivers import Driver
from app.schemas.core.trips.trip_rating import RateTripRequest
from app.models.core.trips.trip_request import TripRequest

from sqlalchemy import func

router = APIRouter(
    prefix="/rider/trips",
    tags=["Rider – Trips"],
)



@router.post("/{trip_id}/rate")
def rate_trip(
    trip_id: int,
    payload: RateTripRequest,
    db: Session = Depends(get_db),
    user: User = Depends(require_rider),
):
    trip = db.get(Trip, trip_id)

    if not trip:
        raise HTTPException(404, "Trip not found")

    # Get TripRequest safely
    trip_request = db.get(TripRequest, trip.trip_request_id)
    if not trip_request:
        raise HTTPException(404, "Trip request not found")

    if trip_request.user_id != user.user_id:
        raise HTTPException(403, "Not allowed to rate this trip")

    if trip.trip_status != "completed":
        raise HTTPException(400, "Trip not completed")

    if trip.rating is not None:
        raise HTTPException(400, "Trip already rated")

    # Save trip rating
    trip.rating = payload.rating
    trip.rating_comment = payload.comment
    trip.rated_at_utc = datetime.now(timezone.utc)

    # Update driver rating
    driver = db.get(Driver, trip.driver_id)

    if driver:
        old_avg = float(driver.average_rating or 0)
        old_count = int(driver.total_ratings or 0)
        new_rating = payload.rating

        new_count = old_count + 1
        new_avg = ((old_avg * old_count) + new_rating) / new_count

        driver.average_rating = round(new_avg, 2)
        driver.total_ratings = new_count

    db.commit()

    return {
        "message": "Trip rated successfully",
        "driver_average_rating": driver.average_rating if driver else None,
        "total_ratings": driver.total_ratings if driver else None,
    }

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
    
    # # Try to get OTP from Redis with logging
    # otp = None
    # try:
    #     from app.core.redis import redis_client
    #     from app.core.trips.trip_otp_service import _otp_plain_key
    #     otp_key = _otp_plain_key(trip_id)
    #     otp_bytes = redis_client.get(otp_key)
    #     if otp_bytes:
    #         otp = otp_bytes.decode() if isinstance(otp_bytes, bytes) else otp_bytes
    #         print(f"[RECEIPT] Successfully retrieved OTP from Redis for trip_id={trip_id}: {otp}")
    #     else:
    #         print(f"[RECEIPT] No OTP found in Redis for trip_id={trip_id}")
    # except Exception as e:
    #     print(f"[RECEIPT] ERROR reading OTP from Redis for trip_id={trip_id}: {e}")
    #     otp = None
    
    receipt = {
        "trip_id": trip.trip_id,
        "status": trip.trip_status,
        
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
        "rating": trip.rating,
        "driver": {
            "driver_id": trip.driver_id,
            "vehicle_category": trip.selected_vehicle_category,
        },
        "surge_multiplier": float(fare.surge_multiplier) if fare and hasattr(fare, 'surge_multiplier') else 1.0,
    }
    
    return receipt

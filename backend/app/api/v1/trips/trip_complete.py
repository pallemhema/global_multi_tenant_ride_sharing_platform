"""
Trip Complete Endpoint - Step 12 of Trip Lifecycle

Driver marks trip complete at drop location.
System calculates final fare and initiates payment.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from decimal import Decimal
from pydantic import BaseModel

from app.core.dependencies import get_db
from app.core.security.roles import require_driver
from app.core.fare.pricing_engine import PricingEngine
from app.models.core.trips.trips import Trip
from app.models.core.trips.trip_fare import TripFare
from app.models.core.trips.trip_status_history import TripStatusHistory
from app.models.core.drivers.driver_current_status import DriverCurrentStatus
from app.models.core.drivers.drivers import Driver
from app.models.core.vehicles.vehicles import Vehicle
from app.core.ledger.ledger_service import LedgerService

router = APIRouter(
    prefix="/driver/trips",
    tags=["Driver – Trips"],
)


# ================================================================
# REQUEST/RESPONSE SCHEMAS
# ================================================================

class TripCompleteRequest(BaseModel):
    """Trip completion with actual distance/duration"""
    distance_km: float
    duration_minutes: int
    coupon_code: str | None = None


class FareBreakdown(BaseModel):
    """Fare calculation details"""
    base_fare: float
    distance_charge: float
    time_charge: float
    subtotal: float
    tax_amount: float
    coupon_discount: float = 0.0
    total_fare: float
    currency: str


class TripCompleteResponse(BaseModel):
    """Trip completion success response"""
    status: str
    trip_id: int
    fare: FareBreakdown
    message: str


# ================================================================
# STEP 12: TRIP COMPLETION & FARE CALCULATION
# ================================================================

@router.post("/{trip_id}/complete", response_model=TripCompleteResponse, status_code=status.HTTP_200_OK)
def complete_trip(
    trip_id: int,
    payload: TripCompleteRequest,
    db: Session = Depends(get_db),
    driver: Driver = Depends(require_driver),
):
    """
    STEP 12: Driver marks trip complete at drop location.
    
    Flow:
    1. Validate trip ownership & state (picked_up)
    2. Lock trip (prevent double completion)
    3. Store actual distance/duration
    4. Calculate final fare (5 components)
    5. Persist fare breakdown
    6. Release driver availability
    7. Create settlement ledger entries
    8. Move trip to payment_pending status
    
    Returns: Fare breakdown for payment
    """
    now = datetime.now(timezone.utc)
    
    # ------------------------------------------------
    # 1️⃣ Fetch trip (strict validation)
    # ------------------------------------------------
    trip = db.query(Trip).filter(
        Trip.trip_id == trip_id,
        Trip.driver_id == driver.driver_id,
        Trip.trip_status == "picked_up",
    ).with_for_update().first()
    
    if not trip:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trip not found or not eligible for completion (must be in 'picked_up' state)"
        )
    
    # ------------------------------------------------
    # 2️⃣ Persist actual distance & duration
    # ------------------------------------------------
    trip.distance_km = payload.distance_km
    trip.duration_minutes = payload.duration_minutes
    db.add(trip)
    db.flush()
    
    # ------------------------------------------------
    # 3️⃣ Resolve vehicle category from database
    # ------------------------------------------------
    vehicle = db.query(Vehicle).filter(
        Vehicle.vehicle_id == trip.vehicle_id
    ).first()
    
    if not vehicle:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Assigned vehicle not found in system"
        )
    
    # ------------------------------------------------
    # 4️⃣ Calculate final fare (pricing engine)
    # ------------------------------------------------
    fare_breakdown = PricingEngine.calculate_final_fare(
        db=db,
        tenant_id=trip.tenant_id,
        city_id=trip.city_id,
        vehicle_category=vehicle.vehicle_category,
        distance_km=payload.distance_km,
        duration_minutes=payload.duration_minutes,
        coupon_discount=Decimal("0"),  # TODO: Apply coupon logic
    )
    
    # ------------------------------------------------
    # 5️⃣ Persist fare breakdown
    # ------------------------------------------------
    existing_fare = db.query(TripFare).filter(
        TripFare.trip_id == trip_id
    ).first()
    
    if existing_fare:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Fare already calculated for this trip"
        )
    
    trip_fare = TripFare(
        trip_id=trip_id,
        base_fare=Decimal(str(fare_breakdown["base_fare"])),
        distance_fare=Decimal(str(fare_breakdown["distance_charge"])),
        time_fare=Decimal(str(fare_breakdown["time_charge"])),
        surge_multiplier=Decimal(str(fare_breakdown["surge_multiplier"])),
        subtotal=Decimal(str(fare_breakdown["subtotal"])),
        tax_amount=Decimal(str(fare_breakdown["tax_amount"])),
        discount_amount=Decimal(str(fare_breakdown["coupon_discount"])),
        final_fare=Decimal(str(fare_breakdown["total_fare"])),
    )
    
    db.add(trip_fare)
    db.flush()
    
    # ------------------------------------------------
    # 6️⃣ Release driver availability
    # ------------------------------------------------
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
    # 7️⃣ Create settlement ledger entries
    # ------------------------------------------------
    LedgerService.create_settlement_entries(
        db=db,
        trip=trip,
        total_fare=Decimal(str(fare_breakdown["total_fare"])),
        coupon_discount=Decimal(str(fare_breakdown["coupon_discount"])),
        now=now,
    )
    
    # ------------------------------------------------
    # 8️⃣ Move trip to payment_pending status
    # ------------------------------------------------
    trip.trip_status = "payment_pending"
    trip.completed_at_utc = now
    db.add(trip)
    
    # Record status transition
    db.add(TripStatusHistory(
        tenant_id=trip.tenant_id,
        trip_id=trip.trip_id,
        from_status="picked_up",
        to_status="payment_pending",
        changed_at_utc=now,
        changed_by=driver.driver_id,
    ))
    
    db.commit()
    
    return TripCompleteResponse(
        status="trip_completed",
        trip_id=trip.trip_id,
        fare=FareBreakdown(
            base_fare=fare_breakdown["base_fare"],
            distance_charge=fare_breakdown["distance_charge"],
            time_charge=fare_breakdown["time_charge"],
            subtotal=fare_breakdown["subtotal"],
            tax_amount=fare_breakdown["tax_amount"],
            coupon_discount=fare_breakdown["coupon_discount"],
            total_fare=fare_breakdown["total_fare"],
            currency=fare_breakdown["currency"],
        ),
        message=f"Trip {trip_id} completed. Final fare: ₹{fare_breakdown['total_fare']:.2f}"
    )

    return {
        "status": "payment_initiated",
        "trip_id": trip.trip_id,
        "payment_id": payment.payment_id,
        "amount": fare["final_fare"],
    }

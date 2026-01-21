# # app/api/v1/trips/trip_complete.py

# from fastapi import APIRouter, Depends, HTTPException
# from sqlalchemy.orm import Session
# from datetime import datetime, timezone

# from app.core.dependencies import get_db
# from app.core.security.roles import require_driver

# from app.models.core.trips.trips import Trip
# from app.models.core.trips.trip_status_history import TripStatusHistory
# from app.schemas.core.trips.trip_request import TripCompleteRequest

# from app.core.fare.calculator import calculate_fare
# from app.core.accounting.ledger import post_trip_ledger
# from app.core.payments.initiate import initiate_payment
# from app.models.core.trips.trip_fare import TripFare


# router = APIRouter(
#     prefix="/driver/trips",
#     tags=["Driver – Trips"],
# )


# @router.post("/{trip_id}/complete")
# def complete_trip(
#     trip_id: int,
#     payload: TripCompleteRequest,
#     db: Session = Depends(get_db),
#     driver=Depends(require_driver),
# ):
#     now = datetime.now(timezone.utc)

#     # 1️⃣ Fetch trip
#     trip = (
#         db.query(Trip)
#         .filter(
#             Trip.trip_id == trip_id,
#             Trip.driver_id == driver.driver_id,
#             Trip.trip_status == "picked_up",
#         )
#         .first()
#     )

#     if not trip:
#         raise HTTPException(404, "Trip not eligible for completion")

#     if trip.completed_at_utc:
#         raise HTTPException(400, "Trip already completed")

#     # 2️⃣ Mark trip completed
#     trip.trip_status = "completed"
#     trip.completed_at_utc = now
#     trip.distance_km = payload.distance_km
#     trip.duration_minutes = payload.duration_minutes
  

#     # 3️⃣ Status history
#     db.add(
#         TripStatusHistory(
#             tenant_id=trip.tenant_id,
#             trip_id=trip.trip_id,
#             from_status="picked_up",
#             to_status="completed",
#             changed_at_utc=now,
#             changed_by=driver.user_id,
#         )
#     )
#         # 4️⃣ Calculate fare
#     fare = calculate_fare(
#         db=db,
#         tenant_id=trip.tenant_id,
#         city_id=trip.city_id,
#         vehicle_category=trip.vehicle.category_code,
#         distance_km=payload.distance_km,
#         duration_minutes=payload.duration_minutes,
#         rider_id=trip.rider_id,
#         trip_id=trip.trip_id,
#         coupon_code=payload.coupon_code,
#     )

#     # 5️⃣ Persist fare snapshot
#     db.add(
#         TripFare(
#             trip_id=trip.trip_id,
#             base_fare=fare["base_fare"],
#             distance_fare=fare["distance_fare"],
#             time_fare=fare["time_fare"],
#             surge_multiplier=fare["surge_multiplier"],
#             subtotal=fare["subtotal"],
#             tax_amount=fare["tax_amount"],
#             discount_amount=fare["discount"],
#             final_fare=fare["final_fare"],
#         )
#     )

#     # 6️⃣ Ledger postings (money truth)
#     post_trip_ledger(
#         db=db,
#         trip=trip,
#         fare=fare,
#     )

#     # 7️⃣ Initiate payment (non-blocking)
#     initiate_payment(
#         db=db,
#         trip=trip,
#         amount=fare["final_fare"],
#     )

#     db.commit()

#     return {
#         "status": "trip completed",
#         "trip_id": trip.trip_id,
#         "distance_km": payload.distance_km,
#         "duration_minutes": payload.duration_minutes,
#     }


from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from app.core.dependencies import get_db
from app.core.security.roles import require_driver
from app.core.fare.calculator import calculate_fare
from app.core.payments.initiate import initiate_payment

from app.models.core.trips.trips import Trip
from app.models.core.trips.trip_fare import TripFare
from app.models.core.trips.trip_status_history import TripStatusHistory
from app.schemas.core.trips.trip_request import TripCompleteRequest
from app.models.core.drivers.driver_current_status import DriverCurrentStatus


router = APIRouter(
    prefix="/driver/trips",
    tags=["Driver – Trips"],
)


@router.post("/{trip_id}/complete")
def complete_trip(
    trip_id: int,
    payload: TripCompleteRequest,
    db: Session = Depends(get_db),
    driver=Depends(require_driver),
):
    now = datetime.now(timezone.utc)

    # 1️⃣ Fetch trip
    trip = (
        db.query(Trip)
        .filter(
            Trip.trip_id == trip_id,
            Trip.driver_id == driver.driver_id,
            Trip.trip_status == "picked_up",
        )
        .first()
    )

    if not trip:
        raise HTTPException(404, "Trip not eligible for completion")

    # 2️⃣ Save distance & duration
    trip.distance_km = payload.distance_km
    trip.duration_minutes = payload.duration_minutes

    # 3️⃣ Calculate fare
    fare = calculate_fare(
        db=db,
        tenant_id=trip.tenant_id,
        city_id=trip.city_id,
        vehicle_category=payload.vehicle_category,
        distance_km=payload.distance_km,
        duration_minutes=payload.duration_minutes,
        rider_id=trip.rider_id,
        trip_id=trip.trip_id,
        coupon_code=payload.coupon_code,
    )
    existing_fare = (
        db.query(TripFare)
        .filter(TripFare.trip_id == trip.trip_id)
        .first()
    )
    if not existing_fare:
        # 4️⃣ Persist fare snapshot (immutable)
        db.add(
            TripFare(
                trip_id=trip.trip_id,
                base_fare=fare["base_fare"],
                distance_fare=fare["distance_fare"],
                time_fare=fare["time_fare"],
                surge_multiplier=fare["surge_multiplier"],
                subtotal=fare["subtotal"],
                tax_amount=fare["tax_amount"],
                discount_amount=fare["discount"],
                final_fare=fare["final_fare"],
            )
        )



    driver_status = (
        db.query(DriverCurrentStatus)
        .filter(
            DriverCurrentStatus.driver_id == trip.driver_id,
            DriverCurrentStatus.tenant_id == trip.tenant_id,
        )
        .first()
    )
    if not driver_status:
        raise HTTPException(500, "Driver runtime status missing")

    driver_status.runtime_status = "available"
    driver_status.last_updated_utc = now


    # 5️⃣ Initiate payment
    payment = initiate_payment(
        db=db,
        tenant_id=trip.tenant_id,
        trip_id=trip.trip_id,
        rider_id=trip.rider_id,
        amount=fare["final_fare"],
        currency="INR",
    )

    # 6️⃣ Move trip to payment_pending
    trip.trip_status = "payment_pending"

    db.add(
        TripStatusHistory(
            tenant_id=trip.tenant_id,
            trip_id=trip.trip_id,
            from_status="picked_up",
            to_status="payment_pending",
            changed_at_utc=now,
            changed_by=driver.user_id,
        )
    )

    db.commit()

    return {
        "status": "payment_initiated",
        "trip_id": trip.trip_id,
        "payment_id": payment.payment_id,
        "amount": fare["final_fare"],
    }

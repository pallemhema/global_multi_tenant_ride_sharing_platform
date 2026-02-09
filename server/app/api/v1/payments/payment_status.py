from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.dependencies import get_db
from app.core.security.roles import require_driver
from app.models.core.payments.payments import Payment
from app.models.core.trips.trips import Trip

router = APIRouter(
    prefix="/trips",
    tags=["Payments"],
)


@router.get("/driver/payments/pending")
@router.get("/driver/payments/pending")
def get_pending_payments(
    db: Session = Depends(get_db),
    driver=Depends(require_driver),
):
    payments = (
        db.query(Payment)
        .join(Trip, Trip.trip_id == Payment.trip_id)
        .filter(
            Trip.driver_id == driver.driver_id,
            Payment.payment_status == "initiated",
        )
        .order_by(Payment.created_at_utc.desc())
        .all()
    )

    return [
        {
            "trip_id": p.trip_id,
            "payment_id": p.payment_id,
            "amount": float(p.amount),
            "currency": p.currency_code,
            "payment_status": p.payment_status,
            "created_at": p.created_at_utc,
        }
        for p in payments
    ]

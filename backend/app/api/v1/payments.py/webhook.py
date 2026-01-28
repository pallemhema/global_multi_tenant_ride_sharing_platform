from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from app.core.dependencies import get_db
from app.core.accounting.ledger import post_trip_ledger

from app.models.core.payments.payments import Payment
from app.models.core.trips.trips import Trip
from app.models.core.trips.trip_status_history import TripStatusHistory

router = APIRouter(prefix="/payments", tags=["Payments"])


@router.post("/webhook")
def payment_webhook(payload: dict, db: Session = Depends(get_db)):
    """
    Payload example:
    {
        "payment_id": 123,
        "status": "successful",
        "gateway_reference": "upi_txn_9988"
    }
    """

    payment = (
        db.query(Payment)
        .filter(Payment.payment_id == payload["payment_id"])
        .first()
    )

    if not payment:
        raise HTTPException(404, "Payment not found")

    if payment.payment_status == "successful":
        return {"status": "already_processed"}

    now = datetime.now(timezone.utc)

    # 1️⃣ Update payment
    payment.payment_status = payload["status"]
    payment.gateway_reference = payload.get("gateway_reference")
    payment.paid_at_utc = now

    if payload["status"] != "successful":
        db.commit()
        return {"status": "payment_failed_recorded"}

    # 2️⃣ Fetch trip
    trip = (
        db.query(Trip)
        .filter(Trip.trip_id == payment.trip_id)
        .first()
    )

    if not trip:
        raise HTTPException(404, "Trip not found")

    # 3️⃣ Post ledger entries (single source of truth)
    post_trip_ledger(
        db=db,
        tenant_id=trip.tenant_id,
        trip_id=trip.trip_id,
    )

    # 4️⃣ Mark trip completed
    trip.trip_status = "completed"
    trip.completed_at_utc = now

    db.add(
        TripStatusHistory(
            tenant_id=trip.tenant_id,
            trip_id=trip.trip_id,
            from_status="payment_pending",
            to_status="completed",
            changed_at_utc=now,
            changed_by=None,  # system
        )
    )

    db.commit()

    return {
        "status": "payment_success_processed",
        "trip_id": trip.trip_id,
    }

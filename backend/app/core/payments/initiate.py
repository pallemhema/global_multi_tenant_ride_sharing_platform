from decimal import Decimal
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from app.models.core.payments.payments import Payment


def initiate_payment(
    *,
    db: Session,
    tenant_id: int,
    trip_id: int,
    rider_id: int,
    amount: Decimal,
    currency_code: str,
    payment_method: str = "upi",
):
    """
    Initiates payment after trip completion.
    """

    payment = Payment(
        tenant_id=tenant_id,
        trip_id=trip_id,
        rider_id=rider_id,
        amount=amount,
        currency_code=currency_code,
        payment_method=payment_method,
        payment_status="initiated",
        created_at_utc=datetime.now(timezone.utc),
    )

    db.add(payment)
    db.flush()

    # 🔌 Gateway integration happens async later
    return payment

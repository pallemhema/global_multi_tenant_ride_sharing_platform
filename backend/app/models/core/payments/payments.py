from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import (
    BigInteger,
    Numeric,
    Text,
    ForeignKey,
    TIMESTAMP,
)
from datetime import datetime

from app.core.database import Base


class Payment(Base):
    __tablename__ = "payments"

    payment_id: Mapped[int] = mapped_column(
        BigInteger,
        primary_key=True,
    )

    tenant_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("tenants.tenant_id"),
        nullable=False,
    )

    trip_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("trips.trip_id"),
        nullable=False,
    )

    user_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("users.user_id"),
        nullable=False,
    )

    amount: Mapped[float] = mapped_column(
        Numeric(10, 2),
        nullable=False,
    )

    currency_code: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    payment_method: Mapped[str | None] = mapped_column(
        Text,   # upi | card | wallet | cash
    )

    gateway_reference: Mapped[str | None] = mapped_column(
        Text,
    )

    # initiated | successful | failed | refunded
    payment_status: Mapped[str] = mapped_column(
        Text,
        ForeignKey("lu_payment_status.status_code"),
        nullable=False,
    )

    paid_at_utc: Mapped[datetime | None] = mapped_column(
        TIMESTAMP(timezone=True),
    )

    created_at_utc: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True),
        default=datetime.utcnow,
        nullable=False,
    )

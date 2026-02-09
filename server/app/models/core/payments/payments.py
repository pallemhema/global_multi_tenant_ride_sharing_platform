from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import (
    BigInteger,
    ForeignKey,
    Numeric,
    String,
    TIMESTAMP,
    Text,
)
from datetime import datetime

from app.core.database import Base
from app.models.mixins import AuditMixin, TimestampMixin


class Payment(Base, AuditMixin, TimestampMixin):
    __tablename__ = "payments"

    payment_id: Mapped[int] = mapped_column(
        BigInteger, primary_key=True, autoincrement=True
    )

    trip_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("trips.trip_id"), index=True, nullable=False
    )

    tenant_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("tenants.tenant_id"), nullable=False
    )

    payer_user_id: Mapped[int | None] = mapped_column(
        BigInteger, ForeignKey("users.user_id"), nullable=True
    )

    # Transaction currency (amount paid by rider)
    amount: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    currency_code: Mapped[str | None] = mapped_column(Text, nullable=True)

    payment_status: Mapped[str] = mapped_column(String(30),ForeignKey("lu_payment_status.status_code"), nullable=False, default="initiated", index=True)
    payment_method: Mapped[str | None] = mapped_column(String(30),ForeignKey("lu_payment_methods.method_code"), nullable=True)
    gateway_reference: Mapped[str | None] = mapped_column(Text, nullable=True)
    confirmed_by_user_id: Mapped[int | None] = mapped_column(BigInteger, nullable=True)

    paid_at_utc: Mapped[datetime | None] = mapped_column(TIMESTAMP(timezone=True), nullable=True)

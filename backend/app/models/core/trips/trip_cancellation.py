
from datetime import datetime
from sqlalchemy import BigInteger, DateTime, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base

from ...mixins import AuditMixin, TimestampMixin
class TripCancellation(Base, AuditMixin, TimestampMixin):
    __tablename__ = "trip_cancellations"

    cancellation_id: Mapped[int] = mapped_column(
        BigInteger, primary_key=True
    )

    tenant_id: Mapped[int | None] = mapped_column(
        BigInteger, ForeignKey("tenants.tenant_id")
    )

    trip_id: Mapped[int | None] = mapped_column(
        BigInteger, ForeignKey("trips.trip_id")
    )

    cancelled_by_user_id: Mapped[int | None] = mapped_column(
        BigInteger, ForeignKey("users.user_id")
    )

    cancel_reason_code: Mapped[str | None] = mapped_column(
        Text, ForeignKey("lu_trip_cancel_reason.reason_code")
    )

    cancelled_at_utc = mapped_column()

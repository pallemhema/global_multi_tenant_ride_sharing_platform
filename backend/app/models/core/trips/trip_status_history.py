from datetime import datetime
from sqlalchemy import BigInteger, DateTime, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base


class TripStatusHistory(Base):
    __tablename__ = "trip_status_history"

    status_event_id: Mapped[int] = mapped_column(
        BigInteger, primary_key=True
    )

    tenant_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("tenants.tenant_id"), nullable=False
    )

    trip_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("trips.trip_id"), nullable=False
    )

    from_status: Mapped[str | None] = mapped_column(
        Text, ForeignKey("lu_trip_status.status_code")
    )

    to_status: Mapped[str] = mapped_column(
        Text, ForeignKey("lu_trip_status.status_code"), nullable=False
    )

    changed_at_utc: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow
    )

    changed_by: Mapped[int | None] = mapped_column(
        BigInteger, ForeignKey("users.user_id")
    )

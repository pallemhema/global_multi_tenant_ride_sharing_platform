from sqlalchemy.orm import  Mapped, mapped_column
from sqlalchemy import (
    BigInteger,
    Integer,
    Numeric,
    ForeignKey,
    TIMESTAMP,
    text
)
from typing import Optional
from datetime import datetime

from app.core.database import Base
from ...mixins import AuditMixin,TimestampMixin

class TripDispatchRound(Base,AuditMixin,TimestampMixin):
    __tablename__ = "trip_dispatch_rounds"

    round_id: Mapped[int] = mapped_column(
        BigInteger,
        primary_key=True,
        autoincrement=True
    )

    tenant_id: Mapped[Optional[int]] = mapped_column(
        BigInteger,
        ForeignKey("tenants.tenant_id")
    )

    trip_id: Mapped[Optional[int]] = mapped_column(
        BigInteger,
        ForeignKey("trips.trip_id")
    )

    search_radius_km: Mapped[Optional[float]] = mapped_column(
        Numeric(5, 2)
    )

    max_eta_seconds: Mapped[Optional[int]] = mapped_column(
        Integer
    )

    round_no: Mapped[int] = mapped_column(
        Integer,
        nullable=False
    )

    started_at_utc: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True),
        nullable=False
    )

    ended_at_utc: Mapped[Optional[datetime]] = mapped_column(
        TIMESTAMP(timezone=True)
    )

    
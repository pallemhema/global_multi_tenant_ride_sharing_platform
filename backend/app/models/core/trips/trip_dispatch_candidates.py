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

class TripDispatchCandidate(Base):
    __tablename__ = "trip_dispatch_candidates"

    candidate_id: Mapped[int] = mapped_column(
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

    round_id: Mapped[Optional[int]] = mapped_column(
        BigInteger,
        ForeignKey("trip_dispatch_rounds.round_id")
    )

    driver_id: Mapped[Optional[int]] = mapped_column(
        BigInteger,
        ForeignKey("drivers.driver_id")
    )

    distance_km: Mapped[Optional[float]] = mapped_column(
        Numeric(6, 2)
    )

    eta_seconds: Mapped[Optional[int]] = mapped_column(
        Integer
    )

    response_code: Mapped[Optional[str]] = mapped_column(
        ForeignKey("lu_dispatch_response.response_code")
    )

    request_sent_at_utc: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True),
        nullable=False
    )

    response_at_utc: Mapped[Optional[datetime]] = mapped_column(
        TIMESTAMP(timezone=True)
    )

    created_at_utc: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True),
        server_default=text("now()"),
        nullable=False
    )

    created_by: Mapped[Optional[int]] = mapped_column(
        BigInteger,
        ForeignKey("users.user_id")
    )

    updated_at_utc: Mapped[Optional[datetime]] = mapped_column(
        TIMESTAMP(timezone=True)
    )

    updated_by: Mapped[Optional[int]] = mapped_column(
        BigInteger,
        ForeignKey("users.user_id")
    )

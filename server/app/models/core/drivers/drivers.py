from sqlalchemy import (
    BigInteger, String, Boolean, ForeignKey, Integer, TIMESTAMP,NUMERIC
)
from sqlalchemy.orm import Mapped, mapped_column
from datetime import datetime

from app.core.database import Base
from app.models.mixins import TimestampMixin, AuditMixin


class Driver(Base, TimestampMixin, AuditMixin):
    __tablename__ = "drivers"

    driver_id: Mapped[int] = mapped_column(
        BigInteger,
        primary_key=True,
        autoincrement=True
    )

    tenant_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("tenants.tenant_id", ondelete="RESTRICT"),
        nullable=False,
        index=True
    )

    user_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("users.user_id", ondelete="RESTRICT"),
        nullable=False,
        unique=True
    )

    city_id: Mapped[int | None] = mapped_column(
        BigInteger,
        ForeignKey("cities.city_id"),
        nullable=True
    )

    driver_type: Mapped[str] = mapped_column(
        String,
        ForeignKey("lu_driver_type.driver_type_code"),
        nullable=False
    )

    kyc_status: Mapped[str] = mapped_column(
        String,
        ForeignKey("lu_approval_status.status_code"),
        default="pending"
    )

    rating_avg: Mapped[float] = mapped_column(
        default=5.0
    )

    rating_count: Mapped[int] = mapped_column(
        Integer,
        default=0
    )

    total_trips: Mapped[int] = mapped_column(
        Integer,
        default=0
    )

    onboarding_status: Mapped[str] = mapped_column(
        String,
        default="draft"
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=False
    )

    approved_at_utc: Mapped[datetime | None] = mapped_column(
        TIMESTAMP(timezone=True),
        nullable=True
    )

    average_rating: Mapped[int | None] = mapped_column(
        NUMERIC(3,2),
           nullable=True
    )
    total_ratings: Mapped[int | None] = mapped_column(
        Integer, nullable=True
    )
   

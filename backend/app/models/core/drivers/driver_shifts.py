# app/models/core/drivers/driver_shifts.py

from datetime import datetime
from sqlalchemy import BigInteger, Text, Integer, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.core.database import Base
from ...mixins import AuditMixin, TimestampMixin


class DriverShift(Base, AuditMixin, TimestampMixin):
    __tablename__ = "driver_shifts"

    shift_id: Mapped[int] = mapped_column(
        BigInteger, primary_key=True, index=True
    )

    tenant_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("tenants.tenant_id"),
        nullable=False,
        index=True,
    )

    driver_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("drivers.driver_id"),
        nullable=False,
        index=True,
    )

    city_id: Mapped[int | None] = mapped_column(
        BigInteger,
        ForeignKey("cities.city_id"),
    )

    shift_status: Mapped[str | None] = mapped_column(
        Text,
        ForeignKey("lu_driver_shift_status.status_code"),
    )

    shift_start_utc: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
    )

    shift_end_utc: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
    )

    total_online_minutes: Mapped[int | None] = mapped_column(
        Integer,
    )

    
    shift_start_lat: Mapped[float | None]
    shift_start_lng: Mapped[float | None]
    shift_end_lat: Mapped[float | None]
    shift_end_lng: Mapped[float | None]
from datetime import datetime
from sqlalchemy import BigInteger, DateTime, ForeignKey, Numeric, Text,Integer
from sqlalchemy.orm import Mapped, mapped_column
from typing import Optional
from app.core.database import Base
from ...mixins import AuditMixin,TimestampMixin

class Trip(Base,AuditMixin,TimestampMixin):
    __tablename__ = "trips"

    trip_id: Mapped[int] = mapped_column(
        BigInteger, primary_key=True
    )

    tenant_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("tenants.tenant_id"), nullable=False
    )

    rider_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("riders.rider_id"), nullable=False
    )

    driver_id: Mapped[int | None] = mapped_column(
        BigInteger, ForeignKey("drivers.driver_id")
    )

    vehicle_id: Mapped[int | None] = mapped_column(
        BigInteger, ForeignKey("vehicles.vehicle_id")
    )

    city_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("cities.city_id"), nullable=False
    )

    trip_status: Mapped[str] = mapped_column(
        Text, ForeignKey("lu_trip_status.status_code"), nullable=False
    )

    pickup_latitude: Mapped[float] = mapped_column(Numeric(9, 6))
    pickup_longitude: Mapped[float] = mapped_column(Numeric(9, 6))
    drop_latitude: Mapped[float] = mapped_column(Numeric(9, 6))
    drop_longitude: Mapped[float] = mapped_column(Numeric(9, 6))

    requested_at_utc: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    assigned_at_utc: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    picked_up_at_utc: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    completed_at_utc: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    cancelled_at_utc: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    distance_km: Mapped[Optional[float]] = mapped_column(
        Numeric(8, 2)
    )

    duration_minutes: Mapped[Optional[int]] = mapped_column(
        Integer
    )
from datetime import datetime
from sqlalchemy import BigInteger, DateTime, ForeignKey, Numeric, Text, Integer, String
from sqlalchemy.orm import Mapped, mapped_column
from typing import Optional
from app.core.database import Base
from ...mixins import AuditMixin,TimestampMixin

class Trip(Base,AuditMixin,TimestampMixin):
    __tablename__ = "trips"

    trip_id: Mapped[int] = mapped_column(
        BigInteger, primary_key=True
    )

    # Link back to TripRequest (the search/dispatch that led to this trip)
    trip_request_id: Mapped[int | None] = mapped_column(
        BigInteger, ForeignKey("trip_requests.trip_request_id"), index=True
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

    pickup_address: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True,
    )

    drop_address: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True,
    )

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

    # Final fare/payment fields (populated after driver accepts / trip completes)
    fare_currency: Mapped[str | None] = mapped_column(
        String(3),
        nullable=True,
    )

    fare_total: Mapped[Optional[float]] = mapped_column(
        Numeric(10, 2),
    )

    payment_status: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True,
    )

    payment_id: Mapped[Optional[int]] = mapped_column(
        BigInteger,
    )

    # Optional OTP for trip start verification
    otp_code: Mapped[str | None] = mapped_column(
        String(16),
        nullable=True,
    )

    # Vehicle category selected for this trip (e.g., Bike/Auto/Sedan/SUV)
    selected_vehicle_category: Mapped[str | None] = mapped_column(
        String(30),
        nullable=True,
    )
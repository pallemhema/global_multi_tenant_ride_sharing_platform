"""
TripRequest Model - Initial step when rider requests a trip.

This is separate from Trip. A TripRequest is created when rider submits
pickup/drop locations and city is resolved. Tenant and driver selection
happen AFTER this point.
"""

from datetime import datetime
from sqlalchemy import BigInteger, DateTime, ForeignKey, Numeric, Text, String
from sqlalchemy.orm import Mapped, mapped_column
from typing import Optional
from app.core.database import Base
from ...mixins import AuditMixin, TimestampMixin


class TripRequest(Base, AuditMixin, TimestampMixin):
    """
    Initial trip request from rider.
    
    Status flow: searching → tenant_selected → driver_assigned → (creates Trip) → completed/cancelled
    """
    __tablename__ = "trip_requests"

    trip_request_id: Mapped[int] = mapped_column(
        BigInteger, primary_key=True, autoincrement=True
    )

    rider_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("riders.rider_id"), nullable=False, index=True
    )

    # Pickup location
    pickup_lat: Mapped[float] = mapped_column(Numeric(9, 6), nullable=False)
    pickup_lng: Mapped[float] = mapped_column(Numeric(9, 6), nullable=False)
    pickup_address: Mapped[str] = mapped_column(String(500), nullable=False)

    # Drop location
    drop_lat: Mapped[float] = mapped_column(Numeric(9, 6), nullable=False)
    drop_lng: Mapped[float] = mapped_column(Numeric(9, 6), nullable=False)
    drop_address: Mapped[str] = mapped_column(String(500), nullable=False)

    # City resolved from pickup location
    city_id: Mapped[Optional[int]] = mapped_column(
        BigInteger, ForeignKey("cities.city_id"), index=True
    )

    # Tenant selected by rider (after viewing available tenants)
    selected_tenant_id: Mapped[Optional[int]] = mapped_column(
        BigInteger, ForeignKey("tenants.tenant_id"), index=True
    )

    # Request status
    status: Mapped[str] = mapped_column(
        String(50),
        default="searching",
        nullable=False,
        index=True
    )
    # Status values: searching, tenant_selected, driver_searching, driver_assigned, no_drivers_available, cancelled

    # Optional: distance & duration estimates
    estimated_distance_km: Mapped[Optional[float]] = mapped_column(Numeric(8, 2))
    estimated_duration_minutes: Mapped[Optional[int]] = mapped_column(BigInteger)

    cancelled_at_utc: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True)
    )

"""
TripBatch Model - Groups drivers for batch-wise notification.

Instead of notifying all nearby drivers at once, we group them
into batches (e.g., 3-5 drivers) and notify them in waves.
Each batch has a timeout window (e.g., 10-15 seconds).
"""

from datetime import datetime
from sqlalchemy import BigInteger, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column
from typing import Optional
from app.core.database import Base
from ...mixins import AuditMixin, TimestampMixin


class TripBatch(Base, AuditMixin, TimestampMixin):
    """
    Batch group for driver candidate selection.
    
    One TripRequest can have multiple TripBatch records (if first batch fails).
    Each batch contains TripCandidate records for each driver in the batch.
    """
    __tablename__ = "trip_batches"

    trip_batch_id: Mapped[int] = mapped_column(
        BigInteger, primary_key=True, autoincrement=True
    )

    trip_request_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("trip_requests.trip_request_id"), 
        nullable=False, index=True
    )

    tenant_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("tenants.tenant_id"), 
        nullable=False, index=True
    )

    # Batch number (1st batch, 2nd batch, etc.)
    batch_number: Mapped[int] = mapped_column(Integer, nullable=False)

    # Status of the batch
    batch_status: Mapped[str] = mapped_column(
        String(50),
        default="pending",
        nullable=False
    )
    # Status values: pending, active, completed, no_acceptance

    # Batch window config
    search_radius_km: Mapped[Optional[float]] = mapped_column(String(50))
    max_drivers_in_batch: Mapped[Optional[int]] = mapped_column(Integer)
    timeout_seconds: Mapped[Optional[int]] = mapped_column(Integer)

    # Timestamps
    created_at_utc: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, nullable=False
    )
    started_at_utc: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True)
    )
    ended_at_utc: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True)
    )

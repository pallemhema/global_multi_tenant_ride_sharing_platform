from datetime import datetime
from sqlalchemy import BigInteger, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base


class TripDriverAssignment(Base):
    __tablename__ = "trip_driver_assignment"

    assignment_id: Mapped[int] = mapped_column(
        BigInteger, primary_key=True
    )

    tenant_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("tenants.tenant_id"), nullable=False
    )

    trip_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("trips.trip_id"), nullable=False
    )

    driver_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("drivers.driver_id"), nullable=False
    )

    vehicle_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("vehicles.vehicle_id"), nullable=False
    )

    assigned_at_utc: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow
    )

    created_by: Mapped[int | None] = mapped_column(
        BigInteger, ForeignKey("users.user_id")
    )

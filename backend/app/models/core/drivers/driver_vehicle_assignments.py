# app/models/core/drivers/driver_vehicle_assignments.py

from datetime import datetime
from sqlalchemy import BigInteger, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.core.database import Base


from ...mixins import AuditMixin, TimestampMixin


class DriverVehicleAssignment(Base,AuditMixin,TimestampMixin):
    __tablename__ = "driver_vehicle_assignments"

    assignment_id: Mapped[int] = mapped_column(
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

    vehicle_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("vehicles.vehicle_id"),
        nullable=False,
        index=True,
    )

    start_time_utc: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
    )

    end_time_utc: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
    )

   

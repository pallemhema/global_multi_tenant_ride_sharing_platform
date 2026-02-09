from datetime import datetime
from sqlalchemy import (
    BigInteger,
    Boolean,
    DateTime,
    ForeignKey,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.mixins import TimestampMixin, AuditMixin

class FleetOwnerDriver(Base,TimestampMixin,AuditMixin):
    __tablename__ = "fleet_owner_drivers"

    __table_args__ = (
        UniqueConstraint(
            "tenant_id",
            "driver_id",
            name="uq_fleet_driver_per_tenant",
        ),
    )

    # ======================
    # PRIMARY KEY
    # ======================
    fleet_driver_id: Mapped[int] = mapped_column(
        BigInteger,
        primary_key=True,
    )

    # ======================
    # CORE FIELDS
    # ======================
    tenant_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("tenants.tenant_id", ondelete="CASCADE"),
        nullable=False,
    )

    fleet_owner_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("fleet_owners.fleet_owner_id", ondelete="CASCADE"),
        nullable=False,
    )

    driver_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("drivers.driver_id", ondelete="CASCADE"),
        nullable=False,
    )

    # ======================
    # STATUS / LIFECYCLE
    # ======================
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
    )

    joined_at_utc: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=datetime.utcnow,
    )

    left_at_utc: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    # ======================
    # AUDIT
    # ======================
    created_by: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("users.user_id"),
        nullable=False,
    )

  

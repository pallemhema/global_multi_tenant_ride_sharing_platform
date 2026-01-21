# app/models/core/drivers/driver_invites.py

from datetime import datetime
from sqlalchemy import BigInteger, Text, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.core.database import Base
from ...mixins import AuditMixin, TimestampMixin


class DriverInvite(Base,AuditMixin,TimestampMixin):
    __tablename__ = "driver_invites"

    invite_id: Mapped[int] = mapped_column(
        BigInteger, primary_key=True, index=True
    )

    tenant_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("tenants.tenant_id"),
        nullable=False,
        index=True,
    )

    fleet_owner_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("fleet_owners.fleet_owner_id"),
        nullable=False,
        index=True,
    )

    driver_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("drivers.driver_id"),
        nullable=False,
        index=True,
    )

    invite_status: Mapped[str] = mapped_column(
        Text,
        ForeignKey("lu_driver_invite_status.status_code"),
        nullable=False,
    )

    invited_at_utc: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )



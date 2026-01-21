from sqlalchemy import (
    BigInteger, String, Boolean, ForeignKey, TIMESTAMP
)
from sqlalchemy.orm import Mapped, mapped_column
from datetime import datetime, timezone

from app.core.database import Base
from app.models.mixins import TimestampMixin, AuditMixin


class FleetOwner(Base, TimestampMixin, AuditMixin):
    __tablename__ = "fleet_owners"

    fleet_owner_id: Mapped[int] = mapped_column(
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

    business_name: Mapped[str] = mapped_column(
        String,
        nullable=False
    )

    contact_email: Mapped[str | None] = mapped_column(
        String,
        nullable=True
    )

    approval_status: Mapped[str] = mapped_column(
        String,
        ForeignKey("lu_approval_status.status_code"),
        default="pending",
        nullable=False
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=False
    )

    approved_at_utc: Mapped[datetime | None] = mapped_column(
        TIMESTAMP(timezone=True),
        nullable=True
    )

# app/models/core/drivers/driver_documents.py

from datetime import date, datetime

from sqlalchemy import (
    BigInteger,
    ForeignKey,
    Text,
    Date,
    TIMESTAMP,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.mixins import AuditMixin, TimestampMixin


class DriverDocument(Base, AuditMixin, TimestampMixin):
    __tablename__ = "driver_documents"

    document_id: Mapped[int] = mapped_column(
        BigInteger,
        primary_key=True,
    )

    tenant_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("tenants.tenant_id"),
        nullable=False,
    )

    driver_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("drivers.driver_id"),
        nullable=False,
    )

    document_type: Mapped[str] = mapped_column(
        Text,
        ForeignKey("lu_driver_document_type.document_code"),
        nullable=False,
    )

    document_number: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    document_url: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    expiry_date: Mapped[date | None] = mapped_column(
        Date,
        nullable=True,
    )
   

    verification_status: Mapped[str] = mapped_column(
        Text,
        ForeignKey("lu_approval_status.status_code"),
        default="pending",
        nullable=False,
    )

    verified_by: Mapped[int | None] = mapped_column(
        BigInteger,
        ForeignKey("users.user_id"),
        nullable=True,
    )

    verified_at_utc: Mapped[datetime | None] = mapped_column(
        TIMESTAMP(timezone=True),
        nullable=True,
    )

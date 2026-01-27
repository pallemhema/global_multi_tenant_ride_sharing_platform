from sqlalchemy import (
    BigInteger, String, TIMESTAMP, ForeignKey,Date
)
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.mixins import TimestampMixin, AuditMixin
from datetime import date, datetime



class TenantDocument(Base, TimestampMixin, AuditMixin):
    __tablename__ = "tenant_documents"

    tenant_document_id: Mapped[int] = mapped_column(
        BigInteger,
        primary_key=True,
        autoincrement=True
    )

    tenant_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("tenants.tenant_id"),
        nullable=False
    )

    document_type: Mapped[str] = mapped_column(
        String,
        ForeignKey("lu_document_type.document_code"),
        nullable=False
    )

    document_number = mapped_column(String)
    document_url: Mapped[str] = mapped_column(String, nullable=False)
    expiry_date: Mapped[date | None] = mapped_column(Date)  # ✅ ADD THIS


    verification_status: Mapped[str] = mapped_column(
        String,
        ForeignKey("lu_approval_status.status_code"),
        default="pending"
    )

    verified_by = mapped_column(BigInteger)
    verified_at_utc = mapped_column(TIMESTAMP(timezone=True))
    
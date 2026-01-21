from sqlalchemy import BigInteger, String, TIMESTAMP, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base
from app.models.mixins import TimestampMixin, AuditMixin


class Tenant(Base, TimestampMixin, AuditMixin):
    __tablename__ = "tenants"

    tenant_id: Mapped[int] = mapped_column(
        BigInteger, primary_key=True, autoincrement=True
    )

    tenant_name: Mapped[str] = mapped_column(String, nullable=False)
    legal_name: Mapped[str] = mapped_column(String, nullable=False)
    business_email: Mapped[str] = mapped_column(String, nullable=False)

    approval_status: Mapped[str | None] = mapped_column(
        String,
        ForeignKey("lu_approval_status.status_code"),
        default="pending",
        nullable=True
    )

    status: Mapped[str | None] = mapped_column(
        String,
        ForeignKey("lu_account_status.status_code"),
        default="inactive",
        nullable=True
    )

    onboarded_at_utc: Mapped[TIMESTAMP | None] = mapped_column(
        TIMESTAMP(timezone=True),
        nullable=True
    )

    approved_at_utc: Mapped[TIMESTAMP | None] = mapped_column(
        TIMESTAMP(timezone=True),
        nullable=True
    )

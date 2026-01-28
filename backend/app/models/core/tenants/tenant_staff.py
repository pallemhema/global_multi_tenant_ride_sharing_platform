from sqlalchemy import (
    BigInteger,
    String,
    ForeignKey,
    Text,
    TIMESTAMP,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base
from app.models.mixins import TimestampMixin, AuditMixin


class TenantStaff(Base, TimestampMixin, AuditMixin):
    __tablename__ = "tenant_staff"

    # 🔑 Composite Primary Key (NO autoincrement)
    tenant_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("tenants.tenant_id", ondelete="CASCADE"),
        primary_key=True,
    )

    user_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("users.user_id", ondelete="CASCADE"),
        primary_key=True,
        index=True,
    )

    role_code: Mapped[str] = mapped_column(
        Text,
        ForeignKey("lu_tenant_roles.role_code", ondelete="RESTRICT"),
        primary_key=True,
    )

    status: Mapped[str] = mapped_column(
        String,
        ForeignKey("lu_account_status.status_code"),
        nullable=False,
        server_default="active",
    )

    # ✅ Let Postgres handle the default
    joined_at_utc: Mapped[object] = mapped_column(
        TIMESTAMP(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

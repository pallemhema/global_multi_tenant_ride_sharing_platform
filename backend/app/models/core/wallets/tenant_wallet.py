from sqlalchemy import BigInteger, Numeric, ForeignKey, CHAR, UniqueConstraint, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from datetime import datetime
from app.core.database import Base
from ...mixins import TimestampMixin

class TenantWallet(Base):
    __tablename__ = "tenant_wallet"

    tenant_wallet_id: Mapped[int] = mapped_column(
        BigInteger, primary_key=True
    )

    tenant_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("tenants.tenant_id"), nullable=False
    )

    currency_code: Mapped[str] = mapped_column(
        CHAR(3), nullable=False
    )

    balance: Mapped[float] = mapped_column(
        Numeric(12, 2), nullable=False, default=0.00
    )

    last_updated_utc: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    __table_args__ = (
        UniqueConstraint(
            "tenant_id",
            "currency_code",
            name="uq_tenant_wallet"
        ),
    )

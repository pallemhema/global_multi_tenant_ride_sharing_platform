from sqlalchemy import BigInteger, Numeric, ForeignKey, CHAR, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base
from ...mixins import TimestampMixin
from sqlalchemy import Text, DateTime

class TenantWallet(Base, TimestampMixin):
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

    last_updated_utc = mapped_column()

    __table_args__ = (
        UniqueConstraint(
            "tenant_id",
            "currency_code",
            name="uq_tenant_wallet"
        ),
    )

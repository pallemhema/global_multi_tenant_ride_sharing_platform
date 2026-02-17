from sqlalchemy import BigInteger, Numeric, ForeignKey, CHAR, UniqueConstraint, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from decimal import Decimal
from datetime import datetime
from app.core.database import Base

class TenantWallet(Base):
    __tablename__ = "tenant_wallet"

    tenant_wallet_id: Mapped[int] = mapped_column(
        BigInteger, primary_key=True
    )

    tenant_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("tenants.tenant_id"), nullable=False
    )

    currency_code: Mapped[str] = mapped_column(
    CHAR(3),
    ForeignKey("lu_currencies.currency_code"),
    nullable=False
)



    balance: Mapped[Decimal] = mapped_column(
        Numeric(18, 2),
        nullable=False,
        default=Decimal("0.00"),
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

from sqlalchemy import BigInteger, Numeric, ForeignKey, CHAR, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base
from ...mixins import TimestampMixin
from sqlalchemy import Text, DateTime
from datetime import datetime
class TenantWalletTransaction(Base):
    __tablename__ = "tenant_wallet_transactions"

    transaction_id: Mapped[int] = mapped_column(
        BigInteger, primary_key=True
    )

    tenant_wallet_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("tenant_wallet.tenant_wallet_id")
    )

    trip_id: Mapped[int | None] = mapped_column(
        BigInteger, ForeignKey("trips.trip_id")
    )

    transaction_type: Mapped[str] = mapped_column(
        Text,
        ForeignKey("lu_transaction_type.transaction_type_code")
    )

    amount: Mapped[float] = mapped_column(
        Numeric(10, 2), nullable=False
    )

    created_at_utc: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow
    )

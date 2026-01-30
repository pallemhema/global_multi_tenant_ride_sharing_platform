from sqlalchemy import Text, DateTime
from datetime import datetime

from sqlalchemy import BigInteger, Numeric, ForeignKey, CHAR, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base
from ...mixins import TimestampMixin
class OwnerWalletTransaction(Base):
    __tablename__ = "owner_wallet_transactions"

    transaction_id: Mapped[int] = mapped_column(
        BigInteger, primary_key=True
    )

    fleet_owner_wallet_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("owner_wallet.fleet_owner_wallet_id"),
        nullable=False
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

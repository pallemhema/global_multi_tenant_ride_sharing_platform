from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import (
    BigInteger,
    Numeric,
    Text,
    ForeignKey,
    TIMESTAMP,
)
from datetime import datetime

from app.core.database import Base


class FinancialLedger(Base):
    __tablename__ = "financial_ledger"

    ledger_id: Mapped[int] = mapped_column(
        BigInteger,
        primary_key=True,
    )

    tenant_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("tenants.tenant_id"),
        nullable=False,
    )

    trip_id: Mapped[int | None] = mapped_column(
        BigInteger,
        ForeignKey("trips.trip_id"),
    )

    # platform | tenant | driver | fleet_owner
    entity_type: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    # driver_id / fleet_owner_id / tenant_id / NULL(for platform)
    entity_id: Mapped[int | None] = mapped_column(
        BigInteger,
    )

    # trip_fare | platform_fee | tenant_share | driver_earning | tax | refund
    transaction_type: Mapped[str] = mapped_column(
        Text,
        ForeignKey("lu_transaction_type.transaction_type_code"),
        nullable=False,
    )

    # +ve = credit, -ve = debit
    amount: Mapped[float] = mapped_column(
        Numeric(10, 2),
        nullable=False,
    )

    currency_code: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    created_at_utc: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True),
        default=datetime.utcnow,
        nullable=False,
    )

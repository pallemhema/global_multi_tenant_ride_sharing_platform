from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import (
    BigInteger,
    Numeric,
    ForeignKey,
    Text,
    CHAR,
    TIMESTAMP,
    CheckConstraint,
)
from datetime import datetime

from app.core.database import Base
from app.models.mixins import TimestampMixin, AuditMixin


class FinancialLedger(Base, TimestampMixin, AuditMixin):
    """
    Immutable accounting ledger.

    One payment → multiple ledger rows.
    Ledger defines ownership of money.
    Wallets and payouts are derived from this table.
    """

    __tablename__ = "financial_ledger"

    ledger_id: Mapped[int] = mapped_column(
        BigInteger, primary_key=True, autoincrement=True
    )

    payment_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("payments.payment_id"),
        nullable=False,
        index=True,
    )

    trip_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("trips.trip_id"),
        nullable=False,
        index=True,
    )

    tenant_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("tenants.tenant_id"),
        nullable=False,
        index=True,
    )

    country_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("countries.country_id"),
        nullable=False,
        index=True,
    )

    # Who owns this money
    entity_type: Mapped[str] = mapped_column(
        Text,
        ForeignKey("lu_entity_type.entity_type_code"),
        nullable=False,
    )
    # platform → NULL
    # tenant   → tenant_id
    # owner    → driver_id OR fleet_owner_id
    # tax      → NULL

    entity_id: Mapped[int | None] = mapped_column(
        BigInteger,
        nullable=True,
    )

    transaction_type: Mapped[str] = mapped_column(
        Text,
        ForeignKey("lu_transaction_type.transaction_type_code"),
        nullable=False,
    )
    # platform_fee, tenant_share, owner_earning, tax, refund

    amount: Mapped[float] = mapped_column(
        Numeric(12, 2),
        nullable=False,
    )

    currency_code: Mapped[str] = mapped_column(
        CHAR(3),
        nullable=False,
    )

   
    __table_args__ = (
        # 🔒 Amount must always be positive
        CheckConstraint(
            "amount > 0",
            name="chk_ledger_amount_positive",
        ),

        # 🔒 entity_id presence based on entity_type
        CheckConstraint(
            """
            (entity_type IN ('platform', 'tax') AND entity_id IS NULL)
            OR
            (entity_type IN ('tenant', 'owner') AND entity_id IS NOT NULL)
            """,
            name="chk_ledger_entity_id_by_type",
        ),
    )

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
        nullable=True,
        index=True,
    )

    trip_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("trips.trip_id"),
        nullable=True,
        index=True,
    )
    payout_id: Mapped[int | None] = mapped_column(
        BigInteger,
        ForeignKey("payouts.payout_id"),
        nullable=True,
        comment="Set only for payout (DEBIT) ledger entries",
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
      # DEBIT or CREDIT
    entry_type: Mapped[str] = mapped_column(
        CHAR(6),
        nullable=False,
        comment="CREDIT = earned, DEBIT = paid out",
    )
     # When money was actually paid out
    debited_at_utc: Mapped[datetime | None] = mapped_column(
        TIMESTAMP(timezone=True),
        nullable=True,
    )

    # When money was earned / credited
    credited_at_utc: Mapped[datetime | None] = mapped_column(
        TIMESTAMP(timezone=True),
        nullable=True,
    )

    # Ledger write time (immutable)

    __table_args__ = (
        # Amount must always be positive
        CheckConstraint(
            "amount > 0",
            name="chk_ledger_amount_positive",
        ),

        # Entity ownership rule
        CheckConstraint(
            """
            (entity_type IN ('platform', 'tax') AND entity_id IS NULL)
            OR
            (entity_type IN ('tenant', 'owner') AND entity_id IS NOT NULL)
            """,
            name="chk_ledger_entity_id_by_type",
        ),

        # Entry type must be valid
        CheckConstraint(
            "entry_type IN ('DEBIT', 'CREDIT')",
            name="chk_ledger_entry_type",
        ),

        # Exactly one timestamp must be set
        CheckConstraint(
            """
            (entry_type = 'CREDIT' AND credited_at_utc IS NOT NULL AND debited_at_utc IS NULL)
            OR
            (entry_type = 'DEBIT'  AND debited_at_utc  IS NOT NULL AND credited_at_utc IS NULL)
            """,
            name="chk_ledger_entry_timestamps",
        ),
    )

   
    
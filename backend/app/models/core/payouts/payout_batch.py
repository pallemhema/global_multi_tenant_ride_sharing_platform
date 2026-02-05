"""
Payout models for settlement and batch processing.
"""

from sqlalchemy import BigInteger, Numeric, ForeignKey, String, DateTime, Boolean, Text
from sqlalchemy.orm import Mapped, mapped_column
from datetime import datetime
from app.core.database import Base
from ...mixins import TimestampMixin


class PayoutBatch(Base, TimestampMixin):
    """
    Payout batch - one per tenant per settlement period.
    Aggregates all pending payouts for a tenant.
    """
    __tablename__ = "payout_batches"

    payout_batch_id: Mapped[int] = mapped_column(
        BigInteger, primary_key=True, autoincrement=True
    )

    tenant_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("tenants.tenant_id"), nullable=False, index=True
    )

    # Settlement period (week, month, etc.)
    period_start_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    period_end_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    currency_code: Mapped[str] = mapped_column(String(3), nullable=False)

    total_amount: Mapped[float] = mapped_column(Numeric(15, 2), nullable=False, default=0.0)
    
    # Status: pending, processing, completed, failed
    batch_status: Mapped[str] = mapped_column(String(30), nullable=False, default="pending", index=True)
    
    # Number of payout items in this batch
    items_count: Mapped[int] = mapped_column(BigInteger, nullable=False, default=0)
    items_completed: Mapped[int] = mapped_column(BigInteger, nullable=False, default=0)

    processed_at_utc: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class PayoutItem(Base, TimestampMixin):
    """
    Individual payout item for an owner or tenant.
    
    Only owners and tenants receive payouts (platform has no wallet).
    """
    __tablename__ = "payout_items"

    payout_item_id: Mapped[int] = mapped_column(
        BigInteger, primary_key=True, autoincrement=True
    )

    payout_batch_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("payout_batches.payout_batch_id"), nullable=False, index=True
    )

    tenant_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("tenants.tenant_id"), nullable=False
    )

    # Entity being paid out (owner or tenant)
    entity_type: Mapped[str] = mapped_column(String(30), nullable=False)  # 'owner' or 'tenant'
    entity_id: Mapped[int] = mapped_column(BigInteger, nullable=False)

    # For owners: 'driver' or 'fleet_owner'
    owner_type: Mapped[str | None] = mapped_column(String(30), nullable=True)

    currency_code: Mapped[str] = mapped_column(String(3), nullable=False)

    # Payout amount (from wallet balance)
    payout_amount: Mapped[float] = mapped_column(Numeric(15, 2), nullable=False)

    # Bank details (encrypted in production)
    bank_account_number: Mapped[str | None] = mapped_column(Text, nullable=True)
    bank_ifsc: Mapped[str | None] = mapped_column(String(50), nullable=True)

    # Status: pending, processing, completed, failed
    item_status: Mapped[str] = mapped_column(String(30), nullable=False, default="pending", index=True)

    # Gateway reference (for payment gateways)
    gateway_reference: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Settlement proof
    paid_at_utc: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    
    # Error message if failed
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)

from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import (
    BigInteger,
    ForeignKey,
    Text,
    CHAR,
    Numeric,
    TIMESTAMP,
    CheckConstraint,
)
from datetime import datetime

from app.core.database import Base
from app.models.mixins import TimestampMixin, AuditMixin


class Payout(Base, TimestampMixin, AuditMixin):
    """
    One payout to one entity (owner or tenant).
    """

    __tablename__ = "payouts"

    payout_id: Mapped[int] = mapped_column(
        BigInteger, primary_key=True, autoincrement=True
    )

    payout_batch_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("payout_batches.payout_batch_id"),
        nullable=False,
        index=True,
    )

    # Who is being paid
    entity_type: Mapped[str] = mapped_column(
        Text,
        ForeignKey("lu_entity_type.entity_type_code"),
        nullable=False,
    )
    # owner → driver_id / fleet_owner_id
    # tenant → tenant_id
    entity_id: Mapped[int] = mapped_column(
        BigInteger,
        nullable=False,
    )

    owner_type: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )  # driver | fleet_owner | NULL for tenant

    currency_code: Mapped[str] = mapped_column(
        CHAR(3),
        nullable=False,
    )

    gross_amount: Mapped[float] = mapped_column(
        Numeric(12, 2),
        nullable=False,
    )

    fee_amount: Mapped[float] = mapped_column(
        Numeric(12, 2),
        nullable=False,
        default=0,
    )

    net_amount: Mapped[float] = mapped_column(
        Numeric(12, 2),
        nullable=False,
    )

    paid_amount: Mapped[float] = mapped_column(
        Numeric(12, 2),
        nullable=False,
    )

    status: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        default="pending",
    )

    payout_method: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )  # manual | bank | upi | api
    idempotency_key: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )  # For API payouts to ensure idempotency

    paid_at_utc: Mapped[datetime | None] = mapped_column(
        TIMESTAMP(timezone=True),
        nullable=True,
    )

    __table_args__ = (
        # Only valid payable entities
        CheckConstraint(
            "entity_type IN ('owner', 'tenant')",
            name="chk_payout_entity_type",
        ),

        CheckConstraint(
            "owner_type IN ('driver', 'fleet_owner') OR owner_type IS NULL",
            name="chk_payout_owner_type",
        ),

        CheckConstraint(
            "status IN ('pending', 'paid', 'failed')",
            name="chk_payout_status",
        ),

        CheckConstraint(
            "gross_amount > 0",
            name="chk_payout_gross_positive",
        ),

        CheckConstraint(
            "paid_amount >= 0 AND net_amount >= 0 AND fee_amount >= 0",
            name="chk_payout_amounts_non_negative",
        ),
    )

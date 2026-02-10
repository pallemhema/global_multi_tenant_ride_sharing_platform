from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import (
    BigInteger,

    CHAR,
    Text,
    TIMESTAMP,
    CheckConstraint,
    ForeignKeyConstraint
)


from datetime import datetime

from app.core.database import Base
from app.models.mixins import TimestampMixin, AuditMixin


class PayoutBatch(Base, TimestampMixin, AuditMixin):
    """
    One weekly payout batch per tenant + country + currency.
    Currency is derived from countries.default_currency_code
    and snapshotted here.
    """

    __tablename__ = "payout_batches"

    payout_batch_id: Mapped[int] = mapped_column(
        BigInteger, primary_key=True, autoincrement=True
    )

    tenant_id: Mapped[int] = mapped_column(
        BigInteger,
        nullable=False,
    )

    country_id: Mapped[int] = mapped_column(
        BigInteger,
        nullable=False,
    )

    currency_code: Mapped[str] = mapped_column(
        CHAR(3),
        nullable=False,
    )

    period_start_utc: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True),
        nullable=False,
    )

    period_end_utc: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True),
        nullable=False,
    )

    status: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        default="initiated",
    )

    processed_at_utc: Mapped[datetime | None] = mapped_column(
        TIMESTAMP(timezone=True),
        nullable=True,
    )
    execution_idempotency_key: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,  
    )  # For API payouts to ensure idempotency

    __table_args__ = (
        # Batch lifecycle
        CheckConstraint(
            "status IN ('initiated', 'processing', 'completed', 'failed')",
            name="chk_payout_batch_status",
        ),

         ForeignKeyConstraint(
            ["tenant_id", "country_id"],
            ["tenant_countries.tenant_id", "tenant_countries.country_id"],
            name="fk_payout_batch_tenant_country",
        ),
    )

from datetime import datetime
from sqlalchemy import (
    BigInteger,
    Numeric,
    CHAR,
    TIMESTAMP,
    ForeignKey,
    CheckConstraint,
    Index,
)
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base
from ...mixins import TimestampMixin, AuditMixin


class ExchangeRate(Base, TimestampMixin, AuditMixin):
    __tablename__ = "exchange_rates"

    exchange_rate_id: Mapped[int] = mapped_column(
        BigInteger,
        primary_key=True,
        autoincrement=True,
    )

    from_currency: Mapped[str] = mapped_column(
        CHAR(3),
        ForeignKey("lu_currencies.currency_code"),
        nullable=False,
    )

    to_currency: Mapped[str] = mapped_column(
        CHAR(3),
        ForeignKey("lu_currencies.currency_code"),
        nullable=False,
    )

    rate: Mapped[float] = mapped_column(
        Numeric(18, 8),
        nullable=False,
        comment="1 unit of from_currency equals rate units of to_currency",
    )

    effective_from: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True),
        nullable=False,
    )

    effective_to: Mapped[datetime | None] = mapped_column(
        TIMESTAMP(timezone=True),
        nullable=True,
    )


    __table_args__ = (

        # Prevent same currency conversion
        CheckConstraint(
            "from_currency <> to_currency",
            name="chk_fx_different_currency",
        ),

        # Effective window must be valid
        CheckConstraint(
            "effective_to IS NULL OR effective_to > effective_from",
            name="chk_fx_valid_window",
        ),

        # Fast lookup index
        Index(
            "idx_fx_lookup",
            "from_currency",
            "to_currency",
            "effective_from",
        ),
    )

from decimal import Decimal, ROUND_HALF_UP
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, desc
from fastapi import HTTPException

from app.models.core.accounting.exchange_rate import ExchangeRate


BASE_CURRENCY = "USD"


class FXService:

    @staticmethod
    def _get_active_rate(
        db: Session,
        from_currency: str,
        to_currency: str,
        at_time: datetime | None = None,
    ) -> Decimal:

        if at_time is None:
            at_time = datetime.now(timezone.utc)

        rate_row = (
            db.query(ExchangeRate)
            .filter(
                ExchangeRate.from_currency == from_currency,
                ExchangeRate.to_currency == to_currency,
                ExchangeRate.effective_from <= at_time,
                or_(
                    ExchangeRate.effective_to.is_(None),
                    ExchangeRate.effective_to > at_time,
                ),
            )
            .order_by(desc(ExchangeRate.effective_from))
            .first()
        )

        if not rate_row:
            raise HTTPException(
                status_code=404,
                detail=f"No exchange rate found for {from_currency} → {to_currency}",
            )

        return Decimal(str(rate_row.rate))

    # --------------------------------------------------------

    @staticmethod
    def convert(
        db: Session,
        amount: Decimal,
        from_currency: str,
        to_currency: str,
        at_time: datetime | None = None,
    ) -> tuple[Decimal, Decimal]:
        """
        Returns:
            converted_amount,
            rate_used
        """

        if from_currency == to_currency:
            return amount, Decimal("1")

        amount = Decimal(amount)

        # -----------------------------------------
        # Case 1: Direct USD → X
        # -----------------------------------------
        if from_currency == BASE_CURRENCY:
            rate = FXService._get_active_rate(
                db, BASE_CURRENCY, to_currency, at_time
            )
            converted = (amount * rate).quantize(
                Decimal("0.01"),
                rounding=ROUND_HALF_UP,
            )
            return converted, rate

        # -----------------------------------------
        # Case 2: Reverse X → USD
        # -----------------------------------------
        if to_currency == BASE_CURRENCY:
            rate = FXService._get_active_rate(
                db, BASE_CURRENCY, from_currency, at_time
            )
            reverse_rate = (Decimal("1") / rate)
            converted = (amount * reverse_rate).quantize(
                Decimal("0.01"),
                rounding=ROUND_HALF_UP,
            )
            return converted, reverse_rate

        # -----------------------------------------
        # Case 3: Cross conversion (X → USD → Y)
        # -----------------------------------------

        # Step 1: X → USD
        rate_to_usd = FXService._get_active_rate(
            db, BASE_CURRENCY, from_currency, at_time
        )
        reverse_rate_to_usd = Decimal("1") / rate_to_usd
        amount_in_usd = amount * reverse_rate_to_usd

        # Step 2: USD → Y
        rate_usd_to_target = FXService._get_active_rate(
            db, BASE_CURRENCY, to_currency, at_time
        )

        final_amount = (amount_in_usd * rate_usd_to_target).quantize(
            Decimal("0.01"),
            rounding=ROUND_HALF_UP,
        )

        # Effective combined rate
        effective_rate = reverse_rate_to_usd * rate_usd_to_target

        return final_amount, effective_rate

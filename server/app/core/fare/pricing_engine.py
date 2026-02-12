from decimal import Decimal, ROUND_HALF_UP
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.models.core.pricing.tenant_fare_config import TenantFareConfig


class PricingEngine:

    @staticmethod
    def calculate_fare(
        db: Session,
        tenant_id: int,
        city_id: int,
        vehicle_category: str,
        distance_km: float,
        duration_minutes: int,
    ) -> dict:

        now = datetime.now(timezone.utc)

        fare_rule = (
            db.query(TenantFareConfig)
            .filter(
                TenantFareConfig.tenant_id == tenant_id,
                TenantFareConfig.city_id == city_id,
                TenantFareConfig.vehicle_category == vehicle_category,
                TenantFareConfig.effective_from <= now,
                or_(
                    TenantFareConfig.effective_to.is_(None),
                    TenantFareConfig.effective_to > now,
                ),
            )
            .order_by(TenantFareConfig.effective_from.desc())
            .first()
        )

        if not fare_rule:
            raise ValueError("Pricing configuration missing")

        # ----------------------------
        # Convert to Decimal safely
        # ----------------------------
        base_fare = Decimal(fare_rule.base_fare)
        rate_per_km = Decimal(fare_rule.rate_per_km)
        rate_per_minute = Decimal(fare_rule.rate_per_minute)

        distance = Decimal(str(distance_km))
        duration = Decimal(str(duration_minutes))

        # ----------------------------
        # Base calculation
        # ----------------------------
        distance_charge = rate_per_km * distance
        time_charge = rate_per_minute * duration
        subtotal = base_fare + distance_charge + time_charge

        # ----------------------------
        # Surge
        # ----------------------------
        surge_multiplier = (
            Decimal(fare_rule.surge_multiplier)
            if fare_rule.surge_multiplier is not None
            else Decimal("1.00")
        )

        surged_subtotal = subtotal * surge_multiplier

        # ----------------------------
        # Tax
        # ----------------------------
        tax_percent = (
            Decimal(fare_rule.tax_percentage)
            if fare_rule.tax_percentage is not None
            else Decimal("0.00")
        )

        tax_amount = (surged_subtotal * tax_percent) / Decimal("100")

        total_fare = surged_subtotal + tax_amount

        # ----------------------------
        # Proper rounding (bank-safe)
        # ----------------------------
        total_fare = total_fare.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        tax_amount = tax_amount.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

        return {
            "base_fare": float(base_fare),
            "distance_charge": float(distance_charge),
            "time_charge": float(time_charge),
            "subtotal": float(subtotal),
            "surge_multiplier": float(surge_multiplier),
            "tax_percentage": float(tax_percent),
            "tax_amount": float(tax_amount),
            "total_fare": float(total_fare),
            "currency": "INR",
        }

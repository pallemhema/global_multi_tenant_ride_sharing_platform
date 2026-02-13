from decimal import Decimal, ROUND_HALF_UP
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.models.core.pricing.tenant_fare_config import TenantFareConfig
from .surge_engine import SurgeService


class PricingEngine:

    @staticmethod
    def calculate_fare(
        db: Session,
        tenant_id: int,
        city_id: int,
        vehicle_category: str,
        distance_km: float,
        duration_minutes: int,
         pickup_lat: float,
        pickup_lng: float,
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
        surge_multiplier = SurgeService.get_active_zone_surge(
            db=db,
            tenant_id=tenant_id,
            city_id=city_id,
            vehicle_category=vehicle_category,
            pickup_lat=pickup_lat,
            pickup_lng=pickup_lng,
        )

        surge_applied = False

        if surge_multiplier is not None:
            subtotal = subtotal * Decimal(str(surge_multiplier))
            surge_applied = True


        # ----------------------------
        # Tax
        # ----------------------------
        tax_percent = (
            Decimal(fare_rule.tax_percentage)
            if fare_rule.tax_percentage is not None
            else Decimal("0.00")
        )

        tax_amount = (subtotal * tax_percent) / Decimal("100")

        total_fare = subtotal + tax_amount

        # ----------------------------
        # Proper rounding (bank-safe)
        # ----------------------------
        total_fare = total_fare.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        tax_amount = tax_amount.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

        return {
        "vehicle_category": vehicle_category,
        "base_fare": float(base_fare),
        "price_per_km": float(rate_per_km),
        "estimated_price": float(total_fare),
       "surge_multiplier": surge_multiplier,
       "surge_applied": surge_applied,
    }


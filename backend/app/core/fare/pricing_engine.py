from decimal import Decimal
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.models.core.pricing.tenant_base_fare import TenantBaseFare
from app.models.core.pricing.tenant_distance_rate import TenantDistanceRate
from app.models.core.pricing.tenant_time_rate import TenantTimeRate
from app.models.core.pricing.tenant_tax_rules import TenantTaxRule
from app.models.core.pricing.surge_pricing_events import SurgePricingEvent
from app.models.core.coupons.tenant_coupons import TenantCoupon
from app.models.core.coupons.tenant_coupon_availbility import TenantCouponApplicability


class PricingEngine:

    @staticmethod
    def calculate_final_fare(
        db: Session,
        tenant_id: int,
        city_id: int,
        vehicle_category: str,
        distance_km: float,
        duration_minutes: int,
    ) -> dict:

        now = datetime.now(timezone.utc)

        # ------------------------------------------------
        # 1️⃣ Base pricing
        # ------------------------------------------------
        base = db.query(TenantBaseFare).filter(
            TenantBaseFare.tenant_id == tenant_id,
            TenantBaseFare.city_id == city_id,
            TenantBaseFare.vehicle_category == vehicle_category,
            TenantBaseFare.effective_from <= now,
            or_(TenantBaseFare.effective_to.is_(None), TenantBaseFare.effective_to > now)
        ).first()

        dist = db.query(TenantDistanceRate).filter(
            TenantDistanceRate.tenant_id == tenant_id,
            TenantDistanceRate.city_id == city_id,
            TenantDistanceRate.vehicle_category == vehicle_category,
            TenantDistanceRate.effective_from <= now,
            or_(TenantDistanceRate.effective_to.is_(None), TenantDistanceRate.effective_to > now)
        ).first()

        time = db.query(TenantTimeRate).filter(
            TenantTimeRate.tenant_id == tenant_id,
            TenantTimeRate.city_id == city_id,
            TenantTimeRate.vehicle_category == vehicle_category,
            TenantTimeRate.effective_from <= now,
            or_(TenantTimeRate.effective_to.is_(None), TenantTimeRate.effective_to > now)
        ).first()

        if not (base and dist and time):
            raise ValueError("Pricing configuration missing")

        base_fare = Decimal(base.base_fare)
        distance_charge = Decimal(dist.rate_per_km) * Decimal(distance_km)
        time_charge = Decimal(time.rate_per_minute) * Decimal(duration_minutes)

        subtotal = base_fare + distance_charge + time_charge

        # ------------------------------------------------
        # 2️⃣ Surge
        # ------------------------------------------------
        surge = db.query(SurgePricingEvent).filter(
            SurgePricingEvent.tenant_id == tenant_id,
            SurgePricingEvent.city_id == city_id,
            SurgePricingEvent.vehicle_category == vehicle_category,
            SurgePricingEvent.started_at_utc <= now,
            or_(SurgePricingEvent.ended_at_utc.is_(None), SurgePricingEvent.ended_at_utc > now)
        ).first()

        surge_multiplier = Decimal(surge.surge_multiplier) if surge else Decimal("1.0")
        surged_subtotal = subtotal * surge_multiplier

        # ------------------------------------------------
        # 3️⃣ Tax
        # ------------------------------------------------
        tax = db.query(TenantTaxRule).filter(
            TenantTaxRule.tenant_id == tenant_id,
            TenantTaxRule.city_id == city_id,
            TenantTaxRule.effective_from <= now,
            or_(TenantTaxRule.effective_to.is_(None), TenantTaxRule.effective_to > now)
        ).first()

        tax_percent = Decimal(tax.tax_percentage) if tax else Decimal("0")
        tax_amount = (surged_subtotal * tax_percent) / Decimal("100")

        total_before_coupon = surged_subtotal + tax_amount

        # ------------------------------------------------
        # 4️⃣ AUTO-APPLY BEST COUPON
        # ------------------------------------------------
        best_discount = Decimal("0")
        applied_coupon_code = None

        coupons = (
            db.query(TenantCoupon)
            .join(TenantCouponApplicability)
            .filter(
                TenantCoupon.tenant_id == tenant_id,
                TenantCoupon.is_active.is_(True),
                TenantCoupon.valid_from_utc <= now,
                TenantCoupon.valid_to_utc >= now,
                TenantCouponApplicability.city_id == city_id,
                TenantCouponApplicability.vehicle_category == vehicle_category,
            )
            .all()
        )

        for coupon in coupons:
            if coupon.min_trip_fare and total_before_coupon < coupon.min_trip_fare:
                continue

            if coupon.coupon_type == "FLAT":
                discount = Decimal(coupon.discount_value)

            elif coupon.coupon_type == "PERCENTAGE":
                discount = (total_before_coupon * Decimal(coupon.discount_value)) / Decimal("100")

            else:
                continue

            if coupon.max_discount:
                discount = min(discount, Decimal(coupon.max_discount))

            if discount > best_discount:
                best_discount = discount
                applied_coupon_code = coupon.coupon_code

        # ------------------------------------------------
        # 5️⃣ Final fare
        # ------------------------------------------------
        final_fare = max(total_before_coupon - best_discount, Decimal("0"))

        return {
            "base_fare": float(base_fare),
            "distance_charge": float(distance_charge),
            "time_charge": float(time_charge),
            "surge_multiplier": float(surge_multiplier),
            "subtotal": float(subtotal),
            "tax_amount": float(tax_amount),
            "coupon_discount": float(best_discount),
            "applied_coupon": applied_coupon_code,
            "total_fare": float(final_fare),
            "currency": "INR",
        }

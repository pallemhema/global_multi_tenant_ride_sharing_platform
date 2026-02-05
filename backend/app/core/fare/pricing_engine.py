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
    def calculate_base_fare_components(
        db: Session,
        tenant_id: int,
        city_id: int,
        vehicle_category: str,
        distance_km: float,
        duration_minutes: int,
    ) -> dict:
        """
        Calculate fare WITHOUT coupon discount (used for both estimated and actual).
        
        This is the shared logic that ensures estimated and actual fares are derived
        from the same formula:
        
        1. Base fare
        2. Distance charge (per_km × distance)
        3. Time charge (per_minute × duration)
        4. Subtotal (base + distance + time)
        5. Surge multiplier applied to subtotal
        6. Tax applied after surge
        
        Coupons are NOT applied here (they're applied only at trip completion).
        
        Args:
            db: Database session
            tenant_id: Tenant ID
            city_id: City ID
            vehicle_category: Vehicle category code
            distance_km: Distance in kilometers
            duration_minutes: Duration in minutes
            
        Returns:
            dict with fare breakdown (without coupons)
        """
        now = datetime.now(timezone.utc)

        # Fetch pricing rules
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

        # Calculate base components without rounding yet
        base_fare = Decimal(str(base.base_fare))
        distance_charge = Decimal(str(dist.rate_per_km)) * Decimal(str(distance_km))
        time_charge = Decimal(str(time.rate_per_minute)) * Decimal(str(duration_minutes))
        
        subtotal = base_fare + distance_charge + time_charge

        # Apply surge multiplier
        surge = db.query(SurgePricingEvent).filter(
            SurgePricingEvent.tenant_id == tenant_id,
            SurgePricingEvent.city_id == city_id,
            SurgePricingEvent.vehicle_category == vehicle_category,
            SurgePricingEvent.started_at_utc <= now,
            or_(SurgePricingEvent.ended_at_utc.is_(None), SurgePricingEvent.ended_at_utc > now)
        ).first()

        surge_multiplier = Decimal(str(surge.surge_multiplier)) if surge else Decimal("1.0")
        surged_subtotal = subtotal * surge_multiplier

        # Apply tax
        tax = db.query(TenantTaxRule).filter(
            TenantTaxRule.tenant_id == tenant_id,
            TenantTaxRule.city_id == city_id,
            TenantTaxRule.effective_from <= now,
            or_(TenantTaxRule.effective_to.is_(None), TenantTaxRule.effective_to > now)
        ).first()

        tax_percent = Decimal(str(tax.tax_percentage)) if tax else Decimal("0")
        tax_amount = (surged_subtotal * tax_percent) / Decimal("100")

        total_before_coupon = surged_subtotal + tax_amount

        return {
            "base_fare": base_fare,
            "distance_charge": distance_charge,
            "time_charge": time_charge,
            "subtotal": subtotal,
            "surge_multiplier": surge_multiplier,
            "surged_subtotal": surged_subtotal,
            "tax_percent": tax_percent,
            "tax_amount": tax_amount,
            "total_before_coupon": total_before_coupon,
        }

    @staticmethod
    def calculate_final_fare(
        db: Session,
        tenant_id: int,
        city_id: int,
        vehicle_category: str,
        distance_km: float,
        duration_minutes: int,
    ) -> dict:
        """
        Calculate final fare WITH auto-applied best coupon (for actual trip completion).
        
        Uses shared base_fare_components logic to ensure consistency with estimated fares.
        """
        # Get base components (shared logic with estimated fare)
        components = PricingEngine.calculate_base_fare_components(
            db=db,
            tenant_id=tenant_id,
            city_id=city_id,
            vehicle_category=vehicle_category,
            distance_km=distance_km,
            duration_minutes=duration_minutes,
        )

        total_before_coupon = components["total_before_coupon"]

        # ------------------------------------------------
        # AUTO-APPLY BEST COUPON (only at trip completion)
        # ------------------------------------------------
        now = datetime.now(timezone.utc)
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
                discount = Decimal(str(coupon.discount_value))

            elif coupon.coupon_type == "PERCENTAGE":
                discount = (total_before_coupon * Decimal(str(coupon.discount_value))) / Decimal("100")

            else:
                continue

            if coupon.max_discount:
                discount = min(discount, Decimal(str(coupon.max_discount)))

            if discount > best_discount:
                best_discount = discount
                applied_coupon_code = coupon.coupon_code

        # ------------------------------------------------
        # Final fare
        # ------------------------------------------------
        final_fare = max(total_before_coupon - best_discount, Decimal("0"))

        return {
            "base_fare": float(components["base_fare"]),
            "distance_charge": float(components["distance_charge"]),
            "time_charge": float(components["time_charge"]),
            "surge_multiplier": float(components["surge_multiplier"]),
            "subtotal": float(components["subtotal"]),
            "tax_amount": float(components["tax_amount"]),
            "coupon_discount": float(best_discount),
            "applied_coupon": applied_coupon_code,
            "total_fare": float(final_fare),
            "currency": "INR",
        }

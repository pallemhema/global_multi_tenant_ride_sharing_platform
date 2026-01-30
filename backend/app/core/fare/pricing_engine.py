"""
Pricing Engine - Step 3 & 12 of Trip Lifecycle

Calculates fare with 5 components:
1. Base fare
2. Distance rate
3. Time rate
4. Surge multiplier
5. Tax
"""

from decimal import Decimal
from sqlalchemy.orm import Session

from app.models.core.tenants.tenant_vehicle_pricing import TenantVehiclePricing


class PricingEngine:
    """
    Calculate estimated and final fares for trips.
    """

    @staticmethod
    def estimate_fare(
        db: Session,
        tenant_id: int,
        city_id: int,
        vehicle_category: str,
        distance_km: float,
        duration_minutes: int,
    ) -> dict:
        """
        Estimate fare for a given trip (used in step 3).
        
        Returns dict with components.
        """
        pricing = PricingEngine._get_pricing(
            db=db,
            tenant_id=tenant_id,
            city_id=city_id,
            vehicle_category=vehicle_category,
        )
        
        if not pricing:
            return {
                "base_fare": 0.0,
                "distance_charge": 0.0,
                "time_charge": 0.0,
                "subtotal": 0.0,
                "tax_amount": 0.0,
                "total_fare": 0.0,
                "currency": "INR",
            }
        
        return PricingEngine._calculate_fare(
            pricing=pricing,
            distance_km=distance_km,
            duration_minutes=duration_minutes,
            coupon_discount=0.0,
        )

    @staticmethod
    def calculate_final_fare(
        db: Session,
        tenant_id: int,
        city_id: int,
        vehicle_category: str,
        distance_km: float,
        duration_minutes: int,
        coupon_discount: Decimal = Decimal("0"),
    ) -> dict:
        """
        Calculate final fare after trip completion (used in step 12).
        
        Includes all components with actual distance/duration.
        """
        pricing = PricingEngine._get_pricing(
            db=db,
            tenant_id=tenant_id,
            city_id=city_id,
            vehicle_category=vehicle_category,
        )
        
        if not pricing:
            return {
                "base_fare": 0.0,
                "distance_charge": 0.0,
                "time_charge": 0.0,
                "subtotal": 0.0,
                "tax_amount": 0.0,
                "total_fare": 0.0,
                "currency": "INR",
            }
        
        return PricingEngine._calculate_fare(
            pricing=pricing,
            distance_km=distance_km,
            duration_minutes=duration_minutes,
            coupon_discount=float(coupon_discount),
        )

    @staticmethod
    def _get_pricing(
        db: Session,
        tenant_id: int,
        city_id: int,
        vehicle_category: str,
    ) -> TenantVehiclePricing | None:
        """
        Fetch pricing config for vehicle category in city.
        """
        pricing = db.query(TenantVehiclePricing).filter(
            TenantVehiclePricing.tenant_id == tenant_id,
            TenantVehiclePricing.city_id == city_id,
            TenantVehiclePricing.vehicle_category == vehicle_category,
            TenantVehiclePricing.is_active.is_(True),
        ).first()
        
        return pricing

    @staticmethod
    def _calculate_fare(
        pricing: TenantVehiclePricing,
        distance_km: float,
        duration_minutes: int,
        coupon_discount: float = 0.0,
    ) -> dict:
        """
        Internal calculation with 5 components.
        """
        # Component 1: Base fare
        base_fare = Decimal(str(pricing.base_fare or 0))
        
        # Component 2: Distance charge
        distance_rate = Decimal(str(pricing.price_per_km or 0))
        distance_charge = distance_rate * Decimal(str(distance_km))
        
        # Component 3: Time charge
        time_rate = Decimal(str(pricing.price_per_minute or 0))
        time_charge = time_rate * Decimal(str(duration_minutes))
        
        # Subtotal
        subtotal = base_fare + distance_charge + time_charge
        
        # Apply minimum fare
        min_fare = Decimal(str(pricing.minimum_fare or 0))
        subtotal = max(subtotal, min_fare)
        
        # Component 4: Surge multiplier (default 1.0, can be dynamic)
        surge_multiplier = Decimal(str(pricing.surge_multiplier or "1.0"))
        subtotal = subtotal * surge_multiplier
        
        # Apply coupon discount
        coupon_discount_dec = Decimal(str(coupon_discount))
        subtotal = max(subtotal - coupon_discount_dec, Decimal("0"))
        
        # Component 5: Tax
        tax_rate = Decimal(str(pricing.tax_percentage or "5.0")) / Decimal("100")
        tax_amount = subtotal * tax_rate
        
        total_fare = subtotal + tax_amount
        
        return {
            "base_fare": float(base_fare),
            "distance_charge": float(distance_charge),
            "time_charge": float(time_charge),
            "subtotal": float(subtotal),
            "surge_multiplier": float(surge_multiplier),
            "coupon_discount": float(coupon_discount),
            "tax_amount": float(tax_amount),
            "total_fare": float(total_fare),
            "currency": "INR",
        }

    @staticmethod
    def build_tenant_pricing_view(
        db: Session,
        tenant_id: int,
        city_id: int,
        distance_km: float,
        duration_minutes: int,
    ) -> dict:
        """
        Build pricing view for all vehicle categories (step 3).
        
        Returns dict with category → pricing info.
        """
        pricings = db.query(TenantVehiclePricing).filter(
            TenantVehiclePricing.tenant_id == tenant_id,
            TenantVehiclePricing.city_id == city_id,
            TenantVehiclePricing.is_active.is_(True),
        ).all()
        
        result = {}
        for pricing in pricings:
            fare = PricingEngine._calculate_fare(
                pricing=pricing,
                distance_km=distance_km,
                duration_minutes=duration_minutes,
            )
            
            result[pricing.vehicle_category] = {
                "vehicle_category": pricing.vehicle_category,
                "estimated_price": fare["total_fare"],
                "base_fare": fare["base_fare"],
                "distance_charge": fare["distance_charge"],
                "time_charge": fare["time_charge"],
                "tax_amount": fare["tax_amount"],
                "currency": "INR",
            }
        
        return result

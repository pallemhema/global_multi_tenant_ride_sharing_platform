from sqlalchemy import or_
from datetime import datetime, timezone
from decimal import Decimal
from app.models.core.pricing.tenant_base_fare import TenantBaseFare
from app.models.core.pricing.tenant_distance_rate import TenantDistanceRate
from app.models.core.pricing.tenant_time_rate import TenantTimeRate
from app.models.core.pricing.tenant_tax_rules import TenantTaxRule
from app.models.core.pricing.surge_pricing_events import SurgePricingEvent

def get_vehicle_pricing(db, tenant_id, city_id, vehicle_category, estimated_distance_km,
    estimated_duration_minutes):
    """
    Calculate estimated fare for a vehicle category.
    
    ⚠️ CRITICAL: This must use the SAME formula as PricingEngine.calculate_final_fare()
    to ensure estimated and actual fares match when inputs are identical.
    
    Formula:
    1. base_fare
    2. + (price_per_km × distance_km)  
    3. + (price_per_minute × duration_minutes)
    4. Apply surge multiplier
    5. Apply tax percentage
    
    NOTE: NO coupons are applied to estimated fare (coupons are auto-applied only at completion).
    """
    now = datetime.now(timezone.utc)

    base_fare = db.query(TenantBaseFare).filter(
        TenantBaseFare.tenant_id == tenant_id,
        TenantBaseFare.city_id == city_id,
        TenantBaseFare.vehicle_category == vehicle_category,
        TenantBaseFare.effective_from <= now,
        or_(
            TenantBaseFare.effective_to.is_(None),
            TenantBaseFare.effective_to > now
        )
    ).first()

    distance_rate = db.query(TenantDistanceRate).filter(
        TenantDistanceRate.tenant_id == tenant_id,
        TenantDistanceRate.city_id == city_id,
        TenantDistanceRate.vehicle_category == vehicle_category,
        TenantDistanceRate.effective_from <= now,
        or_(
            TenantDistanceRate.effective_to.is_(None),
            TenantDistanceRate.effective_to > now
        )
    ).first()

    time_rate = db.query(TenantTimeRate).filter(
        TenantTimeRate.tenant_id == tenant_id,
        TenantTimeRate.city_id == city_id,
        TenantTimeRate.vehicle_category == vehicle_category,
        TenantTimeRate.effective_from <= now,
        or_(
            TenantTimeRate.effective_to.is_(None),
            TenantTimeRate.effective_to > now
        )
    ).first()

    tax = db.query(TenantTaxRule).filter(
        TenantTaxRule.tenant_id == tenant_id,
        TenantTaxRule.city_id == city_id,
        TenantTaxRule.effective_from <= now,
        or_(
            TenantTaxRule.effective_to.is_(None),
            TenantTaxRule.effective_to > now
        )
    ).first()

    surge = db.query(SurgePricingEvent).filter(
        SurgePricingEvent.tenant_id == tenant_id,
        SurgePricingEvent.city_id == city_id,
        SurgePricingEvent.vehicle_category == vehicle_category,
        SurgePricingEvent.started_at_utc <= now,
        or_(
            SurgePricingEvent.ended_at_utc.is_(None),
            SurgePricingEvent.ended_at_utc > now
        )
    ).first()

    if not (base_fare and distance_rate and time_rate):
        return None  # Incomplete pricing → vehicle excluded
    
    # Calculate components using Decimal for precision
    base = Decimal(str(base_fare.base_fare))
    distance_charge = Decimal(str(distance_rate.rate_per_km)) * Decimal(str(estimated_distance_km))
    time_charge = Decimal(str(time_rate.rate_per_minute)) * Decimal(str(estimated_duration_minutes))
    
    subtotal = base + distance_charge + time_charge
    
    # Apply surge multiplier (SAME as actual fare calculation)
    surge_multiplier = Decimal(str(surge.surge_multiplier)) if surge else Decimal("1.0")
    surged_subtotal = subtotal * surge_multiplier
    
    # Apply tax (SAME as actual fare calculation)
    tax_percent = Decimal(str(tax.tax_percentage)) if tax else Decimal("0")
    tax_amount = (surged_subtotal * tax_percent) / Decimal("100")
    
    estimated_price = surged_subtotal + tax_amount

    return {
        "vehicle_category": vehicle_category,
        "base_fare": float(base),
        "price_per_km": float(distance_rate.rate_per_km),     
        "price_per_minute": float(time_rate.rate_per_minute),
        "tax_percentage": float(tax_percent),
        "surge_multiplier": float(surge_multiplier),
        "estimated_price": round(float(estimated_price), 2),        
        "currency": "INR",
    }

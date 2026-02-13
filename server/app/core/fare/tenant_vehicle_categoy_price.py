from sqlalchemy import or_
from .pricing_engine import PricingEngine

def get_vehicle_pricing(
    db,
    tenant_id,
    city_id,
    vehicle_category,
    estimated_distance_km,
    estimated_duration_minutes,
    pickup_lat,
    pickup_lng,
):
    try:
        return PricingEngine.calculate_fare(
            db=db,
            tenant_id=tenant_id,
            city_id=city_id,
            vehicle_category=vehicle_category,
            distance_km=estimated_distance_km,
            duration_minutes=estimated_duration_minutes,
            pickup_lat=pickup_lat,
            pickup_lng=pickup_lng,
        )
    except ValueError:
        # Missing pricing config
        return None

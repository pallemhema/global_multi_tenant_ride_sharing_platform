# app/core/fare/dto.py

from dataclasses import dataclass

@dataclass
class FareInput:
    tenant_id: int
    city_id: int
    vehicle_category: str
    distance_km: float
    duration_minutes: int
    trip_time_utc: str
    coupon_code: str | None = None


@dataclass
class FareBreakdown:
    base_fare: float
    distance_fare: float
    time_fare: float
    surge_multiplier: float
    subtotal: float
    tax_amount: float
    discount_amount: float
    final_fare: float

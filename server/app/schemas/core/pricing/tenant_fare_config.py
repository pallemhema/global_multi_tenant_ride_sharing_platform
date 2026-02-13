from pydantic import BaseModel
from decimal import Decimal
from datetime import datetime
from typing import Optional


class FareConfigCreate(BaseModel):
    country_id: int
    city_id: int
    vehicle_category: str

    base_fare: Decimal
    rate_per_km: Decimal
    rate_per_minute: Decimal
    tax_percentage: Optional[Decimal] = 0
    

    effective_from: datetime

class FareConfigUpdate(BaseModel):
    country_id: int
    city_id: int
    vehicle_category: str

    base_fare: Decimal
    rate_per_km: Decimal
    rate_per_minute: Decimal
    tax_percentage: Optional[Decimal] = 0


class FareConfigDelete(BaseModel):
    country_id: int
    city_id: int
    vehicle_category: str


class SurgeUpdate(BaseModel):
    surge_multiplier: Decimal

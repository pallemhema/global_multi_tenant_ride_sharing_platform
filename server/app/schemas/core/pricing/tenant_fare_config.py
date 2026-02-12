from pydantic import BaseModel
from decimal import Decimal
from datetime import datetime
from typing import Optional


class FareConfigCreate(BaseModel):
    tenant_id: int
    city_id: int
    vehicle_category: str

    base_fare: Decimal
    rate_per_km: Decimal
    rate_per_minute: Decimal
    tax_percentage: Optional[Decimal] = 0
    surge_multiplier: Optional[Decimal] = 1

    effective_from: datetime


class FareConfigUpdate(BaseModel):
    base_fare: Optional[Decimal]
    rate_per_km: Optional[Decimal]
    rate_per_minute: Optional[Decimal]
    tax_percentage: Optional[Decimal]
    effective_to: Optional[datetime]


class SurgeUpdate(BaseModel):
    surge_multiplier: Decimal

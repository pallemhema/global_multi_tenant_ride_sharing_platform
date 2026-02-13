from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from decimal import Decimal


# ---------- ZONE ----------

class SurgeZoneCreate(BaseModel):
    city_id: int
    zone_name: str
    coordinates: List[List[float]]  # [[lng, lat], [lng, lat], ...]

class SurgeZoneOut(BaseModel):
    zone_id: int
    zone_name: str
    city_id: int


# ---------- SURGE EVENT ----------

class SurgeCreate(BaseModel):
    country_id: int
    city_id: int
    zone_id: int
    vehicle_category: str
    surge_multiplier: Decimal = Field(..., ge=1)
    started_at_utc: Optional[datetime] = None
    ended_at_utc: Optional[datetime] = None
    reason: Optional[str] = None


class SurgeOut(BaseModel):
    surge_id: int
    zone_id: int
    vehicle_category: str
    surge_multiplier: float
    started_at_utc: datetime
    ended_at_utc: Optional[datetime]

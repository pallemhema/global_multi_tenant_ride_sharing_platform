
from pydantic import BaseModel,ConfigDict
from typing import Optional
from datetime import datetime

class DriverCreate(BaseModel):
    tenant_id: int
    city_id: Optional[int]
    driver_type: str  # individual | fleet_driver




class DriverOut(BaseModel):
    driver_id: int
    tenant_id: int
    user_id: int
    city_id: Optional[int]
    driver_type: str
    kyc_status: str
    rating_avg: float
    rating_count: int
    total_trips: int
    is_active: bool
    approved_at_utc: Optional[datetime]

    model_config = ConfigDict(from_attributes=True)


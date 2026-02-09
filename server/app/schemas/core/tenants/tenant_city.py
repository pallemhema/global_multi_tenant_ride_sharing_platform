from pydantic import BaseModel,ConfigDict
from typing import Optional
from datetime import datetime


class TenantCityCreate(BaseModel):
    city_id: int
    is_active: bool = True
    service_start_utc: Optional[datetime] = None
    service_end_utc: Optional[datetime] = None


class TenantCityOut(TenantCityCreate):
    tenant_id: int

    model_config = ConfigDict(from_attributes=True)

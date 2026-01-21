from pydantic import BaseModel,ConfigDict
from datetime import datetime

class FleetOwnerCityCreate(BaseModel):
    city_id: int
class FleetOwnerCityOut(BaseModel):
    fleet_owner_city_id: int
    tenant_id: int
    fleet_owner_id: int
    city_id: int
    is_active: bool
    created_at_utc: datetime

    model_config = ConfigDict(from_attributes=True)
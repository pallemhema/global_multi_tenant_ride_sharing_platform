from pydantic import BaseModel
from typing import List

class TenantCityInput(BaseModel):
    city_id: int

class TenantRegionCreate(BaseModel):
    country_id: int
    cities: List[TenantCityInput]

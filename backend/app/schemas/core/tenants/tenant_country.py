from pydantic import BaseModel, ConfigDict
from typing import Optional


class TenantCountryCreate(BaseModel):
    country_id: int
    is_active: bool = True


class TenantCountryOut(TenantCountryCreate):
    tenant_id: int
    model_config = ConfigDict(from_attributes=True)

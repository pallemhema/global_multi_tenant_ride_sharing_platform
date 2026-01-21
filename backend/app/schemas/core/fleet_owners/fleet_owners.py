from pydantic import BaseModel, EmailStr,ConfigDict
from typing import Optional
from datetime import datetime


class FleetOwnerCreate(BaseModel):
    tenant_id: int
    business_name: str
    contact_email: Optional[EmailStr]


class FleetOwnerOut(BaseModel):
    fleet_owner_id: int
    tenant_id: int
    user_id: int
    business_name: str
    contact_email: Optional[str]
    approval_status: str
    is_active: bool
    approved_at_utc: Optional[datetime]

    model_config = ConfigDict(from_attributes=True)
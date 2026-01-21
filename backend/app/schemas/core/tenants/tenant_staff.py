from pydantic import BaseModel,ConfigDict
from datetime import datetime
from typing import Optional


class TenantStaffBase(BaseModel):
    tenant_id: int
    user_id: int
    role_code: str   # admin, dispatcher
    status: str = "active"
class TenantStaffCreate(BaseModel):
    user_id: int
    role_code: str = "admin"

class TenantStaffOut(TenantStaffBase):
    joined_at_utc: datetime
    created_at_utc: datetime
    created_by: Optional[int]

    model_config = ConfigDict(from_attributes=True)

from pydantic import BaseModel, EmailStr,ConfigDict
from typing import Optional


class TenantCreate(BaseModel):
    tenant_name: str
    legal_name: str
    business_email: EmailStr


class TenantOut(BaseModel):
    tenant_id: int
    tenant_name: str
    legal_name: str
    business_email: EmailStr
    approval_status: Optional[str]
    status: Optional[str]

    model_config = ConfigDict(from_attributes=True)

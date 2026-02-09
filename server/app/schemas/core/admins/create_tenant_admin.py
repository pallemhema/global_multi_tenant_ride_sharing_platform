# app/schemas/core/tenants/tenant_admin_create.py
from pydantic import BaseModel, EmailStr, Field

class TenantAdminCreate(BaseModel):
    tenant_id: int
    email: EmailStr
    password: str = Field(min_length=8)

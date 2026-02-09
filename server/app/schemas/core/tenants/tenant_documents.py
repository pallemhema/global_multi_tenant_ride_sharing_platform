from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime,date




class TenantDocumentCreate(BaseModel):
    document_type: str
    document_number: Optional[str] = None
    document_url: str


class TenantDocumentOut(TenantDocumentCreate):
    tenant_document_id: int
    verification_status: str
    verified_by: Optional[int]
    verified_at_utc: Optional[datetime]
    expiry_date:Optional[date]

    model_config = ConfigDict(from_attributes=True)

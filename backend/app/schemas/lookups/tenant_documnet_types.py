# app/schemas/lookups/tenant_document_type.py

from pydantic import BaseModel,ConfigDict

class TenantDocumentTypeOut(BaseModel):
    document_code: str
    is_mandatory: bool

    model_config=ConfigDict(from_attributes=True)

    

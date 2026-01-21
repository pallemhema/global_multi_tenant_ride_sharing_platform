from pydantic import BaseModel,ConfigDict
from typing import Optional
from datetime import date, datetime

class FleetOwnerDocumentCreate(BaseModel):
    
    document_type: str
    document_number: str | None = None
    document_url: str
    expiry_date: date | None = None  

class FleetOwnerDocumentOut(BaseModel):
    document_id: int
    document_type: str
    document_number: Optional[str]
    document_url: str
    verification_status: str
    verified_at_utc: Optional[datetime]

    model_config = ConfigDict(from_attributes=True)

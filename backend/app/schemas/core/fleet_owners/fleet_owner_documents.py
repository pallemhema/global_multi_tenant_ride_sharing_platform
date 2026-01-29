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
    fleet_owner_document_id: Optional[int] = None  # Alias for frontend compatibility
    document_type: str
    document_number: Optional[str]
    document_url: str
    file_name: Optional[str] = None  # Derived from document_url
    verification_status: str
    verified_at_utc: Optional[datetime]

    model_config = ConfigDict(from_attributes=True)
    
    def __init__(self, **data):
        super().__init__(**data)
        # Set fleet_owner_document_id as alias for document_id
        if not self.fleet_owner_document_id:
            self.fleet_owner_document_id = self.document_id
        # Extract filename from document_url if not provided
        if not self.file_name and self.document_url:
            self.file_name = self.document_url.split('/')[-1]

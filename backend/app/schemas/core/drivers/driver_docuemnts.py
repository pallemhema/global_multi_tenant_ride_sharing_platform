# app/schemas/core/drivers/driver_documents.py

from datetime import date, datetime
from pydantic import BaseModel,ConfigDict


class DriverDocumentCreate(BaseModel):
    document_type: str
    document_number: str | None = None
    document_url: str
    expiry_date: date | None = None


class DriverDocumentOut(BaseModel):
    document_id: int
    tenant_id: int
    driver_id: int

    document_type: str
    document_number: str | None
    document_url: str
    expiry_date: date | None

    verification_status: str
    verified_by: int | None
    verified_at_utc: datetime | None

    created_at_utc: datetime

    model_config = ConfigDict(from_attributes=True)

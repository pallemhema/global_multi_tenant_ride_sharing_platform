# app/schemas/core/vehicles/vehicle_documents.py

from datetime import date, datetime
from pydantic import BaseModel,ConfigDict


class VehicleDocumentCreate(BaseModel):
    document_type: str           # RC, INSURANCE, PUC
    document_number: str | None
    document_url: str
    expiry_date: date | None


class VehicleDocumentOut(BaseModel):
    document_id: int
    document_type: str
    document_number: str | None
    document_url: str
    expiry_date: date | None
    verification_status: str
    verified_at_utc: datetime | None


    model_config = ConfigDict(from_attributes=True)


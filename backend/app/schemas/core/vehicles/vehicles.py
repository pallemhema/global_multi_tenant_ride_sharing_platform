from pydantic import BaseModel,ConfigDict
from typing import Optional
from datetime import datetime


class VehicleCreate(BaseModel):
    category_code: str
    license_plate: str
    model: Optional[str] = None
    manufacture_year: Optional[int] = None


class VehicleOut(BaseModel):
    vehicle_id: int
    owner_type: str
    category_code: Optional[str]
    license_plate: str
    model: Optional[str]
    manufacture_year: Optional[int]
    status: str
    created_at_utc: datetime
    model_config = ConfigDict(from_attributes=True)

class VehicleUpdate(BaseModel):
    license_plate: Optional[str] = None
    category_code: Optional[str] = None
    model: Optional[str] = None
    manufacture_year: Optional[int] = None
# app/schemas/core/drivers/driver_location.py
from pydantic import BaseModel, Field

class DriverLocationUpdate(BaseModel):
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)

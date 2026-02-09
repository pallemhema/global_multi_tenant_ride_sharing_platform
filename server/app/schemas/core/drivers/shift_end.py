from pydantic import BaseModel, Field
from typing import Optional


class ShiftEndRequest(BaseModel):
    latitude: Optional[float] = Field(None, ge=-90, le=90)
    longitude: Optional[float] = Field(None, ge=-180, le=180)
    
    class Config:
        json_schema_extra = {
            "example": {
                "latitude": 17.442855,
                "longitude": 78.391689
            }
        }


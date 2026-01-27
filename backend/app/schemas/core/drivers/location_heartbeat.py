from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional


class LocationHeartbeatSchema(BaseModel):
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)

    accuracy: Optional[float] = Field(
        None, description="GPS accuracy in meters"
    )

    speed: Optional[float] = Field(
        None, description="Speed in m/s if available"
    )

    heading: Optional[float] = Field(
        None, ge=0, le=360, description="Direction in degrees"
    )

    timestamp_utc: Optional[datetime] = Field(
        None,
        description="Client timestamp; server time used if omitted",
    )

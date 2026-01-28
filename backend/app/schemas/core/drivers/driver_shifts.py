from pydantic import BaseModel
from datetime import datetime

class DriverShiftStart(BaseModel):
    city_id: int

class DriverShiftOut(BaseModel):
    shift_id: int
    tenant_id: int
    driver_id: int
    city_id: int | None
    shift_status: str
    shift_start_utc: datetime
    shift_end_utc: datetime | None
    total_online_minutes: int | None

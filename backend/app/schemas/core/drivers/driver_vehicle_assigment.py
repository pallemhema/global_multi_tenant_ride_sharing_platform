from pydantic import BaseModel
from datetime import datetime
class DriverVehicleAssignmentCreate(BaseModel):
    driver_id: int
    vehicle_id: int

class DriverVehicleAssignmentOut(BaseModel):
    assignment_id: int
    tenant_id: int
    driver_id: int
    vehicle_id: int
    start_time_utc: datetime
    end_time_utc: datetime | None
    is_active: bool




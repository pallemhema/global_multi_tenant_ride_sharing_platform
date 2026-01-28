# app/schemas/core/drivers/driver_invite_create.py

from pydantic import BaseModel,ConfigDict
from datetime import datetime
from typing import Literal
class DriverInviteCreate(BaseModel):
    driver_id: int

class DriverInviteUpdate(BaseModel):
    invite_status: str  # accepted / rejected

class DriverInviteOut(BaseModel):
    invite_id: int
    tenant_id: int
    fleet_owner_id: int
    driver_id: int
    invite_status: str
    invited_at_utc: datetime




class DriverInviteAction(BaseModel):
    action: Literal["accept", "reject", "cancel"]


from pydantic import BaseModel

class DriverListOut(BaseModel):
    driver_id: int
    user_id: int
    driver_type: str | None
    rating_avg: float
    is_active: bool

    model_config = ConfigDict(from_attributes=True)

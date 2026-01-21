from pydantic import BaseModel,ConfigDict
from typing import Optional
from datetime import datetime


class UserCreate(BaseModel):
    phone_e164: str


class UserOut(BaseModel):
    user_id: int
    phone_e164: str
    is_active: bool
    model_config = ConfigDict(from_attributes=True)

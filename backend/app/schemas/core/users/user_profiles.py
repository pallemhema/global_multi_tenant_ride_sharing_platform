from pydantic import BaseModel, ConfigDict,EmailStr
from typing import Optional
from datetime import date


class UserProfileCreate(BaseModel):
    full_name: str
    gender: Optional[str] = None
    date_of_birth: Optional[date] = None
    preferred_language: Optional[str] = None
    email: Optional[EmailStr] = None


class UserProfileOut(BaseModel):
    profile_id: int
    user_id: int
    full_name: str
    gender: Optional[str]
    date_of_birth: Optional[date]
    preferred_language: Optional[str]
    email: Optional[EmailStr]

    model_config = ConfigDict(from_attributes=True)

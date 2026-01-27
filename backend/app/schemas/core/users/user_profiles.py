from pydantic import BaseModel, ConfigDict,EmailStr
from typing import Optional
from datetime import date

from datetime import date
from pydantic import BaseModel
from typing import Optional




class UserProfileCreate(BaseModel):
    full_name: str
    gender: Optional[str] = None
    date_of_birth: Optional[date] = None
    preferred_language: Optional[str] = None


class UserProfileOut(BaseModel):
    profile_id: int
    user_id: int
    full_name: str
    gender: Optional[str]
    date_of_birth: Optional[date]
    preferred_language: Optional[str]

    model_config = ConfigDict(from_attributes=True)

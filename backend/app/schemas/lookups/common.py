
from pydantic import BaseModel, ConfigDict

class LookupBase(BaseModel):
    status_code: str
    description: str

    model_config = ConfigDict(from_attributes=True)

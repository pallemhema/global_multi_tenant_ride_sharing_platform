from pydantic import BaseModel,Field
class TripStartRequest(BaseModel):
    otp:str



class TripCompleteRequest(BaseModel):
    end_latitude: float
    end_longitude: float
    distance_km: float = Field(gt=0)
    duration_minutes: int = Field(gt=0)

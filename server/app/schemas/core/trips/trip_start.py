from pydantic import BaseModel,ConfigDict


class TripStartRequest(BaseModel):
    """Trip start OTP verification"""
    otp: str


class TripStartResponse(BaseModel):
    """Trip start success response"""
    status: str
    trip_id: int
    message: str
    

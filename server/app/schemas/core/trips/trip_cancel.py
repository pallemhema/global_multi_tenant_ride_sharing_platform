from pydantic import BaseModel




class CancellationRequest(BaseModel):
    """Trip cancellation request"""
    reason: str


class CancellationResponse(BaseModel):
    """Cancellation confirmation"""
    status: str
    trip_id: int
   
    message: str
from pydantic import BaseModel


class TripStartOTPVerify(BaseModel):
    otp: str

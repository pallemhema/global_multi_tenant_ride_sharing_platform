# app/schemas/core/auth/otp.py

from pydantic import BaseModel

class OTPVerifyRequest(BaseModel):
    phone_e164: str
    otp: str


class OTPRequest(BaseModel):
    phone_e164: str
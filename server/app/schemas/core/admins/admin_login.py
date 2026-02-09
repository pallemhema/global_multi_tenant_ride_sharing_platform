# app/schemas/core/auth/admin_login.py
from pydantic import BaseModel, EmailStr

class AdminLoginRequest(BaseModel):
    email: EmailStr
    password: str
# app/schemas/core/auth/admin_login.py
class AdminLoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

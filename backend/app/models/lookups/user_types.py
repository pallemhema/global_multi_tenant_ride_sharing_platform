from sqlalchemy import Column, Text
from app.core.database import Base

class UserType(Base):
    __tablename__ = "lu_user_roles"

    role_code = Column(Text, primary_key=True)
    description = Column(Text, nullable=False)

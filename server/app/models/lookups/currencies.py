from sqlalchemy import Column, Text
from app.core.database import Base


class LuCurrencies(Base):
    __tablename__ = "lu_currencies"

    currency_code = Column(Text, primary_key=True) 
    currency_name = Column(Text, nullable=False)

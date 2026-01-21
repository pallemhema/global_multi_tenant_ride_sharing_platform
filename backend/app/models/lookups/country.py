from sqlalchemy import BigInteger, Text, CHAR
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base

class Country(Base):
    __tablename__ = "countries"

    country_id: Mapped[int] = mapped_column(
        BigInteger, primary_key=True, autoincrement=True
    )
    country_code: Mapped[str] = mapped_column(CHAR(2), unique=True, nullable=False)
    country_name: Mapped[str] = mapped_column(Text, nullable=False)
    phone_code: Mapped[str] = mapped_column(Text, nullable=False)
    default_currency: Mapped[str] = mapped_column(CHAR(3), nullable=False)
    timezone: Mapped[str] = mapped_column(Text, nullable=False)

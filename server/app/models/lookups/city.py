from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import BigInteger, Text, Boolean, Numeric, ForeignKey
from app.core.database import Base
from geoalchemy2 import Geography



class City(Base):
    __tablename__ = "cities"

    city_id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    country_id: Mapped[int] = mapped_column(ForeignKey("countries.country_id"))

    city_name: Mapped[str] = mapped_column(Text)
    timezone: Mapped[str] = mapped_column(Text)

    boundary = mapped_column(
    Geography(geometry_type="POLYGON", srid=4326),
    nullable=True,
)


    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

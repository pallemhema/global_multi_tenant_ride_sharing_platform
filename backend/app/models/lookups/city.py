from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import BigInteger, Text, Boolean, Numeric, ForeignKey
from app.core.database import Base

class City(Base):
    __tablename__ = "cities"

    city_id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    country_id: Mapped[int] = mapped_column(ForeignKey("countries.country_id"))

    city_name: Mapped[str] = mapped_column(Text)
    timezone: Mapped[str] = mapped_column(Text)

    # City service boundary (PostGIS polygon, SRID 4326)
    # Stored as a geometry(Polygon,4326) column in the database.
    # We map it as Text so SQLAlchemy can still access the column and
    # we use raw SQL (ST_Contains) for spatial queries.
    boundary: Mapped[str | None] = mapped_column(Text)

    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

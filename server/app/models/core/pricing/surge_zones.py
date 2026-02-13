from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import (
    BigInteger,
    ForeignKey,
    TIMESTAMP,
    Text,
)
from geoalchemy2 import Geography
from datetime import datetime
from app.core.database import Base
from ...mixins import TimestampMixin, AuditMixin


class SurgeZone(Base,TimestampMixin,AuditMixin):
    __tablename__ = "surge_zones"

    zone_id: Mapped[int] = mapped_column(
        BigInteger,
        primary_key=True,
        autoincrement=True,
    )

    tenant_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("tenants.tenant_id"),
        nullable=False,
    )

    city_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("cities.city_id"),
        nullable=False,
    )

    zone_name: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    # PostGIS polygon field
    zone_geometry = mapped_column(
        Geography(geometry_type="POLYGON", srid=4326),
        nullable=False,
    )


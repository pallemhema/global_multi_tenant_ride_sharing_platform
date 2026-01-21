from datetime import datetime
from sqlalchemy import BigInteger, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.core.database import Base

from ...mixins import AuditMixin, TimestampMixin

class FleetOwnerCity(Base,AuditMixin,TimestampMixin):
    __tablename__ = "fleet_owner_cities"

    fleet_owner_city_id: Mapped[int] = mapped_column(
        BigInteger,
        primary_key=True,
        index=True,
    )

    tenant_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("tenants.tenant_id"),
        nullable=False,
        index=True,
    )

    fleet_owner_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("fleet_owners.fleet_owner_id"),
        nullable=False,
        index=True,
    )

    city_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("cities.city_id"),
        nullable=False,
        index=True,
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
    )

    

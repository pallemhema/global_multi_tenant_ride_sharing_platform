

from sqlalchemy import (
    BigInteger, String, Boolean, ForeignKey, Integer, TIMESTAMP
)
from sqlalchemy.orm import Mapped, mapped_column
from datetime import datetime

from app.core.database import Base
from app.models.mixins import TimestampMixin, AuditMixin

from sqlalchemy import (
    Column,
    BigInteger,
    Text,
    ForeignKey,
    TIMESTAMP
)


class DriverCurrentStatus(Base):
    __tablename__ = "driver_current_status"

    tenant_id = Column(
        BigInteger,
        ForeignKey("tenants.tenant_id"),
        primary_key=True,
        nullable=False
    )

    driver_id = Column(
        BigInteger,
        ForeignKey("drivers.driver_id"),
        primary_key=True,
        nullable=False
    )

    city_id = Column(
        BigInteger,
        ForeignKey("cities.city_id"),
        nullable=True
    )

    runtime_status = Column(
        Text,
        ForeignKey("lu_driver_runtime_status.status_code"),
        nullable=False
    )

    last_updated_utc = Column(
        TIMESTAMP(timezone=True),
        nullable=False
    )

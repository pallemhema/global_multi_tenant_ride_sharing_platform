from sqlalchemy import (
    BigInteger, Boolean, TIMESTAMP, ForeignKey
)
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base
from app.models.mixins import TimestampMixin, AuditMixin


class TenantCity(Base, TimestampMixin, AuditMixin):
    __tablename__ = "tenant_cities"

    tenant_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("tenants.tenant_id"),
        primary_key=True
    )

    city_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("cities.city_id"),
        primary_key=True
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True
    )

    service_start_utc = mapped_column(TIMESTAMP(timezone=True))
    service_end_utc = mapped_column(TIMESTAMP(timezone=True))

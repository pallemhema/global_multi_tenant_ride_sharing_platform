from sqlalchemy import (
    BigInteger, Boolean, CHAR, Numeric, ForeignKey
)
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base
from app.models.mixins import TimestampMixin, AuditMixin


class TenantCountry(Base, TimestampMixin, AuditMixin):
    __tablename__ = "tenant_countries"

    tenant_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("tenants.tenant_id"),
        primary_key=True
    )

    country_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("countries.country_id"),
        primary_key=True
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True
    )

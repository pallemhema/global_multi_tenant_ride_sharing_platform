from sqlalchemy import (
    BigInteger, String, Integer, ForeignKey, TIMESTAMP, UniqueConstraint
)
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base
from app.models.mixins import TimestampMixin, AuditMixin


class Vehicle(Base, TimestampMixin, AuditMixin):
    __tablename__ = "vehicles"

    vehicle_id: Mapped[int] = mapped_column(
        BigInteger, primary_key=True, autoincrement=True
    )

    tenant_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("tenants.tenant_id"), nullable=False
    )
    fleet_owner_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("fleet_owners.fleet_owner_id"), nullable=False
    )
    country_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("countries.country_id"), nullable=False
    )

    owner_type: Mapped[str] = mapped_column(
        String, ForeignKey("lu_vehicle_owner_type.owner_type_code"), nullable=False
    )

    fleet_owner_id: Mapped[int | None] = mapped_column(
        BigInteger, ForeignKey("fleet_owners.fleet_owner_id")
    )

    driver_owner_id: Mapped[int | None] = mapped_column(
        BigInteger, ForeignKey("drivers.driver_id")
    )

    category_code: Mapped[str | None] = mapped_column(
        String, ForeignKey("lu_vehicle_category.category_code")
    )

    license_plate: Mapped[str] = mapped_column(String, nullable=False)
    model: Mapped[str | None] = mapped_column(String)
    manufacture_year: Mapped[int | None] = mapped_column(Integer)

    status: Mapped[str] = mapped_column(
        String,
        ForeignKey("lu_vehicle_status.status_code"),
        default="active"
    )

    __table_args__ = (
        UniqueConstraint("country_id", "license_plate", name="uq_vehicle_plate"),
    )

from sqlalchemy import (
    BigInteger, String, Integer, ForeignKey, TIMESTAMP, CheckConstraint
)
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base
from app.models.mixins import TimestampMixin, AuditMixin


class Vehicle(Base, TimestampMixin, AuditMixin):
    __tablename__ = "vehicles"

    __table_args__ = (
        CheckConstraint(
            """
            (
                owner_type = 'driver'
                AND driver_owner_id IS NOT NULL
                AND fleet_owner_id IS NULL
            )
            OR
            (
                owner_type = 'fleet_owner'
                AND fleet_owner_id IS NOT NULL
                AND driver_owner_id IS NULL
            )
            """,
            name="ck_vehicle_valid_owner"
        ),
    )

    vehicle_id: Mapped[int] = mapped_column(
        BigInteger, primary_key=True, autoincrement=True
    )

    tenant_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("tenants.tenant_id", ondelete="RESTRICT"),
        nullable=False,
        index=True
    )

    owner_type: Mapped[str] = mapped_column(
        String,
        ForeignKey("lu_vehicle_owner_type.owner_type_code"),
        nullable=False
    )

    # ---- ownership ----
    fleet_owner_id: Mapped[int | None] = mapped_column(
        BigInteger,
        ForeignKey("fleet_owners.fleet_owner_id", ondelete="RESTRICT"),
        nullable=True
    )

    driver_owner_id: Mapped[int | None] = mapped_column(
        BigInteger,
        ForeignKey("drivers.driver_id", ondelete="RESTRICT"),
        nullable=True
    )

    # ---- vehicle details ----
    category_code: Mapped[str | None] = mapped_column(
        String,
        ForeignKey("lu_vehicle_category.category_code")
    )

    license_plate: Mapped[str] = mapped_column(
        String,
        nullable=False
    )

    model: Mapped[str | None] = mapped_column(String)

    manufacture_year: Mapped[int | None] = mapped_column(Integer)

    status: Mapped[str] = mapped_column(
        String,
        ForeignKey("lu_vehicle_status.status_code"),
        default="active",
        nullable=False
    )

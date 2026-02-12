from sqlalchemy import BigInteger, Numeric, ForeignKey, CHAR, UniqueConstraint, Text
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base
from ...mixins import TimestampMixin
from sqlalchemy import DateTime
from sqlalchemy import Numeric




class OwnerWallet(Base, TimestampMixin):
    """
    Single wallet for all owners (individual drivers + fleet owners).
    Tracks balance in tenant's base/settlement currency.
    
    Positive balance = platform owes owner
    Negative balance = owner owes platform (offline payment debt)
    Zero = settled
    """
    __tablename__ = "owner_wallet"

    owner_wallet_id: Mapped[int] = mapped_column(
        BigInteger, primary_key=True, autoincrement=True
    )

    # owner can be: individual driver (driver_id) or fleet owner (fleet_owner_id)
    # For simplicity, we use owner_id (driver.driver_id for individuals, fleet_owner.fleet_owner_id for fleets)
    

    owner_type: Mapped[str] = mapped_column(
        Text,
                 ForeignKey("lu_vehicle_owner_type.owner_type_code"),
 nullable=False,
    )

    fleet_owner_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("fleet_owners.fleet_owner_id"), nullable=True, index=True
    )
    driver_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("drivers.driver_id"), nullable=True, index=True
    )
    tenant_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("tenants.tenant_id"), nullable=False
    )

    currency_code: Mapped[str] = mapped_column(
        CHAR(3), nullable=False
    )

    balance: Mapped[float] = mapped_column(
        Numeric(12, 2), nullable=False, default=0.00
    )

    last_updated_utc: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    __table_args__ = (
        UniqueConstraint(
            "owner_type",
            "tenant_id",
            "fleet_owner_id",

            "driver_id",
            "currency_code",
            name="uq_owner_wallet"
        ),
    )

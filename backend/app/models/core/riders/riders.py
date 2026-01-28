from sqlalchemy import (
    Column,
    BigInteger,
    Integer,
    Boolean,
    Numeric,
    ForeignKey,
    TIMESTAMP,
    text
)
from app.core.database import Base

class Rider(Base):
    __tablename__ = "riders"

    rider_id = Column(
        BigInteger,
        primary_key=True,
        autoincrement=True
    )

    tenant_id = Column(
        BigInteger,
        ForeignKey("tenants.tenant_id"),
        nullable=True
    )

    user_id = Column(
        BigInteger,
        ForeignKey("users.user_id"),
        nullable=True
    )

    default_city_id = Column(
        BigInteger,
        ForeignKey("cities.city_id"),
        nullable=True
    )

    rating_avg = Column(
        Numeric(3, 2),
        nullable=False,
        server_default=text("5.00")
    )

    rating_count = Column(
        Integer,
        nullable=False,
        server_default=text("0")
    )

    is_active = Column(
        Boolean,
        nullable=False,
        server_default=text("true")
    )

    created_at_utc = Column(
        TIMESTAMP(timezone=True),
        nullable=False,
        server_default=text("now()")
    )

    created_by = Column(
        BigInteger,
        ForeignKey("users.user_id"),
        nullable=True
    )

    updated_at_utc = Column(
        TIMESTAMP(timezone=True),
        nullable=True
    )

    updated_by = Column(
        BigInteger,
        ForeignKey("users.user_id"),
        nullable=True
    )

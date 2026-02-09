from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import ForeignKey, Numeric, TIMESTAMP
from datetime import datetime
from app.core.database import Base


class TripFare(Base):
    __tablename__ = "trip_fares"

    trip_id: Mapped[int] = mapped_column(
        ForeignKey("trips.trip_id"),
        primary_key=True
    )

    base_fare: Mapped[float] = mapped_column(Numeric(10, 2))
    distance_fare: Mapped[float] = mapped_column(Numeric(10, 2))
    time_fare: Mapped[float] = mapped_column(Numeric(10, 2))

    surge_multiplier: Mapped[float] = mapped_column(Numeric(4, 2))

    subtotal: Mapped[float] = mapped_column(Numeric(10, 2))
    tax_amount: Mapped[float] = mapped_column(Numeric(10, 2))
    discount_amount: Mapped[float] = mapped_column(Numeric(10, 2))

    final_fare: Mapped[float] = mapped_column(Numeric(10, 2))

    calculated_at_utc: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True),
        default=datetime.utcnow,
    )

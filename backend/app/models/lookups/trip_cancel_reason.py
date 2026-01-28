from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import Text
from app.core.database import Base
class TripCancelReason(Base):
    __tablename__ = "lu_trip_cancel_reason"

    reason_code: Mapped[str] = mapped_column(Text, primary_key=True)
    description: Mapped[str] = mapped_column(Text, nullable=False)

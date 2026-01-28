from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import Text
from app.core.database import Base
class PayoutStatus(Base):
    __tablename__ = "lu_payout_status"

    status_code: Mapped[str] = mapped_column(Text, primary_key=True)
    description: Mapped[str] = mapped_column(Text, nullable=False)

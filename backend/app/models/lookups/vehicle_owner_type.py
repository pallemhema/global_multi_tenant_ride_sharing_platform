from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import Text
from app.core.database import Base

class VehicleOwnerType(Base):
    __tablename__ = "lu_vehicle_owner_type"

    owner_type_code: Mapped[str] = mapped_column(Text, primary_key=True)
    description: Mapped[str] = mapped_column(Text, nullable=False)

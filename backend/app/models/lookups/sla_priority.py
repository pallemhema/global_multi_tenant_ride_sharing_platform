from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import Text
from app.core.database import Base
from sqlalchemy import Integer

class SlaPriority(Base):
    __tablename__ = "lu_sla_priority"

    priority_code: Mapped[str] = mapped_column(Text, primary_key=True)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    sla_minutes: Mapped[int] = mapped_column(Integer, nullable=False)

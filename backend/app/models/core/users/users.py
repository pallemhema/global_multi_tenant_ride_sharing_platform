
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import BigInteger, String, Boolean, TIMESTAMP, Column, ForeignKey, Text,func
from datetime import datetime
from app.core.database import Base



class User(Base):
    __tablename__ = "users"

    user_id: Mapped[int] = mapped_column(
        BigInteger, primary_key=True, autoincrement=True
    )

    phone_e164: Mapped[str] = mapped_column(
        String, unique=True, nullable=False
    )
    

    phone_verified: Mapped[bool] = mapped_column(Boolean, default=False)

    
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    last_login_utc: Mapped[TIMESTAMP | None] = mapped_column(
        TIMESTAMP(timezone=True)
    )

    created_at_utc: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    updated_at_utc: Mapped[datetime | None] = mapped_column(
        TIMESTAMP(timezone=True),
        onupdate=func.now(),
    )


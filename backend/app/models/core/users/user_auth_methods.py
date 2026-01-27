# app/models/core/auth/user_auth_methods.py
from datetime import datetime
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import BigInteger, String, Boolean, DateTime, ForeignKey
from app.db.base import Base

class UserAuthMethod(Base):
    __tablename__ = "user_auth_methods"

    auth_method_id: Mapped[int] = mapped_column(
        BigInteger, primary_key=True
    )

    user_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("users.user_id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )

    auth_type: Mapped[str] = mapped_column(
        String, nullable=False
    )  # otp | password

    identifier: Mapped[str] = mapped_column(
        String, nullable=False
    )  # phone | email

    password_hash: Mapped[str | None] = mapped_column(String)

    is_active: Mapped[bool] = mapped_column(
        Boolean, default=True
    )

    last_login_utc: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True)
    )

    created_at_utc: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow
    )

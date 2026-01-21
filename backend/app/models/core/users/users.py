
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import BigInteger, String, Boolean, TIMESTAMP, Column, ForeignKey, Text
from app.core.database import Base
from app.models.mixins import TimestampMixin, AuditMixin


class User(Base, TimestampMixin
           ):
    __tablename__ = "users"

    user_id: Mapped[int] = mapped_column(
        BigInteger, primary_key=True, autoincrement=True
    )

    phone_e164: Mapped[str] = mapped_column(
        String, unique=True, nullable=False
    )
    

    phone_verified: Mapped[bool] = mapped_column(Boolean, default=False)

        # Global role
    user_role = Column(
        Text,
        ForeignKey("lu_user_roles.role_code", ondelete="RESTRICT"),
        nullable=False,
        default="customer"
    )

    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    last_login_utc: Mapped[TIMESTAMP | None] = mapped_column(
        TIMESTAMP(timezone=True)
    )

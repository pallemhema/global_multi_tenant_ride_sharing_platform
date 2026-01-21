from sqlalchemy import BigInteger, String, Date, ForeignKey,Boolean
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base
from app.models.mixins import TimestampMixin, AuditMixin


class UserProfile(Base, TimestampMixin, AuditMixin):
    __tablename__ = "user_profiles"

    profile_id: Mapped[int] = mapped_column(
        BigInteger,
        primary_key=True,
        autoincrement=True
    )

    # FK → users.user_id
    user_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("users.user_id"),
        nullable=False,
        index=True
    )

    full_name: Mapped[str] = mapped_column(
        String,
        nullable=False
    )

    # FK → lu_gender.gender_code
    gender: Mapped[str | None] = mapped_column(
        String,
        ForeignKey("lu_gender.gender_code"),
        nullable=True
    )

    date_of_birth: Mapped[Date | None] = mapped_column(
        Date,
        nullable=True
    )

    preferred_language: Mapped[str | None] = mapped_column(
        String,
        nullable=True
    )


    email: Mapped[str | None] = mapped_column(
        String, unique=True
    )
    email_verified: Mapped[bool] = mapped_column(Boolean, default=False)
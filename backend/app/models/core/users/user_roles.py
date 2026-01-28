from sqlalchemy import Column, BigInteger, Text, ForeignKey, UniqueConstraint
from sqlalchemy.sql import func
from sqlalchemy.types import TIMESTAMP

from app.core.database import Base

from sqlalchemy.orm import Mapped, mapped_column

class UserRole(Base):
    __tablename__ = "user_roles"

    user_role_id :Mapped[int] = mapped_column(
        BigInteger,
        primary_key=True, autoincrement=True
    )

    user_id: Mapped[int] = mapped_column(
        BigInteger, 
        ForeignKey("users.user_id", ondelete="CASCADE"),  
    )

    role:Mapped[str] = mapped_column( 
        Text,
        ForeignKey("lu_user_types.role_code"),
        nullable=False,
        index=True,
        default='rider'
    )
    created_at_utc: Mapped[TIMESTAMP | None] = mapped_column(
        TIMESTAMP(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    
    created_by: Mapped[int] = mapped_column(
        BigInteger, 
        ForeignKey("users.user_id"),  
    )

    __table_args__ = (
        UniqueConstraint("user_id", "role", name="uq_user_role"),
    )



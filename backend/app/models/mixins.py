from datetime import datetime
from sqlalchemy import TIMESTAMP, BigInteger, func,ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from typing import Optional

class TimestampMixin:
    created_at_utc: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    updated_at_utc: Mapped[datetime | None] = mapped_column(
        TIMESTAMP(timezone=True),
        onupdate=func.now(),
    )




class AuditMixin:
    created_by: Mapped[Optional[int]] = mapped_column(
        BigInteger,
        nullable=True,
    )
    updated_by: Mapped[Optional[int]] = mapped_column(
        BigInteger,
        nullable=True,
    )

 

# app/models/lookups/driver_document_type.py

from sqlalchemy import Text, Boolean
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base



class DriverDocumentType(Base):
    __tablename__ = "lu_driver_document_type"

    document_code: Mapped[str] = mapped_column(
        Text,
        primary_key=True,
    )

    description: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    is_mandatory: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )

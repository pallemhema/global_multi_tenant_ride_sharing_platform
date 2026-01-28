from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import Text
from app.core.database import Base
class TransactionType(Base):
    __tablename__ = "lu_transaction_type"

    transaction_type_code: Mapped[str] = mapped_column(Text, primary_key=True)
    description: Mapped[str] = mapped_column(Text, nullable=False)

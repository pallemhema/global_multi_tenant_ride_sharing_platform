from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import Text
from app.core.database import Base

class TenantRoles(Base):
    __tablename__ = "lu_tenant_roles"
    role_code: Mapped[str] = mapped_column(Text, primary_key=True)
    role_name: Mapped[str] = mapped_column(Text, nullable=False)

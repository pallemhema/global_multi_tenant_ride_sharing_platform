from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import (
    BigInteger, Numeric, ForeignKey, TIMESTAMP, Boolean, Text
)
from app.core.database import Base
class TenantTaxRule(Base):
    __tablename__ = "tenant_tax_rules"

    tax_rule_id: Mapped[int] = mapped_column(BigInteger, primary_key=True)

    tenant_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("tenants.tenant_id"))
    country_id: Mapped[int | None] = mapped_column(
        BigInteger, ForeignKey("countries.country_id")
    )
    city_id: Mapped[int | None] = mapped_column(
        BigInteger, ForeignKey("cities.city_id")
    )

    tax_type: Mapped[str | None] = mapped_column(Text)
    tax_percentage: Mapped[float] = mapped_column(Numeric(5, 2), nullable=False)

    effective_from: Mapped[str] = mapped_column(TIMESTAMP(timezone=True), nullable=False)
    effective_to: Mapped[str | None] = mapped_column(TIMESTAMP(timezone=True))

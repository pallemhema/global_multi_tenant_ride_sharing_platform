from pydantic import BaseModel
from typing import Optional
class PaymentConfirmationRequest(BaseModel):
    trip_id: int
    payment_method: str  # 'online' or 'offline'




class BreakdownInfo(BaseModel):
    owner_amount: float
    tenant_amount_original: float
    platform_fee: float
    tax_amount: float
    final_fare: float


class PaymentConfirmationResponse(BaseModel):
    payment_id: int
    trip_id: int
    payment_status: str
    payment_method: str
    paid_at_utc: str

    # Payment Info
    payment_currency: str
    payment_amount: float

    # Tenant Settlement Info
    tenant_settlement_currency: str
    tenant_settlement_amount: float

    # Breakdown
    breakdown: BreakdownInfo

    # Wallets
    owner_wallet_balance: float
    owner_wallet_currency: str
    tenant_wallet_balance: float
    tenant_wallet_currency: str

    # Audit
    ledger_entries_count: int

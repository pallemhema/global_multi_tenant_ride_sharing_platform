from pydantic import BaseModel
from typing import Optional
class PaymentConfirmationRequest(BaseModel):
    trip_id: int
    payment_method: str  # 'online' or 'offline'


class BreakdownInfo(BaseModel):
    owner_amount: float
    tenant_amount: float
    platform_fee: float
    tax_amount: float
    subtotal: float
    final_fare: float



class PaymentConfirmationResponse(BaseModel):
    payment_id: int
    trip_id: int
    payment_status: str
    payment_method: str
    paid_at_utc: Optional[str]
    settlement_currency: str
    settlement_amount: float
    breakdown: BreakdownInfo

    owner_wallet_balance: float
    tenant_wallet_balance: float
    ledger_entries_count: int

    message: str
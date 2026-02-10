from pydantic import BaseModel
from datetime import datetime


class PayoutBatchCreateRequest(BaseModel):
    tenant_id: int
    country_id: int
    period_start_utc: datetime
    period_end_utc: datetime


class PayoutBatchResponse(BaseModel):
    payout_batch_id: int
    tenant_id: int
    country_id: int
    currency_code: str
    status: str


class CalculatePayoutsResponse(BaseModel):
    batch_id: int
    payouts_created: int
    total_payable: float

class PayPayoutRequest(BaseModel):
    payout_method: str
    idempotency_key: str

class ExecutePayoutBatchRequest(BaseModel):
    execution_idempotency_key: str
    payout_method: str  # manual | bank | upi | api (future)
"""
Tenant Admin Finance Endpoints - Wallet and Ledger.

Endpoints:
- GET /tenant-admin/wallet: Get tenant's wallet balance
- GET /tenant-admin/ledger: Get tenant's ledger entries (paginated)
- GET /tenant-admin/earnings/summary: Get tenant earnings summary
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, desc
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from typing import Optional

from app.core.dependencies import get_db
from app.core.security.roles import require_tenant_admin
from app.models.core.wallets.tenant_wallet import TenantWallet
from app.models.core.accounting.ledger import FinancialLedger
from app.models.core.tenants.tenants import Tenant

router = APIRouter(
    tags=["Tenant Admin – Finances"],
)


# ================================================================
# WALLET ENDPOINT
# ================================================================


@router.get("/wallet")
def get_tenant_wallet(
    tenant: dict = Depends(require_tenant_admin),
    db: Session = Depends(get_db),
):
    try:
        tenant_id = tenant.get("tenant_id")
        if not tenant_id:
            raise HTTPException(status_code=400, detail="Tenant ID not in token")

        wallet = (
            db.query(TenantWallet)
            .filter(TenantWallet.tenant_id == tenant_id)
            .first()
        )

        if not wallet:
            return {
                "balance": 0.00,
                "currency_code": "USD",
                "is_debt": False,
                "last_updated_utc": None,
            }

        return {
            "balance": float(wallet.balance),
            "currency_code": wallet.currency_code,
            "is_debt": wallet.balance < 0,
           
            
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch wallet: {str(e)}",
        )

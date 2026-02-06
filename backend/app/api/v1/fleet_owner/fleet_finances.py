"""
Fleet Owner Finance Endpoints - Wallet, Ledger, and Earnings.

Endpoints:
- GET /fleet-owner/wallet: Get fleet's wallet balance
- GET /fleet-owner/ledger: Get fleet's ledger entries (paginated)
- GET /fleet-owner/earnings/summary: Get fleet earnings summary
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, desc
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from typing import List, Optional

from app.core.dependencies import get_db
from app.core.security.roles import require_fleet_owner
from app.models.core.wallets.owner_wallet import OwnerWallet
from app.models.core.accounting.ledger import FinancialLedger
from app.models.core.fleet_owners.fleet_owners import FleetOwner

router = APIRouter(
    tags=["Fleet Owner – Finances"],
)


# ================================================================
# WALLET ENDPOINT
# ================================================================

@router.get("/wallet", response_model=None)
def get_fleet_wallet(
    fleet_owner: FleetOwner = Depends(require_fleet_owner),
    db: Session = Depends(get_db),
):
    """
    Get fleet owner's current wallet balance.
    
    Returns balance in tenant's settlement currency.
    Positive balance = platform owes fleet owner
    Negative balance = fleet owner owes platform (offline debt)
    """
    try:
        # Get fleet owner's wallet
        wallet = db.query(OwnerWallet).filter(
            and_(
                OwnerWallet.fleet_owner_id == fleet_owner.fleet_owner_id,
                OwnerWallet.tenant_id == fleet_owner.tenant_id,
            )
        ).first()
        
        if not wallet:
            # Return zero balance if wallet doesn't exist yet
            return {
                "balance": 0.00,
                "currency_code": wallet.currency_code if wallet else "USD",
                "owner_type": "fleet",
                "is_offline_debt": False,
                "last_updated_utc": None,
            }
        
        return {
            "balance": float(wallet.balance),
            "currency_code": wallet.currency_code,
            "owner_type": wallet.owner_type,
            "is_offline_debt": float(wallet.balance) < 0,
            "last_updated_utc": wallet.last_updated_utc.isoformat() if wallet.last_updated_utc else None,
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch wallet: {str(e)}",
        )



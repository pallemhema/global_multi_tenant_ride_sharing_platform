from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.dependencies import get_db

# Lookups
from app.models.lookups.account_status import AccountStatus
from app.models.lookups.approval_status import ApprovalStatus
from app.models.lookups.country import Country
from app.models.lookups.city import City

from app.schemas.lookups.country import CountryOut
from app.schemas.lookups.city import CityOut
from app.schemas.lookups.common import LookupBase

from typing import List

router = APIRouter(
    prefix="/lookups",
    tags=["Lookups"]
)

@router.get("/account-status",response_model=List[LookupBase])
def get_account_status(db: Session = Depends(get_db)):
    return db.query(AccountStatus).all()

@router.get("/approval-status",response_model=List[LookupBase])
def get_approval_status(db: Session = Depends(get_db)):
    return db.query(ApprovalStatus).all()

@router.get("/countries",response_model=List[CountryOut])
def get_countries(db: Session = Depends(get_db)):
    return db.query(Country).all()

@router.get("/cities", response_model=List[CityOut])
def get_cities(country_id: int | None = None, db: Session = Depends(get_db)):
    query = db.query(City)
    if country_id:
        query = query.filter(City.country_id == country_id)
    return query.all()

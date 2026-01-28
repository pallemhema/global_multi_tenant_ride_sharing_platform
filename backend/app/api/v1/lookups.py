from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.dependencies import get_db

# Lookups
# # Lookups
from app.models.lookups.gender import Gender
from app.models.lookups.account_status import AccountStatus
from app.models.lookups.approval_status import ApprovalStatus
from app.models.lookups.tenant_roles import TenantRoles
from app.models.lookups.user_types import UserType
from app.models.lookups.tenant_roles import TenantRoles
from app.models.lookups.tenant_Fleet_document_types import TenantFleetDocumentType
from app.models.lookups.vehicle_document_type import VehicleDocumentType
from app.models.lookups.vehicle_owner_type import VehicleOwnerType
from app.models.lookups.vehicle_category import VehicleCategory
from app.models.lookups.vehicle_status import VehicleStatus
from app.models.lookups.fleet_document_type import FleetDocumentType
from app.models.lookups.driver_type import DriverType
from app.models.lookups.driver_document_type import DriverDocumentType
from app.models.lookups.driver_invite_status import DriverInviteStatus
from app.models.lookups.driver_shif_status import DriverShiftStatus
from app.models.lookups.trip_status import TripStatus
from app.models.lookups.dispatch_response import DispatchResponse
from app.models.lookups.coupon_type import LuCouponType
from app.models.lookups.transaction_type import TransactionType
from app.models.lookups.payment_status import PaymentStatus
from app.models.lookups.country import Country
from app.models.lookups.city import City
from app.models.lookups.tenant_Fleet_document_types import TenantFleetDocumentType
from app.models.lookups.vehicle_category import VehicleCategory
from app.models.lookups.driver_document_type import DriverDocumentType
from app.models.lookups.vehicle_document_type import VehicleDocumentType
from app.models.lookups.driver_runtime_status import DriverRuntimeStatus
from app.schemas.lookups.country import CountryOut
from app.schemas.lookups.city import CityOut
from app.schemas.lookups.common import LookupBase
from app.schemas.lookups.tenant_documnet_types import TenantDocumentTypeOut


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

@router.get(
    "/tenant-document-types",
    response_model=List[TenantDocumentTypeOut],
)
def get_tenant_document_types(db: Session = Depends(get_db)):
    return (
        db.query(TenantFleetDocumentType)
        .all()
    )

@router.get(
    "/vehicle-categories"
)
def get_vehicle_categories(db: Session = Depends(get_db)):
    return (
        db.query(VehicleCategory)
        .all()
    )
@router.get(
    "/driver-document-types"
)
def get_vehicle_categories(db: Session = Depends(get_db)):
    return (
        db.query(DriverDocumentType)
        .all()
    )

@router.get(
    "/vehicle-document-types"
)
def get_vehicle_documents_type(db: Session = Depends(get_db)):
    return (
        db.query(VehicleDocumentType)
        .all()
    )
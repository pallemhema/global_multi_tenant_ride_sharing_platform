# app/models/__init__.py

# # Lookups
from app.models.lookups.gender import Gender
from app.models.lookups.account_status import AccountStatus
from app.models.lookups.approval_status import ApprovalStatus
from app.models.lookups.tenant_roles import TenantRoles
from app.models.lookups.user_roles import UserRole
from app.models.lookups.tenant_roles import TenantRoles
from app.models.lookups.tenant_document_types import TenantDocumentType
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

# Core models
from app.models.core.users.users import User
from app.models.core.users.user_profiles import UserProfile
from app.models.core.tenants.tenants import Tenant
from app.models.core.tenants.tenant_staff import TenantStaff


#Routers
from app.api.v1.lookups import router as lookups_router
from app.api.v1.users.users import router as users_router
from app.api.v1.auth.auth import router as auth_router
from app.api.v1.platform.admin import router as app_admin_router
from app.api.v1.tenants.router import router as tenant_router
from app.api.v1.fleet_owner.router import router as fleet_owner_router
from app.api.v1.drivers.router import router as driver_router
from app.api.v1.trips.router import router as trip_router
from fastapi import APIRouter

api_router = APIRouter()

# api_router.include_router(lookups_router)
api_router.include_router(users_router)
api_router.include_router(auth_router)
api_router.include_router(app_admin_router)
api_router.include_router(tenant_router)
api_router.include_router(fleet_owner_router)
api_router.include_router(driver_router)
api_router.include_router(trip_router)


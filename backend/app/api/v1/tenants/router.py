from app.api.v1.tenants.approve_fleets_and_vehicles import router as approve_vehicles_fleets_router
from app.api.v1.tenants.approv_driver import router as driver_approval_by_tenant_admin
from fastapi import APIRouter
from app.api.v1.tenants.documents import router as tenants_documents_router
from .tenant_cities  import router as tenant_cities_router
from .tenant_countries import router as tenant_countries_router


router = APIRouter()

router.include_router(driver_approval_by_tenant_admin)
router.include_router(approve_vehicles_fleets_router)
router.include_router(tenants_documents_router)
router.include_router(tenant_countries_router)
router.include_router(tenant_cities_router)




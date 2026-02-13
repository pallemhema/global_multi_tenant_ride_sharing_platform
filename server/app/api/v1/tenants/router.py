from app.api.v1.tenants.approve_fleets import router as approve__fleets_router
from app.api.v1.tenants.approve_vehicles import router as approve_vehicles_router
from app.api.v1.tenants.approv_driver import router as driver_approval_by_tenant_admin
from fastapi import APIRouter
from app.api.v1.tenants.documents import router as tenants_documents_router
from .tenant_regions import router as tenant_region_router
from .tenants import router as get_tenant_router
from .tenant_finances import router as tenant_finances_router
from .dashboard import router as tenant_dashboard_router
from ..pricing.tenant_fare_config import router as tenant_fare_config_router;
from ..pricing.surge_pricing import router as tenant_surge_router


router = APIRouter(prefix="/tenant-admin",)

router.include_router(driver_approval_by_tenant_admin)
router.include_router(approve__fleets_router)
router.include_router(approve_vehicles_router)
router.include_router(tenants_documents_router)
router.include_router(tenant_region_router)
router.include_router(tenant_dashboard_router)
router.include_router(tenant_finances_router)
router.include_router(get_tenant_router)
router.include_router(tenant_fare_config_router)
router.include_router(tenant_surge_router)



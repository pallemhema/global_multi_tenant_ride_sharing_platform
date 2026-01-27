from .add_vehicle import router as add_vehicle_router
from .vehcile_docs import router as add_vehicle_docs_router
from fastapi import APIRouter
router = APIRouter()
router.include_router(add_vehicle_router)
router.include_router(add_vehicle_docs_router)
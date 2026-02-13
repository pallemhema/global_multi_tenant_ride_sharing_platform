from pydantic import BaseModel

class SelectTenantSchema(BaseModel):
    """Select tenant during driver onboarding"""
    tenant_id: int

class DriverTypeSchema(BaseModel):
    """Update driver type during onboarding"""
    driver_type: str  # e.g., "individual", "fleet-based"
class SelectLocationSchema(BaseModel):
    country_id: int
    city_id: int
 

class SubmitDocumentsResponse(BaseModel):
    """Response when submitting documents to complete onboarding"""
    ok: bool
    driver_id: int
    onboarding_status: str
    message: str

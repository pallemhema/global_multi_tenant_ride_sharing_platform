from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional


# ============================================
# 1️⃣ TRIP REQUEST CREATION
# ============================================

class TripRequestCreate(BaseModel):
    """
    Rider creates a trip request with pickup/drop locations.
    Backend resolves city and creates TripRequest record.
    """
    pickup_lat: float = Field(..., ge=-90, le=90)
    pickup_lng: float = Field(..., ge=-180, le=180)
    pickup_address: str = Field(..., min_length=5, max_length=500)
    
    drop_lat: float = Field(..., ge=-90, le=90)
    drop_lng: float = Field(..., ge=-180, le=180)
    drop_address: str = Field(..., min_length=5, max_length=500)


class TripRequestOut(BaseModel):
    """Response for created TripRequest"""
    trip_request_id: int
    rider_id: int
    city_id: Optional[int]
    status: str
    pickup_lat: float
    pickup_lng: float
    drop_lat: float
    drop_lng: float
    estimated_distance_km: Optional[float]
    estimated_duration_minutes: Optional[int]
    created_at_utc: datetime

    class Config:
        from_attributes = True


# ============================================
# 2️⃣ AVAILABLE TENANTS & PRICING
# ============================================

class VehiclePricingInfo(BaseModel):
    """Vehicle pricing for a specific tenant"""
    vehicle_category: str
    base_fare: float
    price_per_km: float
    estimated_price: float


class TenantAvailabilityInfo(BaseModel):
    """Tenant availability with vehicles and pricing"""
    tenant_id: int
    tenant_name: str
    acceptance_rate: float  # 0.0 to 1.0
    vehicles: list[VehiclePricingInfo]


class AvailableTenantsListOut(BaseModel):
    """List of available tenants in the city"""
    trip_request_id: int
    city_id: int
    city_name: str
    tenants: list[TenantAvailabilityInfo]


# ============================================
# 3️⃣ TENANT SELECTION
# ============================================

class TenantSelectionPayload(BaseModel):
    """Rider selects a tenant and vehicle category"""
    tenant_id: int
    vehicle_category: str


class TenantSelectionResponse(BaseModel):
    """Confirmation of tenant selection"""
    trip_request_id: int
    status: str  # "tenant_selected"
    selected_tenant_id: int
    vehicle_category: str
    message: str


# ============================================
# 4️⃣ TRIP START & COMPLETE
# ============================================

class TripStartRequest(BaseModel):
    otp: str


class TripCompleteRequest(BaseModel):
    end_latitude: float
    end_longitude: float
    distance_km: float = Field(gt=0)
    duration_minutes: int = Field(gt=0)

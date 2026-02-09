from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.dependencies import get_db
from app.core.security.roles import require_tenant_admin

from app.models.lookups.country import Country
from app.models.lookups.city import City
from app.models.core.tenants.tenant_countries import TenantCountry
from app.models.core.tenants.tenant_cities import TenantCity

from app.schemas.core.tenants.tenant_region import TenantRegionCreate
from datetime import datetime, timezone


router = APIRouter(
    prefix="/{tenant_id}/regions",
    tags=["Tenant Regions"],
)
@router.post("")
def add_region(
    tenant_id: int,
    payload: TenantRegionCreate,
    db: Session = Depends(get_db),
    user: dict = Depends(require_tenant_admin),
):
    # 1️⃣ Validate country
    country = db.get(Country, payload.country_id)
    if not country:
        raise HTTPException(404, "Country not found")

    # 2️⃣ Ensure country not already added
    exists = (
        db.query(TenantCountry)
        .filter(
            TenantCountry.tenant_id == tenant_id,
            TenantCountry.country_id == payload.country_id,
        )
        .first()
    )
    if exists:
        raise HTTPException(400, "Country already added")

    # 3️⃣ Add country
    tenant_country = TenantCountry(
        tenant_id=tenant_id,
        country_id=payload.country_id,
        is_active=True,
        created_by=int(user["sub"]),
    )
    db.add(tenant_country)

    # 4️⃣ Add cities
    for item in payload.cities:
        city = db.get(City, item.city_id)
        if not city or city.country_id != payload.country_id:
            raise HTTPException(
                400,
                f"City {item.city_id} does not belong to country",
            )

        db.add(
            TenantCity(
                tenant_id=tenant_id,
                city_id=item.city_id,
                is_active=True,
                created_by=int(user["sub"]),
            )
        )

    db.commit()

    return {
        "status": "region added",
        "country_id": payload.country_id,
        "cities_added": len(payload.cities),
    }


@router.get("")
def list_regions(
    tenant_id: int,
    db: Session = Depends(get_db),
    user: dict = Depends(require_tenant_admin),
):
    tenant_countries = (
        db.query(TenantCountry)
        .filter(
            TenantCountry.tenant_id == tenant_id,
            TenantCountry.is_active.is_(True),
        )
        .all()
    )

    response = []

    for tc in tenant_countries:
        country = db.get(Country, tc.country_id)

        cities = (
            db.query(TenantCity, City)
            .join(City, City.city_id == TenantCity.city_id)
            .filter(
                TenantCity.tenant_id == tenant_id,
                City.country_id == tc.country_id,
            )
            .all()
        )

        response.append({
            "country_id": country.country_id,
            "name": country.country_name,
            "country_code":country.country_code,
            "cities": [
                {
                    "id": city.city_id,
                    "name": city.city_name,
                    "status": "ACTIVE" if tc.is_active else "INACTIVE",
                }
                for tc, city in cities
            ],
        })

    return response

@router.patch("/{city_id}/disable")
def disable_city(
    tenant_id: int,
    city_id: int,
    db: Session = Depends(get_db),
    user: dict = Depends(require_tenant_admin),
):
    record = (
        db.query(TenantCity)
        .filter(
            TenantCity.tenant_id == tenant_id,
            TenantCity.city_id == city_id,
        )
        .first()
    )

    if not record:
        raise HTTPException(404, "City not found for tenant")

    if not record.is_active:
        return {"message": "City already disabled"}

    record.is_active = False
    record.updated_by = int(user["sub"])
    record.updated_at_utc = datetime.now(timezone.utc)

    db.commit()

    return {
        "status": "disabled",
        "city_id": city_id,
    }

@router.patch("/{city_id}/enable")
def enable_city(
    tenant_id: int,
    city_id: int,
    db: Session = Depends(get_db),
    user: dict = Depends(require_tenant_admin),
):
    record = (
        db.query(TenantCity)
        .filter(
            TenantCity.tenant_id == tenant_id,
            TenantCity.city_id == city_id,
        )
        .first()
    )
    print(record)

    if not record:
        raise HTTPException(404, "City not found for tenant")

    city = db.get(City, record.city_id)
    # 🔒 Ensure country is enabled
    tenant_country = (
        db.query(TenantCountry)
        .filter(
            TenantCountry.tenant_id == tenant_id,
            TenantCountry.country_id == city.country_id,
            TenantCountry.is_active.is_(True),
        )
        .first()
    )

    if not tenant_country:
        raise HTTPException(
            400,
            "Country is disabled for tenant",
        )

    if record.is_active:
        return {"message": "City already enabled"}

    record.is_active = True
    record.updated_by = int(user["sub"])
    record.updated_at_utc = datetime.now(timezone.utc)

    db.commit()

    return {
        "status": "enabled",
        "city_id": city_id,
    }

@router.get("/available-cities")
# def get_available_cities(
#     tenant_id: int,
#     country_id: int,
#     db: Session = Depends(get_db),
#     user: dict = Depends(require_tenant_admin),
# ):
#     # 1️⃣ All cities for this country (lookup)
#     all_cities = (
#         db.query(City)
#         .filter(City.country_id == country_id)
#         .all()
#     )

#     print(all_cities)

#     # 2️⃣ Cities already added for this tenant
#     tenant_city_ids = {
#         c.city_id
#         for c in db.query(TenantCity.city_id)
#         .filter(
#             TenantCity.tenant_id == tenant_id,
#             TenantCity.is_active.is_(True),
#         )
#         .all()
#     }
#     print(tenant_city_ids)

#     # 3️⃣ Exclude existing cities
#     available = [
#         {
#             "city_id": city.city_id,
#             "name": city.city_name,
#         }
#         for city in all_cities
#         if city.city_id not in tenant_city_ids
#     ]

#     return available
@router.get("/available-cities")
def get_available_cities(
    tenant_id: int,
    country_id: int,
    db: Session = Depends(get_db),
    user: dict = Depends(require_tenant_admin),
):
    # 1️⃣ All cities for this country
    all_cities = (
        db.query(City)
        .filter(City.country_id == country_id)
        .all()
    )

    # 2️⃣ Cities already added for THIS tenant AND THIS country
    tenant_city_ids = {
        tc.city_id
        for tc in (
            db.query(TenantCity)
            .join(City, City.city_id == TenantCity.city_id)
            .filter(
                TenantCity.tenant_id == tenant_id,
                TenantCity.is_active.is_(True),
                City.country_id == country_id,
            )
            .all()
        )
    }

    # 3️⃣ Exclude only those cities
    available = [
        {
            "city_id": city.city_id,
            "name": city.city_name,
        }
        for city in all_cities
        if city.city_id not in tenant_city_ids
    ]

    return available

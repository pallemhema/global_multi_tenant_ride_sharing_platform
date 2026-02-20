from fastapi import HTTPException
from app.models.core.tenants.tenants import Tenant
from app.models.core.tenants.tenant_cities import TenantCity
from app.models.core.tenants.tenant_countries import TenantCountry
from app.models.lookups.city import City
from app.models.lookups.country import Country
from sqlalchemy.orm import Session



def enforce_transition(
    current_status: str,
    target_status: str,
    flow: list[str],
):
    if current_status == flow[-1]:
        raise HTTPException(
            status_code=403,
            detail="Onboarding already completed."
        )

    if current_status not in flow:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid current onboarding state: {current_status}"
        )

    current_index = flow.index(current_status)
    target_index = flow.index(target_status)

    if target_index > current_index + 1:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot skip onboarding steps: {current_status} → {target_status}"
        )


def block_if_completed(current_status: str, flow: list[str]):
    if current_status == flow[-1]:
        raise HTTPException(
            status_code=403,
            detail="Onboarding already completed."
        )

def build_location_tree(db: Session, tenant_id: int):
    tenant_countries = (
        db.query(TenantCountry)
        .filter(TenantCountry.tenant_id == tenant_id)
        .all()
    )

    location_tree = []

    for tc in tenant_countries:
        country = db.get(Country, tc.country_id)

        if not country:
            continue

        cities = (
            db.query(City)
            .join(TenantCity, TenantCity.city_id == City.city_id)
            .filter(
                TenantCity.tenant_id == tenant_id,
                City.country_id == country.country_id,
                City.is_active == True
            )
            .all()
        )

        location_tree.append({
            "country_id": country.country_id,
            "country_name": country.country_name,
            "cities": [
                {
                    "city_id": c.city_id,
                    "city_name": c.city_name
                }
                for c in cities
            ]
        })

    return location_tree


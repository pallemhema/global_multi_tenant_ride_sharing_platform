from fastapi import APIRouter
import requests

router = APIRouter()

from fastapi import APIRouter, HTTPException
import requests

router = APIRouter()

@router.get("/location-mapping")
def get_route(from_lat: float, from_lng: float, to_lat: float, to_lng: float):
    url = (
        f"https://routing.openstreetmap.de/routed-car/route/v1/driving/"
        f"{from_lng},{from_lat};{to_lng},{to_lat}"
        "?overview=full&geometries=geojson"
    )

    try:
        response = requests.get(url, timeout=20)
        response.raise_for_status()
        return response.json()

    except requests.exceptions.Timeout:
        return {
            "code": "Timeout",
            "routes": []
        }

    except requests.exceptions.RequestException:
        return {
            "code": "Error",
            "routes": []
        }


import os
import httpx
import asyncio
from typing import List, Dict
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
import json

router = APIRouter(
    prefix="/trips",
    tags=["Trip Routes"],
)

# OSRM Configuration
OSRM_URL = os.getenv("OSRM_URL", "http://router.project-osrm.org")

class RouteRequest(BaseModel):
    from_lat: float
    from_lng: float
    to_lat: float
    to_lng: float

class RouteBatchRequest(BaseModel):
    routes: List[Dict]  # [{ from_lat, from_lng, to_lat, to_lng, label }, ...]

async def fetch_route_from_osrm(from_lat: float, from_lng: float, to_lat: float, to_lng: float):
    """
    Fetch route from OSRM service
    Returns list of [lat, lng] coordinates
    """
    try:
        url = f"{OSRM_URL}/route/v1/driving/{from_lng},{from_lat};{to_lng},{to_lat}"
        params = {
            "overview": "full",  # Get complete route
            "geometries": "geojson",  # Return as GeoJSON
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.get(url, params=params, timeout=10)
            response.raise_for_status()
            
            data = response.json()
            
            if data.get("code") != "Ok":
                raise HTTPException(
                    status_code=400,
                    detail=f"OSRM returned error: {data.get('code')}"
                )
            
            if not data.get("routes"):
                raise HTTPException(
                    status_code=400,
                    detail="No route found between coordinates"
                )
            
            # Extract coordinates from GeoJSON geometry
            route = data["routes"][0]
            coords = route["geometry"]["coordinates"]
            
            # Reverse from [lng, lat] to [lat, lng]
            return [[coord[1], coord[0]] for coord in coords]
    
    except httpx.HTTPError as e:
        raise HTTPException(status_code=500, detail=f"OSRM service error: {str(e)}")

@router.get("/route")
async def get_route(
    from_lat: float = Query(...),
    from_lng: float = Query(...),
    to_lat: float = Query(...),
    to_lng: float = Query(...),
):
    """
    Get single route between two coordinates
    
    Returns: { route: [[lat, lng], [lat, lng], ...] }
    """
    try:
        route = await fetch_route_from_osrm(from_lat, from_lng, to_lat, to_lng)
        return {
            "route": route,
            "success": True,
            "num_points": len(route),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/routes-batch")
async def get_multiple_routes(request: RouteBatchRequest):
    """
    Get multiple routes in one request
    Parallelizes requests for efficiency
    
    Request: { routes: [{ from_lat, from_lng, to_lat, to_lng, label }, ...] }
    Returns: { routes: { label1: [...], label2: [...] } }
    """
    try:
        # Create tasks for all routes
        tasks = []
        labels = []
        
        for route_req in request.routes:
            labels.append(route_req.get("label", f"route_{len(tasks)}"))
            task = fetch_route_from_osrm(
                route_req["from_lat"],
                route_req["from_lng"],
                route_req["to_lat"],
                route_req["to_lng"],
            )
            tasks.append(task)
        
        # Execute all requests in parallel
        routes = await asyncio.gather(*tasks)
        
        # Build response with labels
        result = {}
        for label, route in zip(labels, routes):
            result[label] = route
        
        return {
            "routes": result,
            "success": True,
            "total_requests": len(labels),
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


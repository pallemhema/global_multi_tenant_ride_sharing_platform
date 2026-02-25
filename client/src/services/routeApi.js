/**
 * Route API Service
 * Handles route calculation for polyline visualization
 * Uses OSRM (Open Source Routing Machine) or similar backend service
 */

import { apiClient } from "./axios";

/**
 * Get route between two coordinates
 * Returns array of [lat, lng] coordinates representing the path
 */
export const getRoute = async (fromLat, fromLng, toLat, toLng) => {
  try {
    const response = await apiClient.get("/trips/route", {
      params: {
        from_lat: parseFloat(fromLat),
        from_lng: parseFloat(fromLng),
        to_lat: parseFloat(toLat),
        to_lng: parseFloat(toLng),
      },
    });

    // Response should contain: { route: [[lat, lng], [lat, lng], ...] }
    if (response?.route && Array.isArray(response.route)) {
      return response.route;
    }

    console.warn("Route API returned unexpected structure:", response);
    return [];
  } catch (error) {
    console.error("Error fetching route:", error);
    throw error;
  }
};

/**
 * Get multiple routes in one call
 * Useful for getting driver→pickup and pickup→drop simultaneously
 */
export const getMultipleRoutes = async (routes) => {
  /**
   * routes = [
   *   { from: [lat, lng], to: [lat, lng], label: "driver_to_pickup" },
   *   { from: [lat, lng], to: [lat, lng], label: "pickup_to_drop" }
   * ]
   */
  try {
    const response = await apiClient.post("/trips/routes-batch", {
      routes: routes.map((r) => ({
        from_lat: r.from[0],
        from_lng: r.from[1],
        to_lat: r.to[0],
        to_lng: r.to[1],
        label: r.label,
      })),
    });

    // Response should contain: { routes: { driver_to_pickup: [...], pickup_to_drop: [...] } }
    return response?.routes || {};
  } catch (error) {
    console.error("Error fetching multiple routes:", error);
    throw error;
  }
};

/**
 * Find the closest point on the route to a given location
 * Returns { index, distance, coordinate }
 */
export const findClosestPointOnRoute = (driverLocation, routeCoordinates) => {
  if (!routeCoordinates || routeCoordinates.length === 0) {
    return { index: 0, distance: Infinity, coordinate: null };
  }

  let closestIndex = 0;
  let closestDistance = Infinity;

  routeCoordinates.forEach((coord, idx) => {
    const dist = calculateDistance(
      driverLocation[0],
      driverLocation[1],
      coord[0],
      coord[1],
    );
    if (dist < closestDistance) {
      closestDistance = dist;
      closestIndex = idx;
    }
  });

  return {
    index: closestIndex,
    distance: closestDistance,
    coordinate: routeCoordinates[closestIndex],
  };
};

/**
 * Calculate Haversine distance between two coordinates
 * Returns distance in kilometers
 */
export const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371; // Earth radius in km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const toRad = (deg) => (deg * Math.PI) / 180;

/**
 * Check if driver is within threshold distance of a point
 * Typical threshold: 0.03 km (30 meters)
 */
export const isWithinThreshold = (
  driverLocation,
  targetLocation,
  thresholdKm = 0.03,
) => {
  const dist = calculateDistance(
    driverLocation[0],
    driverLocation[1],
    targetLocation[0],
    targetLocation[1],
  );
  return dist <= thresholdKm;
};

/**
 * Shrink route by removing visited points
 * Returns remaining route coordinates from current driver position onward
 */
export const shrinkRoute = (driverLocation, fullRoute) => {
  if (!fullRoute || fullRoute.length === 0) return [];

  const { index } = findClosestPointOnRoute(driverLocation, fullRoute);

  // Return route from closest point onward
  // This gradually shrinks the blue line as driver progresses
  return fullRoute.slice(Math.max(0, index));
};

export const getLocationsMapping = async (fromlat, fromlng,tolat,tolng) => {
  try {
    const response = await apiClient.get("/location-mapping", {
      params: {
        from_lat: parseFloat(fromlat),
        from_lng: parseFloat(fromlng),
        to_lat: parseFloat(tolat),
        to_lng: parseFloat(tolng),
      },
    });
    console.log("location mapping response:", response);

    // Response should contain: { address: "123 Main St, City, Country" }
    return response?.data || "Unknown location";
  } catch (error) {
    console.error("Error fetching location mapping:", error);
    return "Unknown location";
  }
};
export default {
  getRoute,
  getMultipleRoutes,
  findClosestPointOnRoute,
  calculateDistance,
  isWithinThreshold,
  shrinkRoute,
  getLocationsMapping,
};

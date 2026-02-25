import { useEffect, useState, useMemo, useRef } from "react";
import { getLocationsMapping } from "../services/routeApi";

export default function useTripRoute({
  pickupLat,
  pickupLng,
  dropLat,
  dropLng,
  driverLat,
  driverLng,
  enabled = true,
}) {
  const [driverToPickupRoute, setDriverToPickupRoute] = useState([]);
  const [pickupToDropRoute, setPickupToDropRoute] = useState([]);
  const [loading, setLoading] = useState(false);

  const isFetchingDriverRoute = useRef(false);
  const isFetchingDropRoute = useRef(false);

  // ===============================
  // Memoized Locations (Stable)
  // ===============================
  const driverLocation = useMemo(() => {
    if (driverLat == null || driverLng == null) return null;
    return [Number(driverLat), Number(driverLng)];
  }, [driverLat, driverLng]);

  const pickupLocation = useMemo(() => {
    if (pickupLat == null || pickupLng == null) return null;
    return [Number(pickupLat), Number(pickupLng)];
  }, [pickupLat, pickupLng]);

  const dropLocation = useMemo(() => {
    if (dropLat == null || dropLng == null) return null;
    return [Number(dropLat), Number(dropLng)];
  }, [dropLat, dropLng]);

  // ===============================
  // DRIVER → PICKUP ROUTE
  // Fetch ONLY when pickup changes
  // ===============================
  useEffect(() => {
    if (!enabled) return;
    if (!pickupLocation || !driverLocation) return;

    const fetchRoute = async () => {
      if (isFetchingDriverRoute.current) return;
      isFetchingDriverRoute.current = true;

      try {
        setLoading(true);

        const data = await getLocationsMapping(
          driverLocation[0],
          driverLocation[1],
          pickupLocation[0],
          pickupLocation[1]
        );

        if (!data?.routes?.length) {
          setDriverToPickupRoute([]);
          return;
        }

        const coords = data.routes[0].geometry.coordinates.map(
          ([lng, lat]) => [lat, lng]
        );

        setDriverToPickupRoute(coords);
      } catch (err) {
        console.error("Driver→Pickup route error:", err);
        setDriverToPickupRoute([]);
      } finally {
        setLoading(false);
        isFetchingDriverRoute.current = false;
      }
    };

    fetchRoute();

  }, [pickupLat, pickupLng, enabled]); 
  // ⚠️ NOT depending on driverLat/Lng to avoid API spam

  // ===============================
  // PICKUP → DROP ROUTE
  // Fetch ONLY when pickup/drop changes
  // ===============================
  useEffect(() => {
    if (!enabled) return;
    if (!pickupLocation || !dropLocation) return;

    const fetchRoute = async () => {
      if (isFetchingDropRoute.current) return;
      isFetchingDropRoute.current = true;

      try {
        setLoading(true);

        const data = await getLocationsMapping(
          pickupLocation[0],
          pickupLocation[1],
          dropLocation[0],
          dropLocation[1]
        );

        if (!data?.routes?.length) {
          setPickupToDropRoute([]);
          return;
        }

        const coords = data.routes[0].geometry.coordinates.map(
          ([lng, lat]) => [lat, lng]
        );

        setPickupToDropRoute(coords);
      } catch (err) {
        console.error("Pickup→Drop route error:", err);
        setPickupToDropRoute([]);
      } finally {
        setLoading(false);
        isFetchingDropRoute.current = false;
      }
    };

    fetchRoute();

  }, [pickupLat, pickupLng, dropLat, dropLng, enabled]);

  return {
    driverLocation,
    pickupLocation,
    dropLocation,
    driverToPickupRoute,
    pickupToDropRoute,
    loading,
  };
}
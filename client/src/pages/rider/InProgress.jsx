

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import * as tripApi from "../../services/tripApi";
import TripRouteMap from "../../components/Trip/TripRouteMap";
export default function InProgress() {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState(null);



   useEffect(() => {
    if (!tripId) return;

    let intervalId;

    const poll = async () => {
      try {
        const res = await tripApi.getTripStatusByTripId(tripId);
        setStatus(res);

        if (res.status === "completed") {
                    navigate(`/rider/trip-completion/${tripId}`);

          clearInterval(intervalId);
        }
      }
      catch (err) {
        console.error("Polling error:", err);
      }
    };

    poll();
    intervalId = setInterval(poll, 3000);

    return () => clearInterval(intervalId);

  }, [tripId]);

  if (!status) return null;
  console.log("Current Trip Status:", status);
    const driverLocation =
    status.driver_lat != null && status.driver_lng != null
      ? [status.driver_lat, status.driver_lng]
      : null;

  const pickupLocation =
    status.pickup_lat != null && status.pickup_lng != null
      ? [status.pickup_lat, status.pickup_lng]
      : null;

  const dropLocation =
    status.drop_lat != null && status.drop_lng != null
      ? [status.drop_lat, status.drop_lng]
      : null;


  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Trip in progress</h1>
      <p className="text-sm text-slate-600">Trip status: {status?.status}</p>

      <div className="h-72 rounded overflow-hidden bg-white">
         <TripRouteMap
      driverLocation={driverLocation}
      pickupLocation={pickupLocation}
      dropLocation={dropLocation}
      driverToPickupRoute={
        driverLocation && pickupLocation
          ? [driverLocation, pickupLocation]
          : []
      }
      pickupToDropRoute={
        pickupLocation && dropLocation
          ? [pickupLocation, dropLocation]
          : []
      }
    />
      </div>

      <div className="p-4 bg-white rounded">
        <div className="font-semibold">ETA: {status?.eta || "—"}</div>
        <div className="text-sm text-slate-600">
          Distance: {status?.distance || "—"}
        </div>
      </div>
    </div>
  );
}
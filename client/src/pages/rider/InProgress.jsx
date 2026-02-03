import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import * as tripApi from "../../services/tripApi";
import { MapContainer, TileLayer, Marker } from "react-leaflet";

export default function InProgress() {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState(null);

  useEffect(() => {
    let mounted = true;
    const poll = async () => {
      try {
        // Use trip_id endpoint since trip is already created
        const res = await tripApi.getTripStatusByTripId(tripId);
        if (!mounted) return;
        console.log("Trip Status:", res);
        setStatus(res);

        // If trip is completed, navigate to completion page
        if (res?.status === "completed") {
          navigate(`/rider/trip-completion/${tripId}`);
        }
      } catch (e) {
        console.error(e);
      }
    };
    poll();
    const id = setInterval(poll, 3000);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, [tripId, navigate]);
  console.log("Current Trip Status:", status);

  const driverPos = status?.driver_location;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Trip in progress</h1>
      <p className="text-sm text-slate-600">Trip status: {status?.status}</p>

      <div className="h-72 rounded overflow-hidden bg-white">
        <MapContainer
          center={[17.385044, 78.486671]}
          zoom={13}
          style={{ height: "100%" }}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {driverPos && <Marker position={[driverPos.lat, driverPos.lng]} />}
        </MapContainer>
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


import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import MapSelector from "../../components/Map/MapSelector";
import * as tripApi from "../../services/tripApi";
import { getCurrentPositionPromise } from "../../utils/location";
import { reverseGeocode } from "../../utils/reverseGeoCode";

export default function PickupDrop() {
  const [pickup, setPickup] = useState(null);
  const [drop, setDrop] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeField, setActiveField] = useState("pickup");

  const navigate = useNavigate();

  // 🔹 Auto-detect rider location
  useEffect(() => {
    const initLocation = async () => {
      try {
        const pos = await getCurrentPositionPromise();

        const result = await reverseGeocode(
          pos.latitude,
          pos.longitude
        );

        setPickup({
          lat: result.lat,
          lng: result.lng,
          address: result.fullAddress,
          city: result.city,
        });
      } catch (err) {
        console.error("Location error:", err);
      }
    };

    initLocation();
  }, []);

  const handleRequest = async () => {
    if (!pickup || !drop) return;

    try {
      setLoading(true);

      const payload = {
        pickup_lat: pickup.lat,
        pickup_lng: pickup.lng,
        pickup_address: pickup.address,
        drop_lat: drop.lat,
        drop_lng: drop.lng,
        drop_address: drop.address,
      };

      const res = await tripApi.requestTrip(payload);

      const tripRequestId = res.trip_request_id || res.id;
      navigate(`/rider/options/${tripRequestId}`);
    } catch (err) {
      console.error(err);
      alert(err.message || "Failed to request ride");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-6">
      <h1 className="text-2xl font-bold">
        {pickup?.city
          ? `Request a Ride in ${pickup.city}`
          : "Request a Ride"}
      </h1>

      <div className="bg-white rounded-lg overflow-hidden shadow">
        <MapSelector
          pickup={pickup}
          drop={drop}
          setPickup={setPickup}
          setDrop={setDrop}
          activeField={activeField}
        />
      </div>

      <div className="bg-white rounded-lg p-4 shadow">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-semibold mb-2">
              From
            </label>
            <input
              readOnly
              onClick={() => setActiveField("pickup")}
              value={pickup?.address || ""}
              placeholder="Click on map to select pickup"
              className={`cursor-pointer w-full p-2 rounded border bg-slate-50 ${
                activeField === "pickup"
                  ? "border-indigo-500"
                  : "border-slate-300"
              }`}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">
              To
            </label>
            <input
              readOnly
              onClick={() => setActiveField("drop")}
              value={drop?.address || ""}
              placeholder="Click on map to select drop"
              className={`cursor-pointer w-full p-2 rounded border bg-slate-50 ${
                activeField === "drop"
                  ? "border-indigo-500"
                  : "border-slate-300"
              }`}
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleRequest}
            disabled={!pickup || !drop || loading}
            className="bg-indigo-600 text-white px-6 py-2 rounded font-medium disabled:opacity-50"
          >
            {loading ? "Requesting…" : "Request Ride"}
          </button>
        </div>
      </div>
    </div>
  );
}

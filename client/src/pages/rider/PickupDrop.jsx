import { useState } from "react";
import { useNavigate } from "react-router-dom";
import MapSelector from "../../components/rider/MapSelector";
import * as tripApi from "../../services/tripApi";

export default function PickupDrop() {
  const [pickup, setPickup] = useState(null);
  const [drop, setDrop] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

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
      // backend should return tripRequestId
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
      <h1 className="text-2xl font-bold">Request a Ride</h1>

      {/* Map Container with fixed height */}
      <div className="bg-white rounded-lg overflow-hidden shadow">
        <MapSelector
          pickup={pickup}
          drop={drop}
          setPickup={setPickup}
          setDrop={setDrop}
        />
      </div>

      {/* Info Section - Below Map */}
      <div className="bg-white rounded-lg p-4 shadow">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              From
            </label>
            <input
              readOnly
              value={pickup?.address || ""}
              placeholder="Click on map to select pickup"
              className="w-full p-2 rounded border border-slate-300 bg-slate-50 text-slate-900"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              To
            </label>
            <input
              readOnly
              value={drop?.address || ""}
              placeholder="Click on map to select drop"
              className="w-full p-2 rounded border border-slate-300 bg-slate-50 text-slate-900"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleRequest}
            disabled={!pickup || !drop || loading}
            className="bg-indigo-600 text-white px-6 py-2 rounded font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-indigo-700"
          >
            {loading ? "Requesting…" : "Request Ride"}
          </button>
        </div>
      </div>
    </div>
  );
}

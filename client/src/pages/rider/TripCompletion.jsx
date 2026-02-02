import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { CheckCircle, MapPin, Clock, DollarSign } from "lucide-react";
import * as tripApi from "../../services/tripApi";

export default function TripCompletion() {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const [receipt, setReceipt] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReceipt = async () => {
      try {
        const res = await tripApi.getTripReceipt(tripId);
        console.log("Receipt:", res);
        setReceipt(res);
      } catch (e) {
        console.error("Failed to fetch receipt:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchReceipt();
  }, [tripId]);

  if (loading) {
    return (
      <div className="p-6 text-center">
        <p className="text-slate-600">Loading trip details...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* SUCCESS HEADER */}
      <div className="text-center">
        <CheckCircle className="mx-auto text-green-600 mb-3" size={48} />
        <h1 className="text-2xl font-bold">Trip Completed!</h1>
        <p className="text-slate-600 mt-1">Thank you for your ride</p>
      </div>

      {/* TRIP DETAILS */}
      {receipt && (
        <div className="space-y-4">
          {/* DRIVER & VEHICLE */}
          {receipt.driver && (
            <div className="p-4 bg-white rounded shadow">
              <div className="font-semibold">
                {receipt.driver.name || "Driver"}
              </div>
              <div className="text-sm text-slate-600">
                {receipt.vehicle?.license_plate || "—"} •{" "}
                {receipt.vehicle?.category_code || "—"}
              </div>
              {receipt.driver.rating_avg && (
                <div className="text-sm text-yellow-600 mt-1">
                  ⭐ {receipt.driver.rating_avg} (
                  {receipt.driver.rating_count || 0} reviews)
                </div>
              )}
            </div>
          )}

          {/* TRIP DETAILS */}
          <div className="p-4 bg-slate-50 rounded space-y-3">
            {/* PICKUP */}
            <div className="flex gap-3">
              <MapPin
                size={18}
                className="text-indigo-600 flex-shrink-0 mt-1"
              />
              <div>
                <p className="text-xs text-slate-500">Pickup</p>
                <p className="text-sm font-medium">
                  {receipt.pickup_address || "—"}
                </p>
              </div>
            </div>

            {/* DROPOFF */}
            <div className="flex gap-3">
              <MapPin
                size={18}
                className="text-emerald-600 flex-shrink-0 mt-1"
              />
              <div>
                <p className="text-xs text-slate-500">Dropoff</p>
                <p className="text-sm font-medium">
                  {receipt.drop_address || "—"}
                </p>
              </div>
            </div>

            {/* DURATION & DISTANCE */}
            <div className="flex gap-4 pt-2 border-t">
              <div>
                <p className="text-xs text-slate-500">Duration</p>
                <p className="text-sm font-medium">
                  {receipt.duration_minutes || "—"} min
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Distance</p>
                <p className="text-sm font-medium">
                  {receipt.distance_km || "—"} km
                </p>
              </div>
            </div>
          </div>

          {/* FARE BREAKDOWN */}
          <div className="p-4 bg-white rounded shadow space-y-2">
            <h3 className="font-semibold">Fare Breakdown</h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Base Fare</span>
                <span>₹{receipt.base_fare || "0"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Distance</span>
                <span>₹{receipt.distance_charge || "0"}</span>
              </div>
              {receipt.surge_multiplier > 1 && (
                <div className="flex justify-between text-orange-600">
                  <span>Surge ({receipt.surge_multiplier}x)</span>
                  <span>₹{receipt.surge_charge || "0"}</span>
                </div>
              )}
              <div className="border-t pt-1 flex justify-between font-semibold">
                <span>Total Fare</span>
                <span className="text-lg">₹{receipt.total_fare || "0"}</span>
              </div>
            </div>
          </div>

          {/* ACTION BUTTON */}
          <button
            onClick={() => navigate("/rider/dashboard")}
            className="w-full py-3 bg-indigo-600 text-white font-medium rounded hover:bg-indigo-700 transition"
          >
            Book Another Ride
          </button>
        </div>
      )}
    </div>
  );
}

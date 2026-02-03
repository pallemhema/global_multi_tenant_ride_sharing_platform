import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { CheckCircle, MapPin, Clock, DollarSign, Lock } from "lucide-react";
import * as tripApi from "../../services/tripApi";

export default function TripCompletion() {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const [receipt, setReceipt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchReceipt = async () => {
      try {
        const res = await tripApi.getTripReceipt(tripId);
        console.log("Receipt:", res);
        setReceipt(res);
      } catch (e) {
        console.error("Failed to fetch receipt:", e);
        setError("Failed to load trip details. Please try again.");
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

  if (error) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-600">{error}</p>
        <button
          onClick={() => navigate("/rider/dashboard")}
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-6">
      {/* SUCCESS HEADER */}
      <div className="text-center">
        <CheckCircle className="mx-auto text-green-600 mb-3" size={48} />
        <h1 className="text-2xl font-bold">Trip Completed!</h1>
        <p className="text-slate-600 mt-1">Thank you for your ride</p>
      </div>

      {/* TRIP DETAILS */}
      {receipt && (
        <div className="space-y-4">
          {/* OTP SECTION - VISIBLE FOR PAYMENT VERIFICATION */}
          {receipt.otp && (
            <div className="p-4 bg-amber-50 rounded shadow border border-amber-200">
              <div className="flex items-start gap-3">
                <Lock size={18} className="text-amber-600 flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <p className="text-xs font-semibold text-amber-900">
                    Payment Verification OTP
                  </p>
                  <p className="text-2xl font-mono font-bold text-amber-700 mt-1">
                    {receipt.otp}
                  </p>
                  <p className="text-xs text-amber-700 mt-1">
                    Keep this OTP for payment reference (Valid for 30 minutes)
                  </p>
                </div>
              </div>
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
            <h3 className="font-semibold text-lg">Fare Breakdown</h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Base Fare</span>
                <span>₹{parseFloat(receipt.base_fare || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Distance Charge</span>
                <span>
                  ₹{parseFloat(receipt.distance_charge || 0).toFixed(2)}
                </span>
              </div>
              {receipt.time_charge > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-600">Time Charge</span>
                  <span>
                    ₹{parseFloat(receipt.time_charge || 0).toFixed(2)}
                  </span>
                </div>
              )}
              {receipt.surge_multiplier && receipt.surge_multiplier > 1 && (
                <div className="flex justify-between text-orange-600">
                  <span>Surge ({receipt.surge_multiplier}x)</span>
                  <span>
                    +₹
                    {(
                      parseFloat(receipt.base_fare || 0) *
                      (receipt.surge_multiplier - 1)
                    ).toFixed(2)}
                  </span>
                </div>
              )}
              {receipt.discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>-₹{parseFloat(receipt.discount || 0).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-xs text-slate-600 py-1">
                <span>Tax</span>
                <span>₹{parseFloat(receipt.tax || 0).toFixed(2)}</span>
              </div>
              <div className="border-t pt-2 flex justify-between font-bold text-lg">
                <span>Payable Amount</span>
                <span className="text-indigo-600">
                  ₹{parseFloat(receipt.total_fare || 0).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* PAYMENT STATUS */}
          <div className="p-4 bg-green-50 rounded border border-green-200">
            <p className="text-sm text-green-800">
              ✓ Payment marked complete. Your receipt has been sent to
              registered email.
            </p>
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

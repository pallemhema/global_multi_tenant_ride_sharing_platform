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
  const [selectedRating, setSelectedRating] = useState(0);
const [hoverRating, setHoverRating] = useState(0);
const [comment, setComment] = useState("");
const [submitting, setSubmitting] = useState(false);
const [rated, setRated] = useState(false);



  useEffect(() => {
    const fetchReceipt = async () => {
      try {
        const res = await tripApi.getTripReceipt(tripId);
        console.log("Receipt:", res);
        if (res.rating) {
  setRated(true);
}

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

 const handleTripRating = async () => {
  if (!selectedRating) return;

  try {
    setSubmitting(true);

    await tripApi.tripRating(tripId, {
      rating: selectedRating,
      comment: comment,
    });
    alert("Rating done!!")

    setRated(true);   // 👈 hide rating section
  } catch (err) {
    console.error("Failed to rate trip", err);
  } finally {
    setSubmitting(false);
  }
};



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

          {/* rating */}
          {/* RATING SECTION */}
          {!rated && (
        <div className="p-4 bg-white rounded shadow space-y-4">
          <h3 className="font-semibold text-lg">Rate Your Driver</h3>

          {/* Stars */}
          <div className="flex gap-2 justify-center">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setSelectedRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="focus:outline-none"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill={
                    star <= (hoverRating || selectedRating)
                      ? "#facc15"
                      : "none"
                  }
                  viewBox="0 0 24 24"
                  stroke="#facc15"
                  strokeWidth={2}
                  className="w-8 h-8 transition"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l2.036 6.272a1 1 0 00.95.69h6.592c.969 0 1.371 1.24.588 1.81l-5.334 3.874a1 1 0 00-.364 1.118l2.036 6.272c.3.921-.755 1.688-1.538 1.118l-5.334-3.874a1 1 0 00-1.176 0l-5.334 3.874c-.783.57-1.838-.197-1.538-1.118l2.036-6.272a1 1 0 00-.364-1.118L.98 11.699c-.783-.57-.38-1.81.588-1.81h6.592a1 1 0 00.95-.69l2.036-6.272z"
                  />
                </svg>
              </button>
            ))}
          </div>

          {/* Comment */}
          <textarea
            placeholder="Write a comment (optional)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />

          {/* Submit Button */}
          <button
            onClick={handleTripRating}
            disabled={!selectedRating || submitting}
            className="w-full py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 disabled:opacity-50"
          >
            {submitting ? "Submitting..." : "Submit Rating"}
          </button>
        </div>)}

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

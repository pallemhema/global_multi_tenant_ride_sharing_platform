import React, { useState, useEffect } from "react";
import { useDriver } from "../../context/DriverContext";

export default function DriverTripControls() {
  const {
    activeTrip,
    startTrip,
    completeTrip,
    runtimeStatus,
    cancelTrip,
    refreshActiveTrip,
  } = useDriver();

  const [otp, setOtp] = useState("");
  const [starting, setStarting] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [fare, setFare] = useState(null);

  // Auto-poll active trip only when on_trip (not during OTP entry)
  useEffect(() => {
    if (runtimeStatus?.runtime_status !== "on_trip") {
      return; // Don't poll during trip_accepted (OTP entry phase)
    }

    const pollInterval = setInterval(() => {
      refreshActiveTrip();
    }, 3000);

    return () => clearInterval(pollInterval);
  }, [runtimeStatus?.runtime_status, refreshActiveTrip]);

  console.log("activeTrip:", activeTrip);

  if (!activeTrip || !activeTrip.trip_id) {
    return (
      <div className="p-4 border rounded bg-yellow-50 text-sm">
        No active trip assigned
      </div>
    );
  }

  const handleStart = async () => {
    if (!otp) return alert("OTP required");

    setStarting(true);
    try {
      const res = await startTrip({
        trip_id: activeTrip.trip_id,
        otp,
      });
      alert(res.message || "Trip started");
      setOtp("");
    } catch (err) {
      console.error("startTrip failed", err);
      alert(err.message || "Failed to start trip");
    } finally {
      setStarting(false);
    }
  };

  const handleComplete = async () => {
    const distance = parseFloat(prompt("Enter distance in km (e.g., 5.2)"));
    const duration = parseInt(
      prompt("Enter duration in minutes (e.g., 12)"),
      10,
    );

    if (isNaN(distance) || isNaN(duration)) {
      return alert("Distance and duration required");
    }

    setCompleting(true);
    try {
      const res = await completeTrip({
        trip_id: activeTrip.trip_id,
        distance_km: distance,
        duration_minutes: duration,
      });
      setFare(res.fare);
      alert(res.message || "Trip completed");
    } catch (err) {
      console.error("completeTrip failed", err);
      alert(err.message || "Failed to complete trip");
    } finally {
      setCompleting(false);
    }
  };

  const handleCancel = async () => {
    const reason = prompt("Enter cancel reason");
    if (!reason) return;

    try {
      await cancelTrip({
        trip_id: activeTrip.trip_id,
        reason,
      });
      alert("Trip cancelled");
    } catch (err) {
      console.error("cancelTrip failed", err);
      alert(err.message || "Failed to cancel trip");
    }
  };

  return (
    <div className="p-4 border rounded-lg bg-white">
      <h3 className="font-semibold mb-3">Trip Controls</h3>

      <div className="grid gap-3">
        {/* START TRIP */}
        {runtimeStatus.runtime_status === "trip_accepted" && (
          <div className="flex gap-2">
            <input
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="border p-2 rounded flex-1"
              placeholder="Enter OTP"
            />
            <button
              disabled={starting}
              onClick={handleStart}
              className="px-3 py-1 bg-indigo-600 text-white rounded disabled:opacity-50"
            >
              Start Trip
            </button>
          </div>
        )}

        {/* COMPLETE TRIP */}
        {runtimeStatus.runtime_status === "on_trip" && (
          <button
            disabled={completing}
            onClick={handleComplete}
            className="px-3 py-1 bg-emerald-500 text-white rounded disabled:opacity-50"
          >
            Complete Trip
          </button>
        )}

        {/* CANCEL TRIP */}
        {["trip_accepted"].includes(runtimeStatus.runtime_status) && (
          <button
            onClick={handleCancel}
            className="px-3 py-1 bg-red-500 text-white rounded"
          >
            Cancel Trip
          </button>
        )}

        {/* FARE SUMMARY */}
        {fare && (
          <div className="mt-2 text-sm text-gray-700">
            <div>
              <b>Fare:</b> {fare.total_fare} {fare.currency}
            </div>
            <div>
              <b>Base:</b> {fare.base_fare}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}



import  { useState, useEffect } from "react";
import { useDriver } from "../../context/DriverContext";

export default function DriverTripControls() {
  const {
    activeTrip,
    startTrip,
    completeTrip,
    runtimeStatus,
    cancelTrip,
    refreshActiveTrip,
    pendingPayments,
    paymentconfirmation,
  } = useDriver();

  const [otp, setOtp] = useState("");
  const [starting, setStarting] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [loadingState, setLoadingState] = useState(true);

  /* -----------------------------------------------------
     FETCH ACTIVE TRIP ON COMPONENT MOUNT
  ----------------------------------------------------- */
  useEffect(() => {
    const loadInitialTrip = async () => {
      try {
        await refreshActiveTrip();
      } catch (err) {
        console.error("Initial trip load failed:", err);
      } finally {
        setLoadingState(false);
      }
    };

    loadInitialTrip();
  }, []);

  /* -----------------------------------------------------
     POLL ONLY WHEN DRIVER IS ON TRIP
  ----------------------------------------------------- */
 
useEffect(() => {
  if (runtimeStatus?.runtime_status !== "on_trip") return;

  const pollInterval = setInterval(() => {
    refreshActiveTrip();
  }, 3000);

  return () => clearInterval(pollInterval);
}, [runtimeStatus?.runtime_status]);

  /* -----------------------------------------------------
     LOADING GUARD (prevents wrong UI flash)
  ----------------------------------------------------- */
  if (loadingState) {
    return (
      <div className="p-4 border rounded bg-gray-50 text-sm">
        Loading trip state...
      </div>
    );
  }

  /* -----------------------------------------------------
     NO ACTIVE TRIP + NO PAYMENTS
  ----------------------------------------------------- */
  if (!activeTrip?.trip_id && pendingPayments.length === 0) {
    return (
      <div className="p-4 border rounded bg-yellow-50 text-sm">
        No active trip assigned
      </div>
    );
  }

  /* -----------------------------------------------------
     HANDLERS
  ----------------------------------------------------- */

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
      await refreshActiveTrip();
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
      10
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

      alert(res.message || "Trip completed");
      await refreshActiveTrip();
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
      await refreshActiveTrip();
    } catch (err) {
      console.error("cancelTrip failed", err);
      alert(err.message || "Failed to cancel trip");
    }
  };

  const handleConfirmPayment = async (
    tripId,
    currency_code,
    method
  ) => {
    try {
      await paymentconfirmation(tripId, currency_code, method);
      alert("Payment confirmed");
      await refreshActiveTrip();
    } catch (err) {
      alert(err.message || "Failed to confirm payment");
    }
  };

  /* -----------------------------------------------------
     RENDER
  ----------------------------------------------------- */

  return (
    <div className="p-4 border rounded-lg bg-white">
      <h3 className="font-semibold mb-3">Trip Controls</h3>

      <div className="grid gap-3">
        {/* START TRIP */}
        {runtimeStatus?.runtime_status === "trip_accepted" &&
          activeTrip?.trip_id && (
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
        {runtimeStatus?.runtime_status === "on_trip" &&
          activeTrip?.trip_id && (
            <button
              disabled={completing}
              onClick={handleComplete}
              className="px-3 py-1 bg-emerald-500 text-white rounded disabled:opacity-50"
            >
              Complete Trip
            </button>
          )}

        {/* CANCEL TRIP */}
        {runtimeStatus?.runtime_status === "trip_accepted" &&
          activeTrip?.trip_id && (
            <button
              onClick={handleCancel}
              className="px-3 py-1 bg-red-500 text-white rounded"
            >
              Cancel Trip
            </button>
          )}

        {/* PENDING PAYMENTS */}
        {pendingPayments.length > 0 && (
          <div className="space-y-4">
            <h4 className="font-semibold text-lg">
              Pending Payments
            </h4>

            {pendingPayments.map((payment) => (
              <div
                key={payment.payment_id}
                className="p-4 border border-blue-300 rounded-lg bg-blue-50"
              >
                <div className="text-sm mb-3">
                  <div>
                    <b>Trip ID:</b> {payment.trip_id}
                  </div>
                  <div>
                    <b>Amount:</b> {payment.amount}{" "}
                    {payment.currency}
                  </div>
                  <div>
                    <b>Status:</b>{" "}
                    {payment.payment_status}
                  </div>
                </div>

                <button
                  onClick={() =>
                    handleConfirmPayment(
                      payment.trip_id,
                      payment.currency_code,
                      "online"
                    )
                  }
                  className="w-full px-3 py-2 bg-blue-600 text-white rounded"
                >
                  Confirm Payment
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

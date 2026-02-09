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
    pendingPayments,
    paymentconfirmation,
  } = useDriver();

  const [otp, setOtp] = useState("");
  const [starting, setStarting] = useState(false);
  const [completing, setCompleting] = useState(false);

const [paymentMethods, setPaymentMethods] = useState({});

// "online" | "offline"


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
  console.log("pendingPayments:", pendingPayments);

{(!activeTrip || !activeTrip.trip_id) && pendingPayments.length === 0 && (
  <div className="p-4 border rounded bg-yellow-50 text-sm">
    No active trip assigned
  </div>
)}



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

      console.log("Trip completed response:", res);
     
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
  const setMethodForPayment = (paymentId, method) => {
  setPaymentMethods(prev => ({
    ...prev,
    [paymentId]: method,
  }));
};


const handleConfirmPayment = async (tripId, method) => {
  try {
    await paymentconfirmation(tripId, method);

    setPaymentMethods(prev => {
      const copy = { ...prev };
      delete copy[tripId]; // or payment_id if backend returns it
      return copy;
    });

    alert(`Payment confirmed (${method})`);
  } catch (err) {
    alert(err.message || "Failed to confirm payment");
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

{pendingPayments.length > 0 && (
  <div className="space-y-4">
    <h4 className="font-semibold text-lg">Pending Payments</h4>

    {pendingPayments.map((payment) => {
      const selectedMethod = paymentMethods[payment.payment_id];

      return (
        <div
          key={payment.payment_id}
          className="p-4 border border-blue-300 rounded-lg bg-blue-50"
        >
          <div className="text-sm mb-3">
            <div><b>Trip ID:</b> {payment.trip_id}</div>
            <div><b>Amount:</b> {payment.amount} {payment.currency}</div>
            <div><b>Status:</b> {payment.payment_status}</div>
          </div>

          {/* PAYMENT METHOD */}
          <div className="mb-3">
            <p className="text-sm font-medium mb-2">Payment Method</p>

            <div className="flex gap-2">
              <button
                onClick={() =>
                  setMethodForPayment(payment.payment_id, "online")
                }
                className={`flex-1 px-3 py-2 rounded border
                  ${selectedMethod === "online"
                    ? "bg-green-600 text-white border-green-600"
                    : "bg-white text-gray-700 border-gray-300"
                  }`}
              >
                Online
              </button>

              <button
                onClick={() =>
                  setMethodForPayment(payment.payment_id, "offline")
                }
                className={`flex-1 px-3 py-2 rounded border
                  ${selectedMethod === "offline"
                    ? "bg-orange-600 text-white border-orange-600"
                    : "bg-white text-gray-700 border-gray-300"
                  }`}
              >
                Offline (Cash)
              </button>
            </div>
          </div>

          {/* CONFIRM */}
          <button
            disabled={!selectedMethod}
            onClick={() =>
              handleConfirmPayment(payment.trip_id, selectedMethod)
            }
            className="w-full px-3 py-2 bg-blue-600 text-white rounded
                       disabled:opacity-50"
          >
            Confirm Payment
          </button>
        </div>
      );
    })}
  </div>
)}




      </div>
    </div>
  );
}

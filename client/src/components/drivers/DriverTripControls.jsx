import { useState, useEffect } from "react";
import { useDriver } from "../../context/DriverContext";
import TripRouteMap from "../Trip/TripRouteMap";
import useTripRoute from "../../hooks/useTripRoute";
import * as tripApi from "../../services/tripApi";
import useHeartbeat from "../../hooks/useHeartbeat";

export default function DriverTripControls() {
  const {
    driver,
    activeShift,
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
  const [tripDetails, setTripDetails] = useState(null);
   useHeartbeat({
    enabled:
      Boolean(driver?.driver_id) &&
      activeShift?.shift_status === "online",
  });

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

  /* Fetch trip details for route map */
  useEffect(() => {
    if (!activeTrip?.trip_id) return;

    const fetchTripDetails = async () => {
      try {
        const details = await tripApi.getTripStatusByTripIdforDriver?.(activeTrip.trip_id);
        if (details) {
          setTripDetails(details);
        }
      } catch (err) {
        console.error("Failed to fetch trip details:", err);
      }
    };

    fetchTripDetails();
  }, [activeTrip?.trip_id]);

  console.log(tripDetails)
console.log("Active Trip:", activeTrip);
  /* Poll driver location in real-time */
  useEffect(() => {
    if (runtimeStatus?.runtime_status !== "on_trip") return;

    const pollInterval = setInterval(() => {
      refreshActiveTrip();
    }, 3000);

    return () => clearInterval(pollInterval);
  }, [runtimeStatus?.runtime_status]);

  /* Initialize route visualization */
  const {
    driverLocation: routeDriverLocation,
    pickupLocation,
    dropLocation,
    driverToPickupRoute,
    pickupToDropRoute,
    tripStatus: routeTripStatus,
    loading: routeLoading,
  } = useTripRoute({
    pickupLat: tripDetails?.trip_request?.pickup_lat,
    pickupLng: tripDetails?.trip_request?.pickup_lng,
    dropLat: tripDetails?.trip_request?.drop_lat,
    dropLng: tripDetails?.trip_request?.drop_lng,
    driverLat: tripDetails?.driver_lat,
    driverLng: tripDetails?.driver_lng,
    tripStatus:
      runtimeStatus?.runtime_status === "on_trip" ? "in_progress" : "assigned",
    enabled: !!tripDetails && !!activeTrip,
  });

  /* Loading guard (prevents wrong UI flash) */
  if (loadingState) {
    return (
      <div className="p-4 border rounded bg-gray-50 text-sm">
        Loading trip state...
      </div>
    );
  }

  /* No active trip + no payments */
  if (!activeTrip?.trip_id && pendingPayments.length === 0) {
    return (
      <div className="p-4 border rounded bg-yellow-50 text-sm">
        No active trip assigned
      </div>
    );
  }

  /* Handlers */
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

  const handleConfirmPayment = async (tripId, currency_code, method) => {
    try {
      await paymentconfirmation(tripId, currency_code, method);
      alert("Payment confirmed");
      await refreshActiveTrip();
    } catch (err) {
      alert(err.message || "Failed to confirm payment");
    }
  };


  /* Render */
  return (
    <div className="space-y-4">
      {/* Route Map - Show during assigned and in-progress */}
      {activeTrip?.trip_id && tripDetails && (
        <div className="h-80 rounded-lg overflow-hidden shadow-lg border">
          <TripRouteMap
            driverLocation={routeDriverLocation}
            pickupLocation={pickupLocation}
            dropLocation={dropLocation}
            driverToPickupRoute={driverToPickupRoute}
            pickUpAddress={tripDetails?.trip_request?.pickup_address}
            dropAddress={tripDetails?.trip_request?.drop_address}
            pickupToDropRoute={pickupToDropRoute}
            loading={routeLoading || loadingState}
            height="h-80"
          />
        </div>
      )}

      {/* Trip Controls */}
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
              <h4 className="font-semibold text-lg">Pending Payments</h4>

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
                      <b>Amount:</b> {payment.amount} {payment.currency}
                    </div>
                    <div>
                      <b>Status:</b> {payment.payment_status}
                    </div>
                  </div>

                  <button
                    onClick={() =>
                      handleConfirmPayment(
                        payment.trip_id,
                        payment.currency_code,
                        "online",
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
    </div>
  );
}

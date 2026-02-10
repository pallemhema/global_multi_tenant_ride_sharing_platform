import { useState } from "react";
import {
  Clock,
  Play,
  StopCircle,
  AlertCircle,
  Calendar,
  MapPin,
} from "lucide-react";

import { useDriver } from "../../context/DriverContext";
import Loader from "../../components/common/Loader";
import { getCurrentPositionPromise } from "../../utils/location";
import useHeartbeat from "../../hooks/useHeartbeat";
import DriverPastTrips from "../../components/drivers/DriverPastTrips";

export default function Shifts() {
  const {
    driver,
    activeShift,
    runtimeStatus,
    can_start_shift,
    loading: contextLoading,
    startShift,
    endShift,
    updateRuntimeStatus,
     pastTrips,
  } = useDriver();
   

  const isApproved = driver?.kyc_status === "approved";

  console.log("activeShift:", activeShift);

  // 🔁 Send location heartbeat ONLY when shift is online

 useHeartbeat({
  enabled:
    Boolean(driver?.driver_id) &&
    activeShift?.shift_status === "online",
});

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /* ---------------- HELPERS ---------------- */

  const isOnline = activeShift?.shift_status === "online";
  const runtime = runtimeStatus?.runtime_status;

  const formatTime = (iso) =>
    iso
      ? new Date(iso).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "N/A";

  const currentDuration = () => {
    // If shift has ended, use the calculated duration from backend
    if (activeShift?.shift_end_utc && activeShift?.duration_minutes) {
      const hours = Math.floor(activeShift.duration_minutes / 60);
      const minutes = activeShift.duration_minutes % 60;
      return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
    }

    // If shift is active, calculate duration from start time
    if (
      activeShift?.shift_start_utc &&
      activeShift?.shift_status === "online"
    ) {
      const start = new Date(activeShift.shift_start_utc);
      const now = new Date();
      const diff = now - start;
      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      return `${h}h ${m}m`;
    }

    return "N/A";
  };

  /* ---------------- ACTIONS ---------------- */

  const handleStartShift = async () => {
    try {
      setLoading(true);
      setError("");

      // 1️⃣ Location permission is mandatory
      let pos;
      try {
        pos = await getCurrentPositionPromise({ timeout: 15000 });
      } catch (err) {
        if (err.message === "permission_denied") {
          setError("Location access is required to go online.");
          return;
        }
        setError("Unable to fetch location. Please try again.");
        return;
      }

      // 2️⃣ Start shift with initial location
      await startShift({
        latitude: pos.latitude,
        longitude: pos.longitude,
      });
    } catch (err) {
      setError(err.message || "Failed to start shift");
    } finally {
      setLoading(false);
    }
  };

  const handleEndShift = async () => {
    if (!window.confirm("Are you sure you want to go offline?")) return;

    try {
      setLoading(true);
      setError("");

      // Get current location to record as end location
      let endLocation = {};
      try {
        const pos = await getCurrentPositionPromise({ timeout: 10000 });
        endLocation = {
          latitude: pos.latitude,
          longitude: pos.longitude,
        };
        console.log("✅ End location captured:", endLocation);
      } catch (err) {
        console.warn("⚠️ Could not capture end location:", err.message);
        // Continue without location if it fails
      }
      console.log(endLocation);

      console.log("Sending end shift with payload:", endLocation);
      await endShift(endLocation);
    } catch (err) {
      setError(err.message || "Failed to end shift");
    } finally {
      setLoading(false);
    }
  };

  if (contextLoading) return <Loader />;

  /* ---------------- UI ---------------- */

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-bold">Shifts</h1>
        <p className="text-slate-600">
          Control your availability and working hours
        </p>
      </div>

      {/* KYC APPROVAL MESSAGE */}
      {!isApproved && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3">
          <AlertCircle className="text-amber-600 flex-shrink-0" size={20} />
          <div>
            <p className="font-semibold text-amber-900">
              KYC Verification Required
            </p>
            <p className="text-sm text-amber-800 mt-1">
              You must complete KYC verification to start shifts. Please check
              your profile or contact support.
            </p>
          </div>
        </div>
      )}

      {/* ERROR */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
          <AlertCircle className="text-red-600" />
          <span className="text-sm text-red-700">{error}</span>
        </div>
      )}

      {/* CURRENT SHIFT CARD */}
      <div
        className={`rounded-lg border p-8 ${
          isOnline
            ? "bg-green-50 border-green-200"
            : "bg-slate-50 border-slate-200"
        }`}
      >
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold mb-2">Current Status</h2>

            <div className="flex items-center gap-2">
              <span
                className={`w-3 h-3 rounded-full ${
                  isOnline ? "bg-green-500" : "bg-slate-400"
                }`}
              />

              <span className="font-semibold">
                {isOnline
                  ? runtime === "available"
                    ? "Available for trips"
                    : runtime === "on_trip"
                      ? "On Trip"
                      : "Unavailable"
                  : "Offline"}
              </span>
            </div>
          </div>

          {/* START / END BUTTON */}
          {isOnline ? (
            <button
              onClick={handleEndShift}
              disabled={loading || runtime === "on_trip"}
              className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              <StopCircle size={20} /> End Shift
            </button>
          ) : (
            <button
              onClick={handleStartShift}
              disabled={loading || !can_start_shift || !isApproved}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium ${
                !can_start_shift || !isApproved
                  ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                  : "bg-green-600 text-white hover:bg-green-700"
              }`}
            >
              <Play size={20} /> Start Shift
            </button>
          )}
        </div>

        {/* WHY START IS DISABLED */}
        {!isOnline && !can_start_shift && isApproved && (
          <div className="mt-3 text-sm text-red-600 flex gap-2">
            <AlertCircle size={16} />
            <span>
              {driver?.driver_type === "fleet_driver"
                ? "Fleet drivers must be assigned a vehicle to start a shift."
                : "You must have at least one approved vehicle to start a shift."}
            </span>
          </div>
        )}

        {/* RUNTIME STATUS BUTTONS - Only show when online */}
        {isOnline && (
          <div className="mt-6 flex gap-3">
            <button
              onClick={() => updateRuntimeStatus("available")}
              disabled={
                loading || runtime === "available" || runtime === "on_trip"
              }
              title={runtime === "on_trip" ? "Complete your trip first" : ""}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                runtime === "available"
                  ? "bg-green-600 text-white"
                  : runtime === "on_trip"
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              ✓ Available
            </button>
            <button
              onClick={() => updateRuntimeStatus("unavailable")}
              disabled={
                loading || runtime === "unavailable" || runtime === "on_trip"
              }
              title={runtime === "on_trip" ? "Complete your trip first" : ""}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                runtime === "unavailable"
                  ? "bg-yellow-600 text-white"
                  : runtime === "on_trip"
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              ⊘ Not Available
            </button>
            <button
              onClick={() => {
                /* Intentionally disabled - on_trip is system-controlled */
              }}
              disabled={true}
              title="On Trip is automatically set by the system - never manually controlled"
              className="px-4 py-2 rounded-lg font-medium transition bg-gray-300 text-gray-500 cursor-not-allowed"
            >
              🛵 On Trip
            </button>
          </div>
        )}

        {/* CANNOT END DURING TRIP */}
        {isOnline && runtime === "on_trip" && (
          <div className="mt-3 text-sm text-red-600 flex gap-2">
            <AlertCircle size={16} />
            <span>You must complete the trip before going offline.</span>
          </div>
        )}

        {/* SHIFT DETAILS */}
        {isOnline && (
          <div className="space-y-2 text-sm mt-4">
            <p>
              <b>Started at:</b> {formatTime(activeShift?.shift_start_utc)}
            </p>
            <p>
              <b>Duration:</b> {currentDuration()}
            </p>
            <p className="flex items-center gap-2 text-slate-600">
              <MapPin size={14} />
              Live location sharing enabled
            </p>
            {activeShift?.shift_start_lat && activeShift?.shift_start_lng && (
              <p className="text-xs text-slate-500">
                📍 Started at: {activeShift.shift_start_lat.toFixed(4)},{" "}
                {activeShift.shift_start_lng.toFixed(4)}
              </p>
            )}
            {activeShift?.shift_end_lat && activeShift?.shift_end_lng && (
              <p className="text-xs text-slate-500">
                📍 Ended at: {activeShift.shift_end_lat.toFixed(4)},{" "}
                {activeShift.shift_end_lng.toFixed(4)}
              </p>
            )}
          </div>
        )}
      </div>

      {/* SHIFT HISTORY (PLACEHOLDER) */}
      <div className="bg-white rounded-lg border p-6">
        <DriverPastTrips
          trips={pastTrips}
          loading={loading}
          driver={driver}
        />
      </div>

      {/* TIPS */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-semibold mb-3">Shift Tips</h3>
        <ul className="text-sm space-y-2">
          <li>• Location access is mandatory to go online</li>
          <li>• Trips are assigned only when available</li>
          <li>• You cannot go offline during a trip</li>
          <li>• Ending shift stops location tracking</li>
        </ul>
      </div>
    </div>
  );
}

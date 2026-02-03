import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import * as tripApi from "../../services/tripApi";
import { AlertCircle } from "lucide-react";

export default function Searching() {
  const { tripRequestId } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState(null);
  const [noDriversFound, setNoDriversFound] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    const poll = async () => {
      try {
        const res = await tripApi.getTripStatus(tripRequestId);
        if (!mounted) return;

        setStatus(res);
        setError(null);

        // Check if driver was assigned
        if (res?.status === "driver_assigned") {
          navigate(`/rider/assigned/${tripRequestId}`);
        }
        // Check if no drivers are available
        else if (res?.status === "no_drivers_available") {
          setNoDriversFound(true);
        }
      } catch (e) {
        console.error("Trip status error:", e);
        if (mounted) {
          setError(e.message || "Failed to check trip status");
        }
      }
    };

    poll();
    const id = setInterval(poll, 3000);

    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, [tripRequestId, navigate]);

  const handleRetry = async () => {
    setIsRetrying(true);
    setNoDriversFound(false);
    setError(null);
    try {
      // Retry the same tenant/vehicle selection
      await tripApi.startDriverSearch(tripRequestId);
      // Clear the message and start polling again
    } catch (e) {
      console.error("Retry failed:", e);
      setError(
        e?.response?.data?.detail || "Failed to retry. Please try again.",
      );
      setNoDriversFound(true);
    } finally {
      setIsRetrying(false);
    }
  };

  const handleChangeTenant = () => {
    // Navigate back to choose a different tenant
    navigate(`/rider/options/${tripRequestId}`);
  };

  return (
    <div className="text-center py-20 space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Searching for nearby drivers…</h2>
        <p className="text-sm text-slate-600 mt-4">
          We are looking for drivers near your pickup location.
        </p>
      </div>

      {/* NO DRIVERS FOUND MESSAGE */}
      {noDriversFound && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 max-w-md mx-auto">
          <div className="flex gap-3 items-start">
            <AlertCircle
              className="text-amber-600 flex-shrink-0 mt-1"
              size={20}
            />
            <div className="text-left">
              <p className="font-semibold text-amber-900">
                No drivers available right now
              </p>
              <p className="text-sm text-amber-800 mt-2">
                Please try again or select a different provider.
              </p>
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <button
              onClick={handleRetry}
              disabled={isRetrying}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50 transition font-medium"
            >
              {isRetrying ? "Retrying..." : "Retry with Same Provider"}
            </button>
            <button
              onClick={handleChangeTenant}
              disabled={isRetrying}
              className="flex-1 px-4 py-2 bg-slate-200 text-slate-900 rounded hover:bg-slate-300 disabled:opacity-50 transition font-medium"
            >
              Choose Different Provider
            </button>
          </div>
        </div>
      )}

      {/* ERROR MESSAGE */}
      {error && !noDriversFound && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-w-md mx-auto">
          <p className="text-red-900 font-medium">{error}</p>
        </div>
      )}
    </div>
  );
}

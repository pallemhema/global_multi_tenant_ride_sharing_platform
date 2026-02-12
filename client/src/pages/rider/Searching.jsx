import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import * as tripApi from "../../services/tripApi";
import { AlertCircle, RotateCcw, Zap, XCircle } from "lucide-react";

export default function Searching() {
  const { tripRequestId } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState(null);
  const [noDriversFound, setNoDriversFound] = useState(false);
  const [tripCancelled, setTripCancelled] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
    const [isChangingProvider, setIsChangingProvider] = useState(false);


  useEffect(() => {
    if (isChangingProvider) return; // ⛔ stop polling when switching provider

    let mounted = true;

    const poll = async () => {
      try {
        const res = await tripApi.getTripStatus(tripRequestId);
        console.log("traip cancelled:",res)
        if (!mounted) return;

        setStatus(res);
        setError(null);

        if (res?.status === "driver_assigned") {
          navigate(`/rider/assigned/${tripRequestId}`);
        }

        else if (res?.status === "no_drivers_available") {
          setNoDriversFound(true);
        }
        else if (res?.status === "driver_cancelled") {
   setTripCancelled(true)
}

        else if (res?.status === "driver_searching") {
          // reset cancellation flags
          setTripCancelled(false);
          setNoDriversFound(false);
        }

      
      } catch (e) {
        if (mounted) {
          setError("Failed to check trip status");
        }
      }
    };

    poll();
    const intervalId = setInterval(poll, 3000);

    return () => {
      mounted = false;
      clearInterval(intervalId);
    };
  }, [tripRequestId, navigate, isChangingProvider]);

  const handleRetry = async () => {
    setIsRetrying(true);
    setNoDriversFound(false);
    setError(null);
    try {
      // Retry the same tenant/vehicle selection
      await tripApi.startDriverSearch(tripRequestId);
      setRetryCount(prev => prev + 1);

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
const handleChangeTenant = async () => {
  try {
     setIsChangingProvider(true);   // ⛔ stop polling
      setError(null);
      setNoDriversFound(false);

      console.log("🔥 CLICKED CHANGE PROVIDER");
  console.log("🔥 changeProvider:", tripApi.changeProvider);
  

    await tripApi.changeProvider(tripRequestId);
    navigate(`/rider/options/${tripRequestId}`);
  } catch (e) {
    setError(
      e?.response?.data?.detail || "Unable to change provider. Please try again."
    );
  }
};



  const handleTripCancelledRetry = () => {
    // Reset cancelled state and start searching again
    setTripCancelled(false);
    setIsRetrying(true);
    setError(null);
    tripApi
      .startDriverSearch(tripRequestId)
      .then(() => {
        setRetryCount(prev => prev + 1);
      })
      .catch((e) => {
        setError(e?.response?.data?.detail || "Failed to retry");
        setTripCancelled(true);
      })
      .finally(() => {
        setIsRetrying(false);
      });
  };
  console.log("tripCancelled:",tripCancelled)
  if (isChangingProvider) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-slate-600 text-lg">
        Redirecting to providers…
      </p>
    </div>
  );
}


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="flex items-center justify-center min-h-screen p-4">
        {tripCancelled ? (
          /* TRIP CANCELLED MESSAGE */
          <div className="w-full max-w-md space-y-6">
            <div className="bg-gradient-to-br from-red-50 to-orange-50 border-2 border-red-200 rounded-xl p-8 shadow-sm">
              <div className="flex justify-center mb-4">
                <XCircle className="text-red-600" size={48} />
              </div>
              <div className="text-center space-y-3">
                <p className="font-bold text-red-900 text-xl">Trip Cancelled</p>
                <p className="text-sm text-red-800 leading-relaxed">
                  The driver cancelled this trip. Don't worry, you can request a
                  new trip immediately.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleTripCancelledRetry}
                disabled={isRetrying}
                className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
              >
                <RotateCcw size={18} />
                {isRetrying ? "Searching…" : "Try Again"}
              </button>

              <button
                onClick={handleChangeTenant}
                disabled={isRetrying}
                className="w-full px-6 py-3 bg-white border-2 border-indigo-600 text-indigo-600 rounded-lg hover:bg-indigo-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold"
              >
                Choose Different Provider
              </button>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
              <p className="text-xs text-blue-700 font-medium mb-2">💡 Tip:</p>
              <ul className="text-xs text-blue-700 space-y-1">
                <li>
                  • Try again with the same provider for available drivers
                </li>
                <li>• Try a different provider for more options</li>
              </ul>
            </div>
          </div>
        ) : !noDriversFound ? (
          <div className="text-center space-y-8 max-w-md">
            {/* Searching Animation */}
            <div className="space-y-4">
              <div className="flex justify-center">
                <div className="relative w-16 h-16">
                  <div className="absolute inset-0 bg-indigo-200 rounded-full animate-pulse"></div>
                  <div className="absolute inset-2 bg-white rounded-full flex items-center justify-center">
                    <Zap className="text-indigo-600" size={24} />
                  </div>
                </div>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  Searching for nearby drivers…
                </h2>
                <p className="text-sm text-slate-600 mt-3">
                  We're looking for available drivers near your pickup location.
                </p>
              </div>
            </div>

            {/* Retry Count */}
            {retryCount > 0 && (
              <div className="text-xs text-slate-500 font-medium">
                Attempt {retryCount + 1}
              </div>
            )}
          </div>
        ) : (
          /* NO DRIVERS FOUND - Show options */
          <div className="w-full max-w-md space-y-6">
            {/* Alert Box */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-6 shadow-sm">
              <div className="flex gap-3">
                <AlertCircle
                  className="text-amber-600 flex-shrink-0 mt-0.5"
                  size={24}
                />
                <div className="text-left">
                  <p className="font-semibold text-amber-950 text-lg">
                    No drivers available right now
                  </p>
                  <p className="text-sm text-amber-800 mt-2 leading-relaxed">
                    Unfortunately, we couldn't find available drivers in your
                    area at this moment. Try again or select a different
                    provider.
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              {/* Retry Same Provider Button */}
              <button
                onClick={handleRetry}
                disabled={isRetrying}
                className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
              >
                <RotateCcw size={18} />
                {isRetrying ? "Retrying…" : "Retry with Same Provider"}
              </button>

              {/* Different Provider Button */}
              <button
                onClick={handleChangeTenant}
                disabled={isRetrying}
                className="w-full px-6 py-3 bg-white border-2 border-indigo-600 text-indigo-600 rounded-lg hover:bg-indigo-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold"
              >
                Choose Different Provider
              </button>
            </div>

            {/* Help Text */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
              <p className="text-xs text-blue-700 font-medium mb-2">💡 Tip:</p>
              <ul className="text-xs text-blue-700 space-y-1">
                <li>• Retry to check for newly available drivers</li>
                <li>• Try a different provider for more options</li>
                <li>• Consider adjusting your pickup time</li>
              </ul>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800 font-medium text-sm">{error}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

import { useDriver } from "../../context/DriverContext";
import { useState, useEffect } from "react";

function TripRequestsList() {
  const {
    tripRequests,
    tripRequestsLoading,
    acceptTrip,
    rejectTrip,
    loadTripRequests,
  } = useDriver();

  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState(null);

  // Auto-poll trip requests every 3 seconds
  useEffect(() => {
    const pollInterval = setInterval(() => {
      loadTripRequests();
    }, 3000);

    return () => clearInterval(pollInterval);
  }, [loadTripRequests]);

  if (tripRequestsLoading) {
    return <div>Loading trip requests...</div>;
  }
  console.log("tripRequests:", tripRequests);

  const handleAccept = async (t) => {
    try {
      setMessage(null);
      await acceptTrip({
        trip_request_id: t.trip_request_id,
        batch_id: t.batch_id,
      });
      setMessage("Trip accepted successfully!");
      setMessageType("success");
    } catch (err) {
      console.error("Accept trip error:", err);
      // Check for race condition error
      if (
        err.errorCode === "TRIP_ALREADY_ACCEPTED" ||
        err.message?.includes("another driver")
      ) {
        setMessage("This trip was accepted by another driver");
        setMessageType("info");
      } else {
        setMessage(err.message || "Failed to accept trip");
        setMessageType("error");
      }
    }
  };

  const handleReject = async (t) => {
    try {
      setMessage(null);
      await rejectTrip({
        trip_request_id: t.trip_request_id,
        batch_id: t.batch_id,
      });
      setMessage("Trip rejected");
      setMessageType("info");
    } catch (err) {
      console.error("Reject trip error:", err);
      setMessage(err.message || "Failed to reject trip");
      setMessageType("error");
    }
  };

  return (
    <div className="p-4 border rounded-lg bg-white mt-4">
      <h3 className="font-semibold mb-3">Trip Requests</h3>

      {message && (
        <div
          className={`p-3 rounded mb-4 text-sm ${
            messageType === "success"
              ? "bg-green-100 text-green-800"
              : messageType === "info"
                ? "bg-blue-100 text-blue-800"
                : "bg-red-100 text-red-800"
          }`}
        >
          {message}
        </div>
      )}

      {tripRequests.length === 0 ? (
        <div className="text-gray-500">No trip requests at the moment.</div>
      ) : (
        <div className="space-y-3">
          {tripRequests.map((t) => (
            <div
              key={`${t.trip_request_id}-${t.batch_id}`}
              className="p-3 border rounded flex items-center justify-between"
            >
              <div>
                <div className="font-semibold">
                  Trip Request #{t.trip_request_id}
                </div>
                <div className="text-sm text-gray-600">Batch #{t.batch_id}</div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleReject(t)}
                  className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
                >
                  Reject
                </button>

                <button
                  onClick={() => handleAccept(t)}
                  className="px-3 py-1 bg-emerald-500 text-white rounded hover:bg-emerald-600"
                >
                  Accept
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default TripRequestsList;

import { useDriver } from "../../context/DriverContext";

function TripRequestsList() {
  const {
    tripRequests,
    tripRequestsLoading,
    acceptTrip,
    rejectTrip,
  } = useDriver();

  if (tripRequestsLoading) {
    return <div>Loading trip requests...</div>;
  }
  console.log("tripRequests:",tripRequests);

  return (
    <div className="p-4 border rounded-lg bg-white mt-4">
      <h3 className="font-semibold mb-3">Trip Requests</h3>

      {tripRequests.length === 0 ? (
        <div className="text-gray-500">
          No trip requests at the moment.
        </div>
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
                <div className="text-sm text-gray-600">
                  Batch #{t.batch_id}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() =>
                    rejectTrip({
                      trip_request_id: t.trip_request_id,
                      batch_id: t.batch_id,
                    })
                  }
                  className="px-3 py-1 bg-gray-200 rounded"
                >
                  Reject
                </button>

                <button
                  onClick={() =>
                    acceptTrip({
                      trip_request_id: t.trip_request_id,
                      batch_id: t.batch_id,
                    })
                  }
                  className="px-3 py-1 bg-emerald-500 text-white rounded"
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

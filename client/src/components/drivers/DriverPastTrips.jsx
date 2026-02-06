// components/drivers/DriverPastTripsTable.jsx

import Loader from "../common/Loader";

export default function DriverPastTrips({driver, trips, loading }) {
  if (loading) return <Loader />;

  if (!trips || trips.length === 0) {
    return (
      <p className="text-sm text-slate-500">
        No past trips found.
      </p>
    );
  }

  return (
    <div className="bg-white border rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-slate-100">
          <tr>
            <th className="p-3 text-left">Trip ID</th>
            <th className="p-3 text-left">Date</th>
            <th className="p-3 text-left">Pickup</th>
            <th className="p-3 text-left">Drop</th>
            <th className="p-3 text-left">Total Fare</th>
            
            <th className="p-3 text-left">Your Earning</th>
            <th className="p-3 text-left">Payment</th>
          </tr>
        </thead>

        <tbody>
          {trips.map((t) => (
            <tr key={t.trip_id} className="border-t align-top">
              <td className="p-3">{t.trip_id}</td>

              <td className="p-3">
                {t.end_time
                  ? new Date(t.end_time).toLocaleString()
                  : "-"}
              </td>

              <td className="p-3 max-w-xs truncate">
                {t.pickup_address || "-"}
              </td>

              <td className="p-3 max-w-xs truncate">
                {t.drop_address || "-"}
              </td>

              <td className="p-3">
                ₹{t.payment_details?.total_fare ?? 0}
              </td>

              <td className="p-3 text-green-600">
                ₹{t.payment_details?.driver_earning ?? 0}
              </td>

              <td className="p-3 capitalize">
                {t.payment_details?.payment_method ?? "pending"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

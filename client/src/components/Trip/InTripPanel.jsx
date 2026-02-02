import React from 'react';

export default function InTripPanel({ tripStatusData, onViewReceipt }) {
  if (!tripStatusData) return null;

  const status = tripStatusData.status;
  const assigned = tripStatusData.assigned_info;

  return (
    <div className="p-4 border rounded-md bg-white">
      <div className="flex items-center justify-between mb-2">
        <div className="font-semibold">Trip: {tripStatusData.trip_request_id}</div>
        <div className="text-sm text-gray-600">Status: <span className="font-semibold">{status}</span></div>
      </div>

      {assigned && (
        <div className="text-sm text-gray-700 mb-2">Driver #{assigned.driver_id} — ETA: {assigned.eta_minutes ?? '—'} min</div>
      )}

      <div className="flex gap-2">
        {status === 'driver_assigned' && (
          <button className="px-3 py-1 bg-amber-500 text-white rounded">Track Driver</button>
        )}

        {status === 'picked_up' && (
          <button className="px-3 py-1 bg-indigo-600 text-white rounded">Trip in progress</button>
        )}

        {status === 'completed' && (
          <button onClick={() => onViewReceipt && onViewReceipt(tripStatusData.assigned_info?.trip_id)} className="px-3 py-1 bg-emerald-500 text-white rounded">View Receipt</button>
        )}
      </div>
    </div>
  );
}

import React from 'react';

export default function DriverCard({ assignedInfo, onShowOnMap }) {
  if (!assignedInfo) return null;

  const { driver_id, driver_phone, eta_minutes, driver_lat, driver_lng } = assignedInfo;

  return (
    <div className="p-4 border rounded-lg bg-white mb-3">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-semibold">Driver #{driver_id}</div>
          <div className="text-sm text-gray-600">ETA: {eta_minutes != null ? `${eta_minutes} min` : '—'}</div>
          <div className="text-sm text-gray-600">Phone: {driver_phone || '—'}</div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <button className="px-3 py-1 bg-emerald-500 text-white rounded">Call</button>
          <button
            onClick={() => onShowOnMap && onShowOnMap({ lat: driver_lat, lng: driver_lng })}
            className="px-3 py-1 bg-gray-200 rounded text-sm"
            disabled={!driver_lat || !driver_lng}
          >
            Show on map
          </button>
        </div>
      </div>
    </div>
  );
}

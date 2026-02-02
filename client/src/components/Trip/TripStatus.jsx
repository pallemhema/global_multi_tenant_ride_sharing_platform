import React, { useState } from 'react';
import useTripPoller from '../../hooks/useTripPoller';
import DriverCard from './DriverCard';
import OTPPanel from './OTPPanel';
import InTripPanel from './InTripPanel';
import ReceiptView from './ReceiptView';

export default function TripStatus({ tripRequestId, onStatusChange, onShowOnMap }) {
  const { data, error, isPolling, start, stop } = useTripPoller(tripRequestId, {
    interval: 3000,
    enabled: true,
    onStatusChange: (status, resp) => {
      if (typeof onStatusChange === 'function') onStatusChange(status, resp);
    },
  });

  const [showReceiptForTrip, setShowReceiptForTrip] = useState(null);

  if (!tripRequestId) return null;

  const status = data?.status;
  const assigned = data?.assigned_info;

  return (
    <div className="mb-6">
      <h3 className="text-lg font-semibold mb-2">Trip Status</h3>
      {!data && <div className="text-sm text-gray-600">Waiting for updates…</div>}
      {error && <div className="text-sm text-red-600">Error polling status — retrying with backoff</div>}

      {data && (
        <div className="space-y-3">
          <div className="p-4 border rounded-md bg-white">
            <div className="text-sm text-gray-700">Status: <span className="font-semibold">{status}</span></div>
            <div className="text-sm text-gray-600">Estimated distance: {data?.estimated_distance_km ? data.estimated_distance_km.toFixed(2) + ' km' : '—'}</div>
            <div className="text-sm text-gray-600">Estimated duration: {data?.estimated_duration_minutes ? data.estimated_duration_minutes + ' min' : '—'}</div>
          </div>

          {/* DRIVER CARD + OTP (dev) */}
          {status === 'driver_assigned' && (
            <div>
              <DriverCard assignedInfo={assigned} onShowOnMap={(pos) => onShowOnMap && onShowOnMap(pos)} />
              <OTPPanel tripRequestId={tripRequestId} />
            </div>
          )}

          {/* In-Trip panel (tracking/receipt) */}
          <InTripPanel tripStatusData={data} onViewReceipt={(tripId) => setShowReceiptForTrip(tripId)} />

          {/* Receipt area (shown when trip id available and user clicks view) */}
          {showReceiptForTrip && <ReceiptView tripId={showReceiptForTrip} />}
        </div>
      )}

      <div className="mt-3 flex gap-2">
        <button className="px-3 py-1 bg-gray-200 rounded" onClick={() => stop()}>Stop</button>
        <button className="px-3 py-1 bg-gray-200 rounded" onClick={() => start()}>Start</button>
      </div>
    </div>
  );
}

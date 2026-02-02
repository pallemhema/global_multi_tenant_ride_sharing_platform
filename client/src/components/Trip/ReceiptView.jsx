import React, { useEffect, useState } from 'react';
import { getTripReceipt } from '../../services/tripApi';

export default function ReceiptView({ tripId }) {
  const [receipt, setReceipt] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!tripId) return;
    setLoading(true);
    getTripReceipt(tripId)
      .then((r) => setReceipt(r))
      .catch((e) => {
        console.error('getTripReceipt failed', e);
        alert('Failed to load receipt');
      })
      .finally(() => setLoading(false));
  }, [tripId]);

  if (!tripId) return null;

  return (
    <div className="p-4 border rounded-md bg-white">
      <h4 className="font-semibold mb-2">Receipt</h4>
      {loading && <div className="text-sm text-gray-600">Loading…</div>}
      {receipt && (
        <div className="text-sm text-gray-700">
          <div>Trip ID: {receipt.trip_id}</div>
          <div>Distance: {receipt.distance_km} km</div>
          <div>Duration: {receipt.duration_minutes} min</div>
          <div className="mt-2 font-semibold">Total: {receipt.fare?.total} {receipt.fare?.currency}</div>
        </div>
      )}
    </div>
  );
}

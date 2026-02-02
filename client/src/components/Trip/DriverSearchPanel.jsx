import React, { useState } from 'react';
import { startDriverSearch } from '../../services/tripApi';

export default function DriverSearchPanel({ tripRequestId, onSearchStarted }) {
  const [starting, setStarting] = useState(false);
  const [resp, setResp] = useState(null);
  const [error, setError] = useState(null);

  if (!tripRequestId) return null;

  const handleStartSearch = async () => {
    setStarting(true);
    try {
      const r = await startDriverSearch(tripRequestId);
      setResp(r);
      setError(null);
      if (onSearchStarted) onSearchStarted(r);
    } catch (err) {
      setError(err);
      console.error('startDriverSearch failed', err);
      alert('Failed to start driver search');
    } finally {
      setStarting(false);
    }
  };

  return (
    <div className="mb-6">
      <h3 className="text-lg font-semibold mb-2">Driver Search</h3>
      <div className="flex items-center gap-3">
        <button
          onClick={handleStartSearch}
          disabled={starting}
          className="px-4 py-2 bg-amber-500 text-white rounded-md"
        >
          {starting ? 'Starting…' : 'Start Driver Search'}
        </button>
        {resp && <div className="text-sm text-gray-700">Notified {resp.drivers_notified} drivers (batch {resp.batch_number})</div>}
        {error && <div className="text-sm text-red-600">Failed to start</div>}
      </div>
    </div>
  );
}

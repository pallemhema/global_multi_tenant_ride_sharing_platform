import React, { useEffect, useState } from 'react';
import { useDriver } from '../../context/DriverContext';
import { driverApi } from '../../services/driverApi';

export default function DriverOffers() {
  const { driverId } = useDriver();
  const [offers, setOffers] = useState([]); // {trip_request_id, batch_id, received_at}
  const [ws, setWs] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!driverId) return;

    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const host = window.location.hostname;
    const port = window.location.port || '8000';
    const url = `${protocol}://${host}:${port}/api/v1/driver/ws/driver/${driverId}`;

    const socket = new WebSocket(url);
    setWs(socket);

    socket.addEventListener('message', (evt) => {
      try {
        const data = JSON.parse(evt.data);
        // expected data: { trip_request_id, batch_id }
        setOffers((o) => [{ ...data, received_at: Date.now() }, ...o]);
      } catch (err) {
        console.error('Invalid driver ws message', err);
      }
    });

    socket.addEventListener('open', () => console.log('Driver WS connected'));
    socket.addEventListener('close', () => console.log('Driver WS closed'));

    return () => {
      socket.close();
    };
  }, [driverId]);

  const handleRespond = async (offer, response) => {
    setLoading(true);
    try {
      const res = await driverApi.respondToOffer(offer.trip_request_id, offer.batch_id, response);
      alert(`Response: ${res.response}`);
      // On accept, remove from offers and optionally show assignment elsewhere
      setOffers((o) => o.filter((x) => x.batch_id !== offer.batch_id || x.trip_request_id !== offer.trip_request_id));
    } catch (err) {
      console.error('respondToOffer failed', err);
      alert('Failed to respond to offer');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg bg-white">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold">Incoming Offers</h3>
        <div className="text-sm text-gray-500">Live via WS</div>
      </div>

      {offers.length === 0 && <div className="text-sm text-gray-500">No active offers</div>}

      <div className="space-y-3">
        {offers.map((o) => (
          <div key={`${o.trip_request_id}-${o.batch_id}`} className="p-3 border rounded flex items-center justify-between">
            <div>
              <div className="font-semibold">Trip Request #{o.trip_request_id}</div>
              <div className="text-sm text-gray-600">Batch #{o.batch_id}</div>
            </div>

            <div className="flex gap-2">
              <button disabled={loading} onClick={() => handleRespond(o, 'rejected')} className="px-3 py-1 bg-gray-200 rounded">Reject</button>
              <button disabled={loading} onClick={() => handleRespond(o, 'accepted')} className="px-3 py-1 bg-emerald-500 text-white rounded">Accept</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

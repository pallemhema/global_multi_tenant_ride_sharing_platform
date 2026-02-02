// src/components/Trip/TripCreator.jsx
import React, { useEffect, useState } from 'react';
import OSMMap from '../Map/OSMMap';
import { requestTrip } from '../../services/tripApi';
import { reverseGeocode } from '../../utils/reverseGeoCode';
export default function TripCreator({ onCreated }) {
  const [pickup, setPickup] = useState(null);
  const [dropoff, setDropoff] = useState(null);

  const [pickupAddress, setPickupAddress] = useState('');
  const [dropoffAddress, setDropoffAddress] = useState('');

  const [requesting, setRequesting] = useState(false);

  // 🔁 reverse geocode pickup
  useEffect(() => {
    if (!pickup) return;
    reverseGeocode(pickup.lat, pickup.lng).then(setPickupAddress);
  }, [pickup]);

  // 🔁 reverse geocode drop
  useEffect(() => {
    if (!dropoff) return;
    reverseGeocode(dropoff.lat, dropoff.lng).then(setDropoffAddress);
  }, [dropoff]);

  const handleRequest = async () => {
    if (!pickup || !dropoff) {
      alert('Please set pickup and dropoff');
      return;
    }

    setRequesting(true);
    try {
      const payload = {
        pickup_lat: +pickup.lat,
        pickup_lng: +pickup.lng,
        pickup_address: pickupAddress,
        drop_lat: +dropoff.lat,
        drop_lng: +dropoff.lng,
        drop_address: dropoffAddress,
      };

      const resp = await requestTrip(payload);
      onCreated?.(resp);
    } catch (err) {
      console.error('requestTrip failed', err);
      alert('Failed to create trip request');
    } finally {
      setRequesting(false);
    }
  };

  return (
    <div className="mb-8">
      <h2 className="text-xl font-semibold mb-4">Set pickup & dropoff</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* PICKUP */}
        <div>
          <p className="text-sm font-medium text-gray-700 mb-1">From</p>
          <input
            value={pickupAddress}
            readOnly
            placeholder="Select pickup on map"
            className="w-full mb-2 p-2 border rounded bg-gray-100"
          />
          <OSMMap onChange={setPickup} />
        </div>

        {/* DROPOFF */}
        <div>
          <p className="text-sm font-medium text-gray-700 mb-1">To</p>
          <input
            value={dropoffAddress}
            readOnly
            placeholder="Select dropoff on map"
            className="w-full mb-2 p-2 border rounded bg-gray-100"
          />
          <OSMMap onChange={setDropoff} />
        </div>
      </div>

      <div className="mt-4">
        <button
          onClick={handleRequest}
          disabled={!pickup || !dropoff || requesting}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg disabled:opacity-50"
        >
          {requesting ? 'Requesting…' : 'Request Ride'}
        </button>
      </div>
    </div>
  );
}

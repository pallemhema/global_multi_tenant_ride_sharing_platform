import React, { useEffect, useState } from 'react';
import { useDriver } from '../../context/DriverContext';
import { driverApi } from '../../services/driverApi';

export default function DriverLocationTracker() {
  const { activeShift, runtimeStatus } = useDriver();
  const [watchId, setWatchId] = useState(null);
  const [tracking, setTracking] = useState(false);
  const [position, setPosition] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    // auto-start tracking when driver goes online
    if (activeShift?.shift_status === 'online' && !tracking) {
      startTracking();
    }
    // stop if shift ends
    if (activeShift?.shift_status !== 'online' && tracking) {
      stopTracking();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeShift?.shift_status]);

  useEffect(() => {
    return () => {
      if (watchId !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [watchId]);

  const startTracking = async () => {
    if (!('geolocation' in navigator)) {
      setError('Geolocation not available');
      return;
    }

    setError(null);

    const id = navigator.geolocation.watchPosition(
      async (pos) => {
        const coords = { latitude: pos.coords.latitude, longitude: pos.coords.longitude, accuracy: pos.coords.accuracy, timestamp: pos.timestamp };
        setPosition(coords);

        // Send to server: update GEO (for rider discovery) and heartbeat
        try {
          await driverApi.sendLocation({ latitude: coords.latitude, longitude: coords.longitude });
          // also best-effort heartbeat store
          await driverApi.sendLocationHeartbeat({ latitude: coords.latitude, longitude: coords.longitude, timestamp: coords.timestamp, accuracy: coords.accuracy });
        } catch (err) {
          console.warn('Failed to send location', err);
        }
      },
      (err) => {
        setError(err.message || 'Failed to get position');
      },
      {
        enableHighAccuracy: true,
        maximumAge: 2000,
        timeout: 5000,
      }
    );

    setWatchId(id);
    setTracking(true);
  };

  const stopTracking = () => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }
    setTracking(false);
  };

  return (
    <div className="mt-4 p-3 border rounded bg-white">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-semibold">Location Tracking</div>
          <div className="text-sm text-gray-600">Status: {tracking ? 'Tracking' : 'Stopped'}</div>
        </div>
        <div className="flex gap-2">
          {!tracking ? (
            <button onClick={startTracking} className="px-3 py-1 bg-emerald-500 text-white rounded">Start</button>
          ) : (
            <button onClick={stopTracking} className="px-3 py-1 bg-gray-200 rounded">Stop</button>
          )}
        </div>
      </div>

      <div className="mt-2 text-sm text-gray-600">{position ? `Lat: ${position.latitude.toFixed(6)}, Lng: ${position.longitude.toFixed(6)}` : 'No position yet'}</div>
      {error && <div className="text-sm text-red-600">{error}</div>}
    </div>
  );
}
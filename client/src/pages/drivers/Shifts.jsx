import { useState } from 'react';
import {
  Clock,
  Play,
  StopCircle,
  AlertCircle,
  Calendar,
  MapPin,
} from 'lucide-react';

import { useDriver } from '../../context/DriverContext';
import Loader from '../../components/common/Loader';
import { getCurrentPositionPromise } from '../../utils/location';
import useHeartbeat from '../../hooks/useHeartbeat';

export default function Shifts() {
  const {
    driver,
    activeShift,
    runtimeStatus,
    can_start_shift,
    loading: contextLoading,
    startShift,
    endShift,
  } = useDriver();
console.log(can_start_shift)
  // 🔁 Send location heartbeat ONLY when shift is online
  useHeartbeat({
    enabled: activeShift?.shift_status === 'online',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  /* ---------------- HELPERS ---------------- */

  const isOnline = activeShift?.shift_status === 'online';
  const runtime = runtimeStatus?.runtime_status;

  const formatTime = iso =>
    iso
      ? new Date(iso).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        })
      : 'N/A';

  const currentDuration = () => {
    if (!activeShift?.started_at) return 'N/A';
    const start = new Date(activeShift.started_at);
    const now = new Date();
    const diff = now - start;
    const h = Math.floor(diff / (1000 * 60 * 60));
    const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${h}h ${m}m`;
  };

  /* ---------------- ACTIONS ---------------- */

  const handleStartShift = async () => {
    try {
      setLoading(true);
      setError('');

      // 1️⃣ Location permission is mandatory
      let pos;
      try {
        pos = await getCurrentPositionPromise({ timeout: 15000 });
      } catch (err) {
        if (err.message === 'permission_denied') {
          setError('Location access is required to go online.');
          return;
        }
        setError('Unable to fetch location. Please try again.');
        return;
      }

      // 2️⃣ Start shift with initial location
      await startShift({
        latitude: pos.latitude,
        longitude: pos.longitude,
      });
    } catch (err) {
      setError(err.message || 'Failed to start shift');
    } finally {
      setLoading(false);
    }
  };

  const handleEndShift = async () => {
    if (!window.confirm('Are you sure you want to go offline?')) return;

    try {
      setLoading(true);
      setError('');
      await endShift();
    } catch (err) {
      setError(err.message || 'Failed to end shift');
    } finally {
      setLoading(false);
    }
  };

  if (contextLoading) return <Loader />;

  /* ---------------- UI ---------------- */

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-bold">Shifts</h1>
        <p className="text-slate-600">
          Control your availability and working hours
        </p>
      </div>

      {/* ERROR */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
          <AlertCircle className="text-red-600" />
          <span className="text-sm text-red-700">{error}</span>
        </div>
      )}

      {/* CURRENT SHIFT CARD */}
      <div
        className={`rounded-lg border p-8 ${
          isOnline
            ? 'bg-green-50 border-green-200'
            : 'bg-slate-50 border-slate-200'
        }`}
      >
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold mb-2">Current Status</h2>

            <div className="flex items-center gap-2">
              <span
                className={`w-3 h-3 rounded-full ${
                  isOnline ? 'bg-green-500' : 'bg-slate-400'
                }`}
              />

              <span className="font-semibold">
                {isOnline
                  ? runtime === 'available'
                    ? 'Available for trips'
                    : runtime === 'on_trip'
                    ? 'On Trip'
                    : 'Unavailable'
                  : 'Offline'}
              </span>
            </div>
          </div>

          {/* START / END BUTTON */}
          {isOnline ? (
            <button
              onClick={handleEndShift}
              disabled={loading || runtime === 'on_trip'}
              className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              <StopCircle size={20} /> End Shift
            </button>
          ) : (
            <button
              onClick={handleStartShift}
              disabled={loading || !can_start_shift}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium ${
                !can_start_shift
                  ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              <Play size={20} /> Start Shift
            </button>
          )}
        </div>

        {/* WHY START IS DISABLED */}
        {!isOnline && !can_start_shift && (
          <div className="mt-3 text-sm text-red-600 flex gap-2">
            <AlertCircle size={16} />
            <span>
              {driver?.driver_type === 'fleet_driver'
                ? 'Fleet drivers must be assigned a vehicle to start a shift.'
                : 'You must have at least one approved vehicle to start a shift.'}
            </span>
          </div>
        )}

        {/* CANNOT END DURING TRIP */}
        {isOnline && runtime === 'on_trip' && (
          <div className="mt-3 text-sm text-red-600 flex gap-2">
            <AlertCircle size={16} />
            <span>You must complete the trip before going offline.</span>
          </div>
        )}

        {/* SHIFT DETAILS */}
        {isOnline && (
          <div className="space-y-2 text-sm mt-4">
            <p>
              <b>Started at:</b> {formatTime(activeShift.started_at)}
            </p>
            <p>
              <b>Duration:</b> {currentDuration()}
            </p>
            <p className="flex items-center gap-2 text-slate-600">
              <MapPin size={14} />
              Live location sharing enabled
            </p>
          </div>
        )}
      </div>

      {/* SHIFT HISTORY (PLACEHOLDER) */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold flex gap-2 items-center">
          <Calendar size={18} /> Recent Shifts
        </h3>

        <div className="text-center py-8">
          <Clock className="mx-auto text-slate-400 mb-3" size={36} />
          <p className="text-slate-600">No shift history available</p>
        </div>
      </div>

      {/* TIPS */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-semibold mb-3">Shift Tips</h3>
        <ul className="text-sm space-y-2">
          <li>• Location access is mandatory to go online</li>
          <li>• Trips are assigned only when available</li>
          <li>• You cannot go offline during a trip</li>
          <li>• Ending shift stops location tracking</li>
        </ul>
      </div>
    </div>
  );
}

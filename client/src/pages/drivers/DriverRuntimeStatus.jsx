import { AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { useDriver } from '../../context/DriverContext';

export default function DriverRuntimeStatus() {
  const { activeShift, runtimeStatus } = useDriver();

  /* ---------------- NO ACTIVE SHIFT ---------------- */
  if (!activeShift?.is_active) {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">
          Runtime Status
        </h3>
        <div className="text-center py-4">
          <Clock className="mx-auto text-slate-400 mb-2" size={32} />
          <p className="text-sm text-slate-600">
            Runtime status is only available during an active shift
          </p>
        </div>
      </div>
    );
  }

  /* ---------------- BADGE ---------------- */
  const getRuntimeStatusBadge = status => {
    switch (status) {
      case 'available':
        return (
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-green-100">
            <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse" />
            <span className="text-sm font-medium text-green-800">
              Available
            </span>
          </div>
        );
      case 'on_trip':
        return (
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100">
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
            <span className="text-sm font-medium text-blue-800">
              On Trip
            </span>
          </div>
        );
      case 'unavailable':
        return (
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-100">
            <div className="w-2 h-2 bg-yellow-600" />
            <span className="text-sm font-medium text-yellow-800">
              Unavailable
            </span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100">
            <span className="text-sm font-medium text-slate-800">
              Unknown
            </span>
          </div>
        );
    }
  };

  const status = runtimeStatus?.status;

  /* ---------------- UI ---------------- */
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">
            Runtime Status
          </h3>
          <p className="text-sm text-slate-600">
            Your current status while on duty
          </p>
        </div>

        {getRuntimeStatusBadge(status)}
      </div>

      {!runtimeStatus ? (
        <div className="bg-slate-50 rounded p-4 text-sm text-slate-600 flex gap-2">
          <AlertCircle size={18} className="text-slate-400" />
          Runtime status is not available right now
        </div>
      ) : (
        <div className="space-y-3">
          <div className="bg-slate-50 rounded p-4">
            <p className="text-xs text-slate-600 uppercase font-semibold mb-1">
              Current Status
            </p>
            <p className="text-lg font-medium text-slate-900">
              {status === 'available'
                ? 'Ready to Accept Rides'
                : status === 'on_trip'
                ? 'On an Active Trip'
                : 'Temporarily Unavailable'}
            </p>
          </div>

          {status === 'on_trip' && runtimeStatus.current_trip && (
            <div className="bg-blue-50 border border-blue-200 rounded p-4">
              <h4 className="font-medium text-blue-900 mb-2 text-sm">
                Active Trip
              </h4>
              <div className="space-y-1 text-sm text-blue-800">
                <p>
                  <span className="font-medium">Passenger:</span>{' '}
                  {runtimeStatus.current_trip.passenger_name}
                </p>
                <p>
                  <span className="font-medium">Pickup:</span>{' '}
                  {runtimeStatus.current_trip.pickup_location}
                </p>
                <p>
                  <span className="font-medium">Dropoff:</span>{' '}
                  {runtimeStatus.current_trip.dropoff_location}
                </p>
              </div>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded p-4 flex items-start gap-3">
            <CheckCircle2
              className="text-blue-600 flex-shrink-0 mt-0.5"
              size={18}
            />
            <div>
              <h4 className="font-medium text-blue-900 mb-1 text-sm">
                About Runtime Status
              </h4>
              <ul className="space-y-1 text-xs text-blue-800">
                <li>• Changes automatically based on trip activity</li>
                <li>• Available: Ready to receive new ride requests</li>
                <li>• On Trip: Currently transporting a passenger</li>
                <li>• Unavailable: Temporarily not accepting rides</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

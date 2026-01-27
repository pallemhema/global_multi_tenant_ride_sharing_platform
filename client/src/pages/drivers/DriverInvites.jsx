import { AlertCircle, AlertTriangle } from 'lucide-react';
import { useDriver } from '../../../context/DriverContext';
import Loader from '../../../components/common/Loader';

export default function DriverInvites() {
  const {
    driver,
    invites,
    invitesLoading,
  } = useDriver();

  // Only for fleet drivers
  if (!driver || driver.driver_type !== 'fleet_driver') {
    return null;
  }

  if (invitesLoading) {
    return <Loader />;
  }

  return (
    <div className="space-y-4">
      {/* HEADER */}
      <div>
        <h3 className="text-lg font-semibold text-slate-900">
          Fleet Owner Invitations
        </h3>
        <p className="text-sm text-slate-600">
          Invitations from fleet owners to join their fleet
        </p>
      </div>

      {/* INVITES */}
      {invites.length === 0 ? (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
          <AlertCircle className="mx-auto text-blue-600 mb-3" size={32} />
          <h4 className="font-medium text-blue-900 mb-2">
            Waiting for Fleet Owner Invitation
          </h4>
          <p className="text-sm text-blue-800 mb-4">
            You are registered as a fleet driver but haven’t received any invitations yet.
          </p>
          <p className="text-xs text-blue-700">
            Share your driver ID ({driver.driver_id}) with fleet owners.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {invites.map(invite => (
            <div
              key={invite.id}
              className="bg-white border rounded-lg p-4"
            >
              <p className="font-medium text-slate-900">
                Fleet: {invite.fleet_name}
              </p>
              <p className="text-sm text-slate-600">
                Invited on{' '}
                {new Date(invite.created_at).toLocaleDateString()}
              </p>

              {/* future actions */}
              {/* Accept / Reject buttons will go here */}
            </div>
          ))}
        </div>
      )}

      {/* INFO */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3">
        <AlertTriangle className="text-amber-700" size={18} />
        <p className="text-sm text-amber-800">
          You can start shifts only after a fleet owner assigns you a vehicle.
        </p>
      </div>
    </div>
  );
}

import { CheckCircle, XCircle, Mail, AlertCircle } from "lucide-react";
import { useDriver } from "../../context/DriverContext";

export default function DriverInvitesFromFleets() {
  const { driver, invites, acceptInvite, rejectInvite, loading } = useDriver();
  console.log(driver?.driver_type)
  console.log("invites:",invites)

  // 🔒 Safety: only fleet drivers
  if (driver?.driver_type !== "fleet_driver") {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 flex gap-3">
        <AlertCircle className="text-red-600" />
        <p className="text-red-800 font-semibold">
          Fleet invitations are only available for fleet drivers.
        </p>
      </div>
    );
  }

  if (loading) {
    return <p className="text-gray-500">Loading invitations...</p>;
  }

  const statusStyles = {
    sent: "bg-yellow-100 text-yellow-800",
    accepted: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <Mail className="text-indigo-600" />
          Fleet Invitations
        </h1>
        <p className="text-gray-600 mt-1">
          Invitations from fleet owners to join their fleet
        </p>
      </div>

      {/* Empty State */}
      {invites.length === 0 ? (
        <div className="bg-white border rounded-lg p-8 text-center">
          <Mail className="mx-auto text-gray-300 mb-3" size={48} />
          <p className="text-gray-600 font-medium">
            No fleet invitations available
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {invites.map((invite) => (
            <div
              key={invite.invite_id}
              className="bg-white border rounded-lg p-5 shadow-sm"
            >
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-semibold text-gray-900">
                    Fleet Owner ID: {invite.fleet_owner_id}
                  </p>
                  <p className="text-sm text-gray-500">
                    Sent on{" "}
                    {new Date(invite.invited_at_utc).toLocaleDateString()}
                  </p>
                </div>

                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    statusStyles[invite.invite_status]
                  }`}
                >
                  {invite.invite_status.toUpperCase()}
                </span>
              </div>

              {/* Actions */}
              {invite.invite_status === "sent" && (
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={() => acceptInvite(invite.invite_id)}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                  >
                    <CheckCircle size={16} />
                    Accept
                  </button>

                  <button
                    onClick={() => rejectInvite(invite.invite_id)}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                  >
                    <XCircle size={16} />
                    Reject
                  </button>
                </div>
              )}

              {invite.invite_status === "accepted" && (
                <div className="mt-4 bg-green-50 border border-green-200 rounded p-3 text-sm text-green-700">
                  ✓ You are now part of this fleet
                </div>
              )}

              {invite.invite_status === "rejected" && (
                <div className="mt-4 bg-red-50 border border-red-200 rounded p-3 text-sm text-red-700">
                  ✗ You rejected this invitation
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

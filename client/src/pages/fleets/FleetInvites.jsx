import { useState } from "react";
import { Users, Send, Trash2, AlertCircle } from "lucide-react";

import { useFleetOwner } from "../../context/FleetOwnerContext";

export default function FleetInvites() {
  const {
    fleetOwner,
    eligibleDrivers,
    invites,
    inviteDriver,
    cancelInvite,
    loading,
  } = useFleetOwner();

  const [invitingDriverId, setInvitingDriverId] = useState(null);
  console.log(invites)

  /* =====================
     HANDLERS
  ===================== */

  const handleInvite = async (driverId) => {
    try {
      setInvitingDriverId(driverId);
      await inviteDriver(driverId);
    } catch (err) {
      alert(err.message || "Failed to send invite");
    } finally {
      setInvitingDriverId(null);
    }
  };

  const handleCancelInvite = async(driverId) =>{
    try{
      await cancelInvite(driverId)
    }catch (err) {
      alert(err.message || "Failed to cancel invite");
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "accepted":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "sent":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  /* =====================
     LOADING / BLOCKED
  ===================== */

  if (loading) {
    return <p className="text-gray-600">Loading...</p>;
  }

  if (fleetOwner?.approval_status === "pending") {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <AlertCircle className="text-yellow-600 inline mr-2" />
        <p className="text-yellow-800 font-semibold">
          Fleet approval pending
        </p>
        <p className="text-sm text-yellow-700 mt-1">
          You can invite drivers only after admin approval.
        </p>
      </div>
    );
  }

  /* =====================
     UI
  ===================== */

  return (
    <div className="space-y-10">

      {/* =====================
          ELIGIBLE DRIVERS
      ===================== */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <Users size={22} className="text-purple-600" />
          Eligible Fleet Drivers
        </h2>

        {eligibleDrivers.length === 0 ? (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
            <AlertCircle className="text-amber-600 inline mr-2" />
            <p className="text-amber-800 font-semibold">
              No drivers available to invite
            </p>
            <p className="text-sm text-amber-700 mt-1">
              Make sure you have at least one approved vehicle and that drivers
              are not already assigned to another fleet or invited.
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {eligibleDrivers.map((driver) => (
              <div
                key={driver.driver_id}
                className="border rounded-lg p-4 flex justify-between items-center"
              >
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {driver.full_name || "Unnamed Driver"}
                  </h3>
                  <p className="text-sm text-gray-600">
                    📞 {driver.phone_e164}
                  </p>
                  <p className="text-xs text-gray-400">
                    Driver ID: {driver.driver_id}
                  </p>
                </div>

                <button
                  onClick={() => handleInvite(driver.driver_id)}
                  disabled={invitingDriverId === driver.driver_id}
                  className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50"
                >
                  <Send size={16} />
                  {invitingDriverId === driver.driver_id
                    ? "Inviting..."
                    : "Send Invite"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* =====================
          INVITATIONS
      ===================== */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-4">
          Invitations ({invites.length})
        </h2>

        {invites.length === 0 ? (
          <p className="text-gray-600">No invitations sent yet.</p>
        ) : (
          <div className="grid gap-4">
            {invites.map((invite) => (
              <div
                key={invite.invite_id}
                className="border rounded-lg p-4"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold">
                      Driver ID: {invite.driver_id}
                    </p>
                    <p className="text-sm text-gray-600">
                      Sent on{" "}
                      {new Date(invite.invited_at_utc).toLocaleDateString()}

                    </p>
                  </div>

                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                      invite.invite_status
                    )}`}
                  >
                    {invite.invite_status}
                  </span>
                </div>

                {invite.invite_status === "sent" && (
                  <button
                    onClick={() => handleCancelInvite(invite.invite_id)}
                    className="mt-3 flex items-center gap-1 text-sm text-red-600 hover:underline"
                  >
                    <Trash2 size={14} />
                    Cancel Invite
                  </button>
                )}

                {invite.invite_status === "accepted" && (
                  <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded text-sm text-green-700">
                     Driver accepted the invitation. You can now assign vehicles.
                    at      {new Date(invite.accepted_at_utc).toLocaleDateString()}

                  </div>
                )}

                {invite.invite_status === "rejected" && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                     Driver rejected the invitation. at                       {new Date(invite.rejected_at_utc).toLocaleDateString()}

                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

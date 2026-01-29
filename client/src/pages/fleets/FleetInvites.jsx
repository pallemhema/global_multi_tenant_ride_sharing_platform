import { useState } from "react";
import { Users, Send, Trash2, AlertCircle } from "lucide-react";
import { useFleetOwner } from "../../context/FleetOwnerContext";

export default function FleetInvites() {
  const { fleetOwner, invites, vehicles, inviteDriver, cancelInvite, loading } =
    useFleetOwner();
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [driverId, setDriverId] = useState("");
  const [inviting, setInviting] = useState(false);

  if (!fleetOwner?.is_active) {
    return (
      <>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <AlertCircle className="text-yellow-600 inline mr-2" />
          <p className="text-yellow-800">
            Please wait for admin approval before inviting drivers.
          </p>
        </div>
      </>
    );
  }

  const handleInviteDriver = async () => {
    if (!driverId) {
      alert("Please select a driver");
      return;
    }

    try {
      setInviting(true);
      await inviteDriver(parseInt(driverId));
      setDriverId("");
      setShowInviteForm(false);
      alert("Driver invitation sent");
    } catch (err) {
      alert(err.message);
    } finally {
      setInviting(false);
    }
  };

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

  return (
    <>
      <div className="space-y-6">
        {/* Invite Button */}
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Driver Invites</h1>
          <button
            onClick={() => setShowInviteForm(!showInviteForm)}
            className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition"
          >
            <Send size={20} />
            Invite Driver
          </button>
        </div>

        {/* Invite Form */}
        {showInviteForm && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Invite Driver
            </h2>
            <p className="text-gray-600 mb-4 text-sm">
              Invite an existing driver from your tenant to join your fleet
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Select Driver *
                </label>
                <input
                  type="text"
                  placeholder="Enter driver ID or name"
                  value={driverId}
                  onChange={(e) => setDriverId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Driver must belong to the same tenant and be approved
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleInviteDriver}
                  disabled={inviting || !driverId}
                  className="flex-1 bg-purple-600 text-white py-2 rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50 transition flex items-center justify-center gap-2"
                >
                  <Send size={18} />
                  {inviting ? "Sending..." : "Send Invitation"}
                </button>
                <button
                  onClick={() => setShowInviteForm(false)}
                  className="flex-1 bg-gray-300 text-gray-900 py-2 rounded-lg font-semibold hover:bg-gray-400 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Invites List */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Users size={24} className="text-purple-600" />
            All Invitations ({invites.length})
          </h2>

          {invites.length === 0 ? (
            <div className="text-center py-12">
              <Users size={48} className="text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600">No invitations sent yet</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {invites.map((invite) => (
                <div
                  key={invite.driver_invite_id}
                  className="border rounded-lg p-4 hover:shadow-md transition"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">
                        Driver ID: {invite.driver_id}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Sent:{" "}
                        {new Date(invite.sent_at_utc).toLocaleDateString()}
                      </p>
                      {invite.responded_at_utc && (
                        <p className="text-sm text-gray-600">
                          Responded:{" "}
                          {new Date(
                            invite.responded_at_utc,
                          ).toLocaleDateString()}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                          invite.invite_status,
                        )}`}
                      >
                        {invite.invite_status?.toUpperCase()}
                      </span>

                      {invite.invite_status === "sent" && (
                        <button
                          onClick={() => cancelInvite(invite.driver_invite_id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                  </div>

                  {invite.invite_status === "accepted" && (
                    <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
                      ✓ Driver accepted the invitation. You can now assign
                      vehicles.
                    </div>
                  )}

                  {invite.invite_status === "rejected" && (
                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                      ✗ Driver rejected the invitation
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

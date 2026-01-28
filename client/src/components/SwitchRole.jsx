import { AlertCircle, ToggleLeft } from "lucide-react";
import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useUserAuth } from "../context/UserAuthContext";

export default function SwitchRole() {
  const { role, availableRoles, switchUserRole } = useUserAuth();
  const navigate = useNavigate();

  const [switching, setSwitching] = useState(false);
  const [error, setError] = useState("");

  console.log("SwitchRole - role:", role, "availableRoles:", availableRoles);

  // Get all other roles available
  const otherRoles = useMemo(() => {
    return availableRoles.filter((r) => r !== role);
  }, [role, availableRoles]);

  // Map role to dashboard path
  const getRolePath = (targetRole) => {
    const paths = {
      driver: "/driver/dashboard",
      rider: "/rider/dashboard",
      "fleet-owner": "/fleet-owner/dashboard",
    };
    return paths[targetRole] || "/";
  };

  // If no other roles, render nothing
  if (otherRoles.length === 0) {
    console.log("No other roles available");
    return null;
  }

  const handleSwitch = async (targetRole) => {
    try {
      setSwitching(true);
      setError("");
      await switchUserRole(targetRole);
      navigate(getRolePath(targetRole));
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to switch role");
    } finally {
      setSwitching(false);
    }
  };

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
      <div className="flex items-center gap-2 mb-4">
        <ToggleLeft className="w-5 h-5 text-blue-600" />
        <h2 className="text-xl font-semibold text-blue-900">Switch Role</h2>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 p-3 rounded mb-4 flex gap-2">
          <AlertCircle className="text-red-600 flex-shrink-0" />
          <span className="text-red-700 text-sm">{error}</span>
        </div>
      )}

      <p className="text-sm text-blue-700 mb-4">
        You are currently using the <b>{role}</b> experience. Switch to another
        role to manage different aspects of your account.
      </p>

      <div className="flex flex-wrap gap-3">
        {otherRoles.map((targetRole) => (
          <button
            key={targetRole}
            onClick={() => handleSwitch(targetRole)}
            disabled={switching}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition capitalize font-medium"
          >
            {switching ? "Switching..." : `Switch to ${targetRole}`}
          </button>
        ))}
      </div>
    </div>
  );
}

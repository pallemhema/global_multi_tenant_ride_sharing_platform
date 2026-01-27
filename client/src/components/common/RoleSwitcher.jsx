// src/components/common/RoleSwitcher.jsx
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useUserAuth } from "../../context/UserAuthContext";

const ROLE_LABELS = {
  rider: "Rider",
  driver: "Driver",
  "fleet-owner": "Fleet Owner",
  "tenant-admin": "Tenant Admin",
};

const ROLE_ROUTES = {
  rider: "/rider/dashboard",
  driver: "/driver/dashboard",
  "fleet-owner": "/fleet-owner/dashboard",
};

export default function RoleSwitcher() {
  const { user, availableRoles, switchUserRole } = useUserAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  if (!availableRoles || availableRoles.length <= 1) return null;

  const currentRole = user?.role;

  const handleSwitch = async (role) => {
    try {
      await switchUserRole(role);
      setOpen(false);
      navigate(ROLE_ROUTES[role]);
    } catch {
      alert("Failed to switch role");
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-4 py-2 bg-white border rounded-lg shadow-sm"
      >
        <span className="font-semibold">
          {ROLE_LABELS[currentRole]}
        </span>
        <ChevronDown size={16} />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-56 bg-white border rounded-lg shadow-lg z-50">
          {availableRoles.map((r) => {
            const isCurrent = r.role === currentRole;

            return (
              <button
                key={r.role}
                disabled={isCurrent}
                onClick={() => handleSwitch(r.role)}
                className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100
                  ${isCurrent ? "text-gray-400 cursor-not-allowed" : "text-gray-700"}
                `}
              >
                <div className="flex justify-between">
                  <span>{ROLE_LABELS[r.role]}</span>
                  {r.approval_status === "pending" && (
                    <span className="text-xs text-orange-500">Pending</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

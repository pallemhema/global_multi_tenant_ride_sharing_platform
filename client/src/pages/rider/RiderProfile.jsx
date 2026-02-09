import { useUserAuth } from "../../context/UserAuthContext";
import { useNavigate } from "react-router-dom";
import { User, Phone, LogOut, ArrowRight, Plus } from "lucide-react";
import { useState } from "react";
import SwitchRole from "../../components/SwitchRole";

export default function RiderProfile() {
  const { user, role, availableRoles, logoutUser } =
    useUserAuth();
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);

  // Get other roles besides "rider"
  const otherRoles = availableRoles.filter((r) => r.toLowerCase() !== "rider");


  console.log(user);
  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      logoutUser();
      navigate("/user/login");
    } catch (err) {
      console.error("Logout failed:", err);
      alert("Logout failed. Please try again.");
      setLoggingOut(false);
    }
  };

  const handleRegisterAsDriver = () => {
    console.log("Navigating to driver registration");
    navigate("/register/fleet");
  };

  const handleRegisterAsFleet = () => {
    navigate("/register/driver");
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">My Profile</h1>

      {/* Main Profile Card */}
      <div className="bg-white rounded-lg shadow p-6 space-y-6">
        {/* Profile Header */}
        <div className="flex items-center gap-4 border-b pb-4">
          <div className="w-16 h-16 bg-indigo-200 rounded-full flex items-center justify-center">
            <User size={32} className="text-indigo-600" />
          </div>
          <div>
            <div className="font-semibold text-lg">
              {user?.name || user?.sub || "User"}
            </div>
            <div className="text-sm text-slate-600">Rider Account</div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Phone size={20} className="text-slate-600" />
            <div>
              <div className="text-sm text-slate-600">Phone</div>
              <div className="font-medium">{user?.phone || "Not provided"}</div>
            </div>
          </div>
        </div>

        {/* Account Info */}
        <div className="border-t pt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">User ID</span>
            <span className="font-mono text-slate-900">{user?.sub}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">Current Role</span>
            <span className="font-medium text-indigo-600 capitalize">
              {role || "rider"}
            </span>
          </div>
        </div>
      </div>

      {/* Role Management Section */}
      {otherRoles.length > 0 ? (
        // Show switch role buttons if other roles exist
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-lg mb-4 text-blue-900">
            Switch Role
          </h3>
          <p className="text-sm text-blue-800 mb-4">
            You have access to other roles. Switch to manage your account as:
          </p>
             <SwitchRole/> 
        </div>
      ) : null}

      {/* Registration Section - Show only if no other roles exist */}
      {otherRoles.length === 0 && (
        <div className="space-y-3">
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
              <h3 className="font-semibold text-lg mb-4 text-purple-900">
                Become a Driver
              </h3>
              <p className="text-sm text-purple-800 mb-4">
                Register to become a driver and start earning:
              </p>
              <button
                onClick={handleRegisterAsDriver}
                className="w-full flex items-center justify-between bg-white border border-purple-300 rounded-lg p-4 hover:bg-purple-50 transition"
              >
                <div className="text-left">
                  <div className="font-medium">Register as Driver</div>
                  <div className="text-xs text-purple-600">
                    Drive your own vehicle
                  </div>
                </div>
                <Plus size={18} className="text-purple-600" />
              </button>
            </div>
          
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h3 className="font-semibold text-lg mb-4 text-green-900">
                Become a Fleet Owner
              </h3>
              <p className="text-sm text-green-800 mb-4">
                Register to manage a fleet of drivers:
              </p>
              <button
                onClick={handleRegisterAsFleet}
                className="w-full flex items-center justify-between bg-white border border-green-300 rounded-lg p-4 hover:bg-green-50 transition"
              >
                <div className="text-left">
                  <div className="font-medium">Register as Fleet Owner</div>
                  <div className="text-xs text-green-600">
                    Manage multiple drivers
                  </div>
                </div>
                <Plus size={18} className="text-green-600" />
              </button>
            </div>
        </div>
      )}

      {/* Logout Button */}
      <div className="flex justify-end">
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="flex items-center gap-2 bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
        >
          <LogOut size={18} />
          {loggingOut ? "Logging out..." : "Logout"}
        </button>
      </div>
    </div>
  );
}

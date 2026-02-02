import { useState, useRef, useEffect } from "react";
import { Outlet, Link, useNavigate } from "react-router-dom";
import { useUserAuth } from "../../context/UserAuthContext";
import { User, Plus, X } from "lucide-react";
import RoleSwitcher from "../../components/common/RoleSwitcher";

export default function RiderLayout() {
  const { user, phone, availableRoles } = useUserAuth();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);
  const isDriver = availableRoles?.includes("driver");
  const isFleetOwner = availableRoles?.includes("fleet_owner");

  const toggleProfile = () => {
    setProfileOpen(!profileOpen);
  };

  // Close modal on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    if (profileOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [profileOpen]);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="text-lg font-bold">RideShare</div>
          <div ref={profileRef} className="relative">
            {/* Profile Icon Toggle */}
            <button
              onClick={toggleProfile}
              className="text-indigo-600 hover:text-indigo-700"
              title="Profile"
            >
              <User size={24} />
            </button>

            {/* Profile Dropdown Modal */}
            {profileOpen && (
              <div className="fixed top-14 right-4 w-72 bg-white rounded-lg shadow-2xl border border-slate-200 z-9999">
                {/* Close Button */}
                <div className="flex justify-end p-3 border-b">
                  <button
                    onClick={() => setProfileOpen(false)}
                    className="text-slate-600 hover:text-slate-900"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="p-4 space-y-4">
                  {/* User Info */}
                  <Link
                    to="/rider/profile"
                    onClick={() => setProfileOpen(false)}
                    className="block p-3 rounded hover:bg-slate-100 border border-slate-200"
                  >
                    <div className="text-sm font-semibold text-slate-900">
                      {user?.name || "Profile"}
                    </div>
                    <div className="text-xs text-slate-600">
                      {phone || "Rider"}
                    </div>
                  </Link>

                  {/* Role Switcher if available */}
                  {(isDriver || isFleetOwner) && (
                    <div className="border-t pt-4">
                      <RoleSwitcher />
                    </div>
                  )}

                  {/* Register buttons if no other roles */}
                  {!isDriver && !isFleetOwner && (
                    <div className="border-t pt-4 space-y-2">
                      <button
                        onClick={() => {
                          navigate("/register/driver");
                          setProfileOpen(false);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-green-600 hover:bg-green-50 rounded border border-green-200 text-sm font-medium"
                      >
                        <Plus size={16} /> Register as Driver
                      </button>
                      <button
                        onClick={() => {
                          navigate("/register/fleet");
                          setProfileOpen(false);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-purple-600 hover:bg-purple-50 rounded border border-purple-200 text-sm font-medium"
                      >
                        <Plus size={16} /> Register as Fleet Owner
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4">
        <Outlet />
      </main>
    </div>
  );
}

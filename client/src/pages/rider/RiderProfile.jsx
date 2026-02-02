import { useUserAuth } from "../../context/UserAuthContext";
import { useNavigate } from "react-router-dom";
import { User, Phone, Mail, LogOut } from "lucide-react";

export default function RiderProfile() {
  const { user, phone, logout } = useUserAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/user/login");
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Profile</h1>

      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        {/* Profile Header */}
        <div className="flex items-center gap-4 border-b pb-4">
          <div className="w-16 h-16 bg-indigo-200 rounded-full flex items-center justify-center">
            <User size={32} className="text-indigo-600" />
          </div>
          <div>
            <div className="font-semibold text-lg">
              {user?.name || user?.sub || "Rider"}
            </div>
            <div className="text-sm text-slate-600">Active rider</div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Phone size={20} className="text-slate-600" />
            <div>
              <div className="text-sm text-slate-600">Phone</div>
              <div className="font-medium">{phone || "Not provided"}</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Mail size={20} className="text-slate-600" />
            <div>
              <div className="text-sm text-slate-600">Email</div>
              <div className="font-medium">{user?.email || "Not provided"}</div>
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
            <span className="text-slate-600">Role</span>
            <span className="font-medium text-slate-900">Rider</span>
          </div>
        </div>
      </div>

      {/* Logout Button */}
      <div className="flex justify-end">
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </div>
  );
}

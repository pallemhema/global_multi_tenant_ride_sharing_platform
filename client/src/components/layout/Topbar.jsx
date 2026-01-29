import { useLocation } from "react-router-dom";
import { useAdminAuth } from "../../context/AdminAuthContext";
import Button from "../common/Button";

export default function Topbar() {
  const location = useLocation();
  const { user, logout } = useAdminAuth();

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === "/dashboard") return "Dashboard";
    if (path.startsWith("/dashboard/tenants")) {
      if (path.includes("/dashboard/tenants/")) return "Tenant Details";
      return "Tenants";
    }
    if (path === "/dashboard/profile") return "Profile";
    return "Dashboard";
  };

  const handleLogout = () => {
    logout();
    window.location.href = "/login";
  };

  return (
    <div className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between">
      <h1 className="text-2xl font-bold text-slate-900">{getPageTitle()}</h1>

      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-sm font-medium text-slate-900">
            {user?.email || "Admin"}
          </p>
          <p className="text-xs text-slate-500">App Admin</p>
        </div>
        <button
          onClick={handleLogout}
          className="text-slate-600 hover:text-slate-900 transition-colors"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}

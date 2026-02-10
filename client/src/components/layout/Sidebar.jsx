
import {
  LayoutDashboard,
  Building2,
  User,
  LogOut,
  Plus,
  Menu,
  X,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useAdminAuth } from "../../context/AdminAuthContext";

export default function Sidebar({ sidebarOpen, setSidebarOpen }) {
  const { logout } = useAdminAuth();
  const location = useLocation();

  const isActive = (path) => {
    if (path === "/dashboard") {
      return location.pathname === "/dashboard";
    }
    return location.pathname.startsWith(path);
  };

  const handleLogout = () => {
    logout();
    window.location.href = "/login";
  };

  const navItems = [
    { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { path: "/dashboard/tenants", label: "Tenants", icon: Building2 },
  
  ];

  const actionItems = [
    { path: "/dashboard/tenants/create", label: "Create Tenant", icon: Plus },
    { path: "/dashboard/payouts/create", label: "Create Payout Batch", icon:Plus},
  ];

  return (
    <aside
      className={`${
        sidebarOpen ? "w-64" : "w-20"
      } bg-slate-900 text-white h-screen fixed left-0 top-0 flex flex-col transition-all duration-300 z-40`}
    >
      {/* Header */}
      <div className="p-6 border-b border-slate-800 flex items-center justify-between">
        {sidebarOpen && (
          <div>
            <h1 className="text-2xl font-bold">RideShare</h1>
            <p className="text-sm text-slate-400">Admin Dashboard</p>
          </div>
        )}

        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-1 rounded hover:bg-slate-800"
        >
          {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);

          return (
            <Link
              key={item.path}
              to={item.path}
              title={!sidebarOpen ? item.label : ""}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition ${
                active
                  ? "bg-indigo-600 text-white"
                  : "text-slate-300 hover:bg-slate-800"
              }`}
            >
              <Icon size={20} />
              {sidebarOpen && (
                <span className="text-sm">{item.label}</span>
              )}
            </Link>
          );
        })}

        {/* Actions */}
        <div className="border-t border-slate-700 pt-4 mt-4">
          {actionItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                title={!sidebarOpen ? item.label : ""}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-300 hover:bg-slate-800 transition"
              >
                <Icon size={20} />
                {sidebarOpen && (
                  <span className="text-sm">{item.label}</span>
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-slate-800">
        <button
          onClick={handleLogout}
          title={!sidebarOpen ? "Logout" : ""}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-300 hover:bg-slate-800 transition"
        >
          <LogOut size={20} />
          {sidebarOpen && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}


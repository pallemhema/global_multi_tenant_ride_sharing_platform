


import {
  LayoutDashboard,
  FileText,
  Car,
  Truck,
  Clock,
  User,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { Link, useLocation, Outlet } from "react-router-dom";
import { useUserAuth } from "../context/UserAuthContext";
import { useDriver } from "../context/DriverContext";
import { useState } from "react";

export default function DriverLayout() {
  const { logoutUser, user } = useUserAuth();
  const { driver } = useDriver();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const driverType = driver?.driver_type; // "individual" | "fleet_driver"

  const isActive = (path) => location.pathname.startsWith(path);

  const handleLogout = () => {
    logoutUser();
    window.location.href = "/user/login";
  };

  /* =============================
     ROLE-BASED NAV ITEMS
  ============================= */

  const navItems = [
    {
      path: "/driver/dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
    },
    {
      path: "/driver/documents",
      label: "Documents",
      icon: FileText,
    },

    // ✅ Individual drivers only
    ...(driverType === "individual"
      ? [
          {
            path: "/driver/vehicles",
            label: "Vehicles",
            icon: Car,
          },
        ]
      : []),

    // ✅ Fleet drivers only
    ...(driverType === "fleet_driver"
      ? [
         {
            path: "/driver/fleet-invites",
            label: "Fleet Invitations",
            icon: Truck,
          },
          {
            path: "/driver/assigned-vehicles",
            label: "Assigned Vehicles",
            icon: Truck,
          },
        ]
      : []),

    {
      path: "/driver/shifts",
      label: "Shifts",
      icon: Clock,
    },
    {
      path: "/driver/profile",
      label: "Profile",
      icon: User,
    },
  ];

  return (
    <div className="flex h-screen bg-slate-50">
      {/* =============================
          SIDEBAR
      ============================= */}
      <aside
        className={`${
          sidebarOpen ? "w-64" : "w-20"
        } bg-slate-900 text-white fixed inset-y-0 left-0 flex flex-col transition-all duration-300 z-40`}
      >
        {/* Logo */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          {sidebarOpen && (
            <div>
              <h1 className="text-2xl font-bold">RideShare</h1>
              <p className="text-xs text-slate-400 capitalize">
                {driverType || "driver"}
              </p>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1 hover:bg-slate-800 rounded"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Navigation */}
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
                {sidebarOpen && <span className="text-sm">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-slate-800">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-300 hover:bg-slate-800"
          >
            <LogOut size={20} />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* =============================
          MAIN CONTENT
      ============================= */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ${
          sidebarOpen ? "ml-64" : "ml-20"
        }`}
      >
        {/* Top Bar */}
        <header className="bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              {navItems.find((item) => isActive(item.path))?.label ||
                "Dashboard"}
            </h2>
            {user?.id && (
              <p className="text-xs text-slate-500">Driver ID: {user.id}</p>
            )}
          </div>

          <div className="text-right">
            <p className="text-sm font-medium text-slate-900">
              {user?.name || "Driver"}
            </p>
            <p className="text-xs text-slate-500 capitalize">
              {driverType || "driver"}
            </p>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

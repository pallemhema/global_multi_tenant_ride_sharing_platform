import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  FileText,
  Truck,
  Users,
  LogOut,
  Menu,
  X,
  ChevronDown,
} from "lucide-react";
import { Outlet } from "react-router-dom";


import { useUserAuth } from "../context/UserAuthContext";
import { useFleetOwner } from "../context/FleetOwnerContext";

function FleetLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logoutUser } = useUserAuth();
  const { fleetOwner } = useFleetOwner();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const isActive = (path) => {
    return location.pathname.startsWith(path);
  };

  const handleLogout = () => {
    logoutUser();
    window.location.href = '/user/login';
  };

  const menuItems = [
    {
      label: "Dashboard",
      icon: LayoutDashboard,
      path: "/fleet/dashboard",
    },
    {
      label: "Documents",
      icon: FileText,
      path: "/fleet/documents",
    },
    {
      label: "Vehicles",
      icon: Truck,
      path: "/fleet/vehicles",
    },
    {
      label: "Invite Drivers",
      icon: Users,
      path: "/fleet/invites",
    },
  ];



  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? "w-64" : "w-20"
        } bg-gradient-to-b from-purple-700 to-purple-900 text-white transition-all duration-300 flex flex-col`}
      >
        {/* Logo */}
        <div className="p-6 border-b border-purple-600 flex items-center justify-between">
          {sidebarOpen && (
            <div>
              <h1 className="text-xl font-bold">Fleet Hub</h1>
              <p className="text-xs text-purple-200">Management</p>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-purple-600 rounded-lg transition"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Fleet Info */}
        {sidebarOpen && fleetOwner && (
          <div className="px-6 py-4 bg-purple-600 bg-opacity-50 border-b border-purple-600">
            <p className="text-xs text-purple-200">Fleet Owner</p>
            <p className="font-semibold text-sm truncate">
              {fleetOwner.business_name}
            </p>
            <div className="mt-2 text-xs">
              <span
                className={`inline-block px-2 py-1 rounded ${
                  fleetOwner.approval_status === "approved"
                    ? "bg-green-500 bg-opacity-20 text-green-100"
                    : "bg-yellow-500 bg-opacity-20 text-yellow-100"
                }`}
              >
                {fleetOwner.approval_status === "approved"
                  ? "Approved"
                  : "Pending"}
              </span>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                  isActive(item.path)
                    ? "bg-white text-purple-700 font-semibold"
                    : "text-purple-100 hover:bg-purple-600"
                }`}
              >
                <Icon size={20} />
                {sidebarOpen && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-purple-600">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-purple-100 hover:bg-purple-600 transition"
          >
            <LogOut size={20} />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-200 p-6 shadow-sm flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
                {menuItems.find((item) => isActive(item.path))?.label || 'Dashboard'}
            </h2>
          </div>
          <div className="flex items-center gap-4">
            {fleetOwner && (
              <div className="text-right">
                <p className="text-sm font-medium text-gray-700">
                  {fleetOwner.business_name}
                </p>
                <p className="text-xs text-gray-500">Fleet Owner</p>
              </div>
            )}
          </div>
        </header>

        {/* Content Area */}
       <main className="flex-1 overflow-auto p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default FleetLayout;

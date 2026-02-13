import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, Car, Truck, Users, AlertCircle, Wallet } from "lucide-react";
import { useTenant } from "../../context/TenantContext";
import StatCard from "../../components/common/StatCard";
import Loader from "../../components/common/Loader";

export default function Dashboard() {
  const { dashboardStats, loading, loadDashboardStats, wallet } =
    useTenant();
  const navigate = useNavigate();

  useEffect(() => {
    loadDashboardStats();
  }, [loadDashboardStats]);

  const stats = dashboardStats || {
    pendingDocuments: 0,
    pendingVehicles: 0,
    pendingFleetOwners: 0,
    pendingDrivers: 0,
  };

  if (loading) {
    return <Loader />;
  }
  console.log("Dashboard stats:", stats);
  console.log("Wallet info:", wallet);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Dashboard</h1>
        <p className="text-slate-600">
          Manage your tenant operations efficiently
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Pending Documents"
          count={stats.pendingDocuments}
          icon={FileText}
          color="amber"
          onClick={() => navigate("/tenant-admin/documents")}
        />
        <StatCard
          title="Pending Vehicles"
          count={stats.pendingVehicles}
          icon={Car}
          color="blue"
          onClick={() => navigate("/tenant-admin/vehicles")}
        />
        <StatCard
          title="Pending Fleet Owners"
          count={stats.pendingFleetOwners}
          icon={Truck}
          color="indigo"
          onClick={() => navigate("/tenant-admin/fleet-owners")}
        />
        <StatCard
          title="Pending Drivers"
          count={stats.pendingDrivers}
          icon={Users}
          color="rose"
          onClick={() => navigate("/tenant-admin/drivers")}
        />
        <StatCard
          title="Wallet Balance"
          count={`${wallet?.currency_code} ${wallet?.balance ?? 0}`}
          icon={Wallet}
          color="teal"
        />
      </div>

      {/* Quick Actions & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4">
            Quick Actions
          </h2>
          <div className="space-y-3">
            <button
              onClick={() => navigate("/tenant-admin/documents")}
              className="w-full px-4 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-lg transition-colors border border-slate-200"
            >
              ✓ Review Documents
            </button>
            <button
              onClick={() => navigate("/tenant-admin/vehicles")}
              className="w-full px-4 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-lg transition-colors border border-slate-200"
            >
              🚗 Approve Vehicles
            </button>
            <button
              onClick={() => navigate("/tenant-admin/drivers")}
              className="w-full px-4 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-lg transition-colors border border-slate-200"
            >
              👤 Approve Drivers
            </button>
            <button
              onClick={() => navigate("/tenant-admin/fleet-owners")}
              className="w-full px-4 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-lg transition-colors border border-slate-200"
            >
              🚚 Approve Fleet Owners
            </button>
          </div>
        </div>

        {/* System Status */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4">
            System Status
          </h2>
          <div className="space-y-4">
            <div className="flex items-start justify-between pb-4 border-b border-slate-200">
              <div>
                <p className="font-medium text-slate-900">
                  Documents Processing
                </p>
                <p className="text-sm text-slate-500">
                  All systems operational
                </p>
              </div>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                Active
              </span>
            </div>
            <div className="flex items-start justify-between pb-4 border-b border-slate-200">
              <div>
                <p className="font-medium text-slate-900">Vehicle Management</p>
                <p className="text-sm text-slate-500">
                  All systems operational
                </p>
              </div>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                Active
              </span>
            </div>
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium text-slate-900">Driver Management</p>
                <p className="text-sm text-slate-500">
                  All systems operational
                </p>
              </div>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                Active
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

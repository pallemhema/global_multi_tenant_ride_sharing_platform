import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  TrendingUp,
  Users,
  Truck,
  FileCheck,
  AlertCircle,
  Wallet,
} from "lucide-react";
import { useFleetOwner } from "../../context/FleetOwnerContext";
import StatCard from "../../components/common/StatCard";

function FleetDashboard() {
  const navigate = useNavigate();
  const { fleetOwner, dashboardStats, loading, wallet } = useFleetOwner();
  console.log("  FleetDashboard - fleetOwner:", fleetOwner);

  if (fleetOwner?.approval_status === "pending") {
    return (
      <>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-3">
            <AlertCircle className="text-yellow-600" />
            <h2 className="font-semibold text-yellow-900">Approval Pending</h2>
          </div>
          <p className="text-yellow-800 text-sm">
            Your fleet owner account is under review. Once approved by the
            admin, you'll be able to manage vehicles and drivers.
          </p>
          <p className="text-yellow-700 text-sm mt-2">
            Current Status: <strong>{fleetOwner?.approval_status}</strong>
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-800 text-white rounded-lg p-8 shadow-lg">
          <h1 className="text-3xl font-bold mb-2">{fleetOwner?.fleet_name}</h1>
          <p className="text-purple-100 text-sm">
            Welcome to your fleet management dashboard
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Vehicles */}
          <StatCard
            title="Total Vehicles"
            count={dashboardStats?.total_vehicles || 0}
            icon={Truck}
            color="text-blue-600"
          />

          <StatCard
            title="Total Drivers"
            count={dashboardStats?.total_drivers || 0}
            icon={Users}
            color="text-green-600"
          />

          <StatCard
            title="Pending Invites"
            count={dashboardStats?.pending_invites || 0}
            icon={AlertCircle}
            color="text-yellow-600"
          />

          <StatCard
            title="Active Drivers"
            count={dashboardStats?.active_drivers || 0}
            icon={Users}
            color="text-purple-600"
          />

          <StatCard
            title="Trips Completed"
            count={dashboardStats?.trips_completed || 0}
            icon={FileCheck}
            color="text-purple-600"
          />

          <StatCard
            title="Wallet Balance"
            count={wallet?.balance ?? 0}
            icon={Wallet}
            color="text-teal-600"
          />
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Add Vehicle */}
          <button
            onClick={() => navigate("/fleet/vehicles/add")}
            className="bg-white rounded-lg shadow p-6 text-left hover:shadow-lg transition hover:scale-105"
          >
            <Truck className="text-blue-600 mb-3" size={28} />
            <h3 className="font-semibold text-gray-900 mb-1">Add Vehicle</h3>
            <p className="text-gray-600 text-sm">
              Register a new vehicle in your fleet
            </p>
          </button>

          {/* Invite Driver */}
          <button
            onClick={() => navigate("/fleet/invites")}
            className="bg-white rounded-lg shadow p-6 text-left hover:shadow-lg transition hover:scale-105"
          >
            <Users className="text-green-600 mb-3" size={28} />
            <h3 className="font-semibold text-gray-900 mb-1">Invite Driver</h3>
            <p className="text-gray-600 text-sm">
              Invite a driver to join your fleet
            </p>
          </button>
        </div>

        {/* Recent Activity / Status */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Fleet Status</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border rounded-lg p-4">
              <p className="text-gray-600 text-sm mb-1">Business Name</p>
              <p className="font-semibold text-gray-900">
                {fleetOwner?.fleet_name}
              </p>
            </div>
            <div className="border rounded-lg p-4">
              <p className="text-gray-600 text-sm mb-1">Contact Email</p>
              <p className="font-semibold text-gray-900">
                {fleetOwner?.contact_mail || "Not provided"}
              </p>
            </div>
            <div className="border rounded-lg p-4">
              <p className="text-gray-600 text-sm mb-1">Approval Status</p>
              <p
                className={`font-semibold ${
                  fleetOwner?.approval_status === "approved"
                    ? "text-green-600"
                    : fleetOwner?.approval_status === "rejected"
                      ? "text-red-600"
                      : "text-yellow-600"
                }`}
              >
                {fleetOwner?.approval_status?.toUpperCase()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default FleetDashboard;

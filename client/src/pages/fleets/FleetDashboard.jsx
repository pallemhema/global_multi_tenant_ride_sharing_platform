import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { TrendingUp, Users, Truck, FileCheck, AlertCircle } from "lucide-react";
import { useFleetOwner } from "../../context/FleetOwnerContext";

function FleetDashboard() {
  const navigate = useNavigate();
  const { fleetOwner, dashboardStats, loading } = useFleetOwner();
  console.log("  FleetDashboard - fleetOwner:", fleetOwner);

  if (fleetOwner?.approval_status==="pending") {
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
          <h1 className="text-3xl font-bold mb-2">
            {fleetOwner?.business_name}
          </h1>
          <p className="text-purple-100 text-sm">
            Welcome to your fleet management dashboard
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Vehicles */}
          <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
            <div className="flex items-center justify-between mb-4">
              <Truck className="text-blue-600" size={24} />
              <span className="text-3xl font-bold text-gray-900">
                {dashboardStats?.total_vehicles || 0}
              </span>
            </div>
            <p className="text-gray-600 text-sm">Total Vehicles</p>
            <p className="text-xs text-gray-500 mt-2">
              {dashboardStats?.active_vehicles || 0} active
            </p>
          </div>

          {/* Active Drivers */}
          <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
            <div className="flex items-center justify-between mb-4">
              <Users className="text-green-600" size={24} />
              <span className="text-3xl font-bold text-gray-900">
                {dashboardStats?.total_drivers || 0}
              </span>
            </div>
            <p className="text-gray-600 text-sm">Assigned Drivers</p>
            <p className="text-xs text-gray-500 mt-2">
              {dashboardStats?.pending_invites || 0} pending invites
            </p>
          </div>

          {/* Trips Completed */}
          <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
            <div className="flex items-center justify-between mb-4">
              <FileCheck className="text-purple-600" size={24} />
              <span className="text-3xl font-bold text-gray-900">
                {dashboardStats?.trips_completed || 0}
              </span>
            </div>
            <p className="text-gray-600 text-sm">Trips Completed</p>
            <p className="text-xs text-gray-500 mt-2">This month</p>
          </div>

          {/* Earnings */}
          <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
            <div className="flex items-center justify-between mb-4">
              <TrendingUp className="text-orange-600" size={24} />
              <span className="text-3xl font-bold text-gray-900">
                ₹{dashboardStats?.total_earnings || 0}
              </span>
            </div>
            <p className="text-gray-600 text-sm">Total Earnings</p>
            <p className="text-xs text-gray-500 mt-2">All time</p>
          </div>
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
                {fleetOwner?.business_name}
              </p>
            </div>
            <div className="border rounded-lg p-4">
              <p className="text-gray-600 text-sm mb-1">Contact Email</p>
              <p className="font-semibold text-gray-900">
                {fleetOwner?.contact_email || "Not provided"}
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
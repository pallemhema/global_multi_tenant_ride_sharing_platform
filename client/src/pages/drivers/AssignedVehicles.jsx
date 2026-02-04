import { Truck, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { useDriver } from "../../context/DriverContext";

export default function AssignedVehicle() {
  const { driver, assignedVehicle, loading } = useDriver();

  console.log(assignedVehicle)

  /* 🔒 Only fleet drivers */
  if (driver?.driver_type !== "fleet_driver") {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 flex gap-3">
        <AlertCircle className="text-red-600" />
        <p className="text-red-800 font-semibold">
          Assigned vehicle is only available for fleet drivers.
        </p>
      </div>
    );
  }

  if (loading) {
    return <p className="text-gray-500">Loading assigned vehicle…</p>;
  }

  /* 🚫 No assignment */
  if (!assignedVehicle) {
    return (
      <div className="bg-white border rounded-lg p-8 text-center">
        <Truck className="mx-auto text-gray-300 mb-3" size={48} />
        <p className="text-gray-600 font-medium">
          No vehicle assigned yet
        </p>
        <p className="text-sm text-gray-500 mt-1">
          Your fleet owner will assign a vehicle when ready.
        </p>
      </div>
    );
  }

  const { vehicle, fleet, assigned_at_utc } = assignedVehicle;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <Truck className="text-indigo-600" />
          Assigned Vehicle
        </h1>
        <p className="text-gray-600 mt-1">
          Vehicle assigned by your fleet owner
        </p>
      </div>

      {/* Vehicle Card */}
      <div className="bg-white border rounded-lg p-6 shadow-sm">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-lg text-gray-900">
            {vehicle.license_plate}
          </h3>

          <span className="flex items-center gap-1 text-green-700 text-sm">
            <CheckCircle size={14} /> Active
          </span>
        </div>

        <p className="text-sm text-gray-600 mt-1">
          {vehicle.model || "—"} • {vehicle.category_code}
        </p>

        {/* Fleet Info */}
        {fleet && (
          <div className="mt-4 bg-slate-50 border rounded p-3 text-sm">
            <p className="text-gray-600">Fleet</p>
            <p className="font-medium text-gray-900">
              {fleet.business_name}
            </p>
          </div>
        )}

        {/* Assignment Time */}
        <div className="mt-4 text-sm text-gray-500 flex items-center gap-2">
          <Clock size={14} />
          Assigned at{" "}
          {new Date(assigned_at_utc).toLocaleString()}
        </div>

        <div className="mt-4 bg-indigo-50 border border-indigo-200 rounded p-3 text-sm text-indigo-700">
          You are currently operating this vehicle
        </div>
      </div>
    </div>
  );
}

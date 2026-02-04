import { Car, UserPlus, Lock, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useFleetOwner } from "../../context/FleetOwnerContext";
import { useVehicles } from "../../context/VehicleContext";
import { fleetOwnerApi } from "../../services/fleetOwnerApi";

export default function VehicleAssignments() {
  const { vehicles = [] } = useVehicles();
  const { fleetDrivers = [], assignVehicleToDriver } = useFleetOwner();

  const [vehicleLocks, setVehicleLocks] = useState({});
  const [driverLocks, setDriverLocks] = useState({});
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [loading, setLoading] = useState(true);

  /* ================= LOAD LOCK STATES ================= */

  const loadLocks = async () => {
    try {
      setLoading(true);

      const vehicleLockMap = {};
      for (const v of vehicles) {
        vehicleLockMap[v.vehicle_id] =
          await fleetOwnerApi.getVehicleLock(v.vehicle_id);
      }

      const driverLockMap = {};
      for (const d of fleetDrivers) {
        driverLockMap[d.driver_id] =
          await fleetOwnerApi.getDriverLock(d.driver_id);
      }

      setVehicleLocks(vehicleLockMap);
      setDriverLocks(driverLockMap);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (vehicles.length && fleetDrivers.length) {
      loadLocks();
    }
  }, [vehicles.length, fleetDrivers.length]);

  /* ================= DERIVED ================= */

  const freeDrivers = fleetDrivers.filter(
    (d) => !driverLocks[d.driver_id]?.is_locked
  );

  /* ================= ACTION ================= */

  const handleAssign = async (driverId) => {
    try {
      await assignVehicleToDriver(driverId, selectedVehicle.vehicle_id);
      setSelectedVehicle(null);
      await loadLocks();
    } catch (err) {
      alert(err.message || "Assignment failed");
    }
  };

  /* ================= UI ================= */

  if (loading) {
    return <p className="text-gray-600">Loading vehicle assignments…</p>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Vehicle Assignments</h1>

      {/* VEHICLES */}
      <div className="grid md:grid-cols-2 gap-4">
        {vehicles.map((v) => {
          const lock = vehicleLocks[v.vehicle_id];

          return (
            <div
              key={v.vehicle_id}
              className="bg-white rounded-lg shadow p-5 border"
            >
              <div className="flex justify-between">
                <div>
                  <h3 className="font-semibold text-lg">
                    {v.license_plate}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {v.category_code} • {v.model || "—"}
                  </p>
                </div>

                {lock?.is_locked ? (
                  <span className="flex items-center gap-1 text-red-600 text-sm">
                    <Lock size={14} />
                    Assigned
                  </span>
                ) : (
                  <span className="text-green-600 text-sm font-medium">
                    Free
                  </span>
                )}
              </div>

              <div className="mt-4">
                {lock?.is_locked ? (
                  <p className="text-sm text-gray-700">
                    Assigned to Driver ID{" "}
                    <span className="font-semibold">
                      {lock.assigned_driver_id}
                    </span>
                  </p>
                ) : (
                  <button
                    onClick={() => setSelectedVehicle(v)}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
                  >
                    <UserPlus size={16} />
                    Assign Vehicle
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ASSIGN MODAL */}
      {selectedVehicle && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-md p-6">
            <div className="flex justify-between mb-4">
              <h2 className="text-xl font-bold">
                Assign {selectedVehicle.license_plate}
              </h2>
              <button onClick={() => setSelectedVehicle(null)}>
                <X />
              </button>
            </div>

            {freeDrivers.length === 0 ? (
              <p className="text-gray-600">No free drivers available.</p>
            ) : (
              <div className="space-y-3">
                {freeDrivers.map((d) => (
                  <button
                    key={d.driver_id}
                    onClick={() => handleAssign(d.driver_id)}
                    className="w-full border rounded p-3 text-left hover:bg-purple-50"
                  >
                    <p className="font-semibold">{d.full_name || "Unknown Name"}</p>
                    <p className="text-xs text-gray-500">
                      {d.phone_e164}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

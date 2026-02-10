
import { useNavigate } from "react-router-dom";
import { Plus, FileWarning, AlertCircle } from "lucide-react";
import { useVehicles } from "../../context/VehicleContext";
import { useDriver } from "../../context/DriverContext";
import { useFleetOwner } from "../../context/FleetOwnerContext";
import { useUserAuth } from "../../context/UserAuthContext";
import Loader from "../../components/common/Loader";
import StatusBadge from "../../components/common/StatusBadge";
import Button from "../../components/common/Button";

export default function Vehicles() {
  const navigate = useNavigate();
  const { vehicles, loading, deleteVehicle } = useVehicles();
  const { driver } = useDriver();
  const { fleetOwner } = useFleetOwner();
  const { role } = useUserAuth();

  if (loading) return <Loader />;

  /* ================= PERMISSIONS ================= */

  const isIndividualDriver =
    role === "driver" && driver?.driver_type === "individual";

  const isDriverApproved =
    isIndividualDriver && driver?.kyc_status === "approved";

  const isFleetOwnerApproved =
    role === "fleet-owner" && fleetOwner?.approval_status === "approved";

  const canAddVehicle = isDriverApproved || isFleetOwnerApproved;

  /* ================================================= */

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Vehicles</h1>

        <Button
          onClick={() => navigate("add")}
          disabled={!canAddVehicle}
          title={
            !canAddVehicle
              ? "Only approved individual drivers or fleet owners can add vehicles"
              : ""
          }
        >
           + Add Vehicle
        </Button>
      </div>

      {/* INFO MESSAGE */}
      {!canAddVehicle && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3">
          <AlertCircle className="text-amber-600 flex-shrink-0" size={20} />
          <div>
            <p className="font-semibold text-amber-900">
              Vehicle Management Restricted
            </p>
            <p className="text-sm text-amber-800 mt-1">
              {role === "driver" && driver?.driver_type === "fleet_driver"
                ? "Fleet drivers cannot add vehicles. Vehicles are assigned by fleet owners."
                : "Your profile must be approved to add vehicles."}
            </p>
          </div>
        </div>
      )}

      {/* VEHICLE LIST */}
      {vehicles.length === 0 ? (
        <p className="text-slate-600">No vehicles yet</p>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {vehicles.map((v) => (
            <div
              key={v.vehicle_id}
              className="border rounded-lg p-4 space-y-2"
            >
              <div className="flex justify-between">
                <h3 className="font-semibold">{v.license_plate}</h3>
                <StatusBadge status={v.status} type="approval" />
              </div>

              <p className="text-sm text-slate-600">
                {v.model || "—"} • {v.category_code}
              </p>

              {v.status === "inactive" && (
                <div className="flex gap-1 text-amber-600 text-sm">
                  <FileWarning size={14} />
                  Documents required
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => navigate(`${v.vehicle_id}/documents`)}
                >
                  Documents
                </Button>

                {/* Only owners (individual driver / fleet owner) can edit/delete */}
                {canAddVehicle && v.status === "inactive" && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate(`${v.vehicle_id}/edit`)}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => deleteVehicle(v.vehicle_id)}
                    >
                      Delete
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

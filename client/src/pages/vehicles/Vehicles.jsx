import { useNavigate } from "react-router-dom";
import { Plus, FileWarning, AlertCircle } from "lucide-react";
import { useVehicles } from "../../context/VehicleContext";
import { useDriver } from "../../context/DriverContext";
import Loader from "../../components/common/Loader";
import StatusBadge from "../../components/common/StatusBadge";
import Button from "../../components/common/Button";

export default function Vehicles() {
  const navigate = useNavigate();
  const { vehicles, loading, deleteVehicle } = useVehicles();
  const { driver } = useDriver();

  const isApproved = driver?.kyc_status === "approved";

  if (loading) return <Loader />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Vehicles</h1>
        <Button
          onClick={() => navigate("add")}
          disabled={!isApproved}
          title={
            !isApproved
              ? "Your profile must be KYC approved to add vehicles"
              : ""
          }
        >
          <Plus size={16} /> Add Vehicle
        </Button>
      </div>

      {/* KYC APPROVAL MESSAGE */}
      {!isApproved && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3">
          <AlertCircle className="text-amber-600 flex-shrink-0" size={20} />
          <div>
            <p className="font-semibold text-amber-900">
              KYC Verification Required
            </p>
            <p className="text-sm text-amber-800 mt-1">
              You must complete KYC verification to add vehicles. Please check
              your profile or contact support.
            </p>
          </div>
        </div>
      )}

      {vehicles.length === 0 ? (
        <p className="text-slate-600">No vehicles yet</p>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {vehicles.map((v) => (
            <div
              key={v.vehicle_id}
              className="border rounded-lg p-4 space-y-2 "
            >
              <div className="flex justify-between">
                <h3 className="font-semibold">{v.license_plate}</h3>

                <StatusBadge
                  status={v.status}
                  type="approval"
                  className="bg-green-300"
                />
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
                {v.status == "inactive" && (
                  <div className="flex gap-2">
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
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

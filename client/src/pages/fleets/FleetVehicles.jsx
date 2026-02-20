import { useVehicles } from "../../context/VehicleContext";
import { useFleetOwner } from "../../context/FleetOwnerContext";
import { useUserAuth } from "../../context/UserAuthContext";
import Vehicles from "../vehicles/Vehicles";

export default function FleetVehicles() {
  const { vehicles, loading, deleteVehicle } = useVehicles();
  const { fleetOwner } = useFleetOwner();
  const { role } = useUserAuth();

  const isFleetOwnerApproved =
    role === "fleet-owner" &&
    fleetOwner?.approval_status === "approved";

  const canAddVehicle = isFleetOwnerApproved;

  return (
    <Vehicles
      vehicles={vehicles}
      loading={loading}
      canAddVehicle={canAddVehicle}
      infoMessage="Your profile must be approved."
      onDelete={deleteVehicle}
    />
  );
}

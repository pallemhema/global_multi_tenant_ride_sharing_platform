import { useVehicles } from "../../context/VehicleContext";
import { useDriver } from "../../context/DriverContext";
import { useUserAuth } from "../../context/UserAuthContext";
import Vehicles from "../vehicles/Vehicles";

export default function DriverVehicles() {
  const { vehicles, loading, deleteVehicle } = useVehicles();
  const { driver } = useDriver();
  const { role } = useUserAuth();

  const isIndividualDriver =
    role === "driver" &&
    driver?.driver_type === "individual";

  const isDriverApproved =
    isIndividualDriver &&
    driver?.kyc_status === "approved";

  const canAddVehicle = isDriverApproved;

  const infoMessage =
    driver?.driver_type === "fleet_driver"
      ? "Fleet drivers cannot add vehicles."
      : "Your profile must be approved.";

  return (
    <Vehicles
      vehicles={vehicles}
      loading={loading}
      canAddVehicle={canAddVehicle}
      infoMessage={infoMessage}
      onDelete={deleteVehicle}
    />
  );
}

import FleetOwnerRequests from "./requests/FleetOwnerRequests";
import DriverRequests from "./requests/DriverRequests";
import VehicleRequests from "./requests/VehicleRequests";
import { useAuth } from "../../context/AuthContext";
const Requests = () => {
  const { user } = useAuth();
  const tenantId = user.tenant_id;

  return (
    <div className="p-8 space-y-8">
      <h1 className="text-2xl font-bold">Approval Requests</h1>

      <FleetOwnerRequests tenantId={tenantId} />
      <VehicleRequests tenantId={tenantId} />
      <DriverRequests tenantId={tenantId} /> 
    </div>
  );
};

export default Requests;

import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import SelectTenant from "./SelectTenant";

const FleetOwnerEntry = () => {
  const { user } = useAuth();

  // 🚪 Already registered fleet owner
  if (user?.fleet_owner_id) {
    return <Navigate to="/fleet-owner/dashboard" replace />;
  }

  // 🌱 New fleet owner
  return <SelectTenant />;
};

export default FleetOwnerEntry;

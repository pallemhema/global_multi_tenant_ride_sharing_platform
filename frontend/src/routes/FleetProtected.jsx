import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { fetchFleetCompliance } from "../services/fleetOwner/fleetOwner";

const FleetProtected = ({ children }) => {
  const { user } = useAuth();
  const [allowed, setAllowed] = useState(null);

  useEffect(() => {
    if (!user?.fleet_owner_id) {
      setAllowed(false);
      return;
    }

    fetchFleetCompliance(user.fleet_owner_id)
      .then((res) => setAllowed(res.data.is_compliant))
      .catch(() => setAllowed(false));
  }, [user]);

  if (allowed === null) return null; // loader later

  if (!allowed) {
    return <Navigate to="/fleet-owner/documents" replace />;
  }

  return children;
};

export default FleetProtected;

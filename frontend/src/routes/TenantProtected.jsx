import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";

import { fetchTenantCompliance } from "../services/tenants/tenant";
import { useAuth } from "../context/AuthContext";

const TenantProtected = ({ children }) => {
  const { user } = useAuth();
  const [allowed, setAllowed] = useState(null);

  useEffect(() => {
    fetchTenantCompliance(user.tenant_id)
      .then(res => setAllowed(res.data.is_compliant))
      .catch(() => setAllowed(false));
  }, [user]);

  if (allowed === null) return null;

  if (!allowed) {
    return <Navigate to="/tenant/documents" replace />;
  }

  return children;
};

export default TenantProtected;

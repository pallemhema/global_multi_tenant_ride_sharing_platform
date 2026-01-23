import { useEffect, useState } from "react";

import { fetchTenantDocuments } from "../services/tenants/tenantAdmin";
import { useAuth } from "../context/AuthContext";

export const useTenantDocuments = () => {
  const { user } = useAuth();
  const tenantId = user?.tenant_id;

  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadDocuments = async () => {
    if (!tenantId) return;
    setLoading(true);
    const res = await fetchTenantDocuments(tenantId);
    setDocuments(res.data);
    setLoading(false);
  };

  useEffect(() => {
    loadDocuments();
  }, [tenantId]);

  return { documents, loading, reload: loadDocuments };
};

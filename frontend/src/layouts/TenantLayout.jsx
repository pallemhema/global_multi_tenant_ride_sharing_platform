import { Outlet } from "react-router-dom";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import { useAuth } from "../context/AuthContext";
import { useEffect, useState } from "react";
import {
  fetchTenantCompliance,
  fetchTenantDetails,
} from "../services/tenants/tenant";

const TenantLayout = () => {
  const { user } = useAuth();
  const tenantId = user?.tenant_id;

  const [tenant, setTenant] = useState(null);
  const [isCompliant, setIsCompliant] = useState(true);
  const [loading, setLoading] = useState(true);

  // 🔹 Fetch tenant details
  useEffect(() => {
    if (!tenantId) return;

    const loadTenant = async () => {
      try {
        const res = await fetchTenantDetails(tenantId);
        setTenant(res.data);
      } finally {
        setLoading(false);
      }
    };

    loadTenant();
  }, [tenantId]);

  // 🔹 Fetch compliance
  useEffect(() => {
    if (!tenantId) return;

    const loadCompliance = async () => {
      try {
        const res = await fetchTenantCompliance(tenantId);
        setIsCompliant(res.data.is_compliant);
      } catch {
        setIsCompliant(false);
      }
    };

    loadCompliance();
  }, [tenantId]);

  if (loading) return null; // or <TenantSkeleton />

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar role="tenant" />

      <div className="flex-1 flex flex-col">
        <Header
          title={tenant?.tenant_name}
          subtitle={
            tenant?.approval_status === "approved"
              ? "Verified Tenant"
              : "Pending Approval"
          }
        />

        {!isCompliant && (
          <div className="bg-amber-50 border-b border-amber-200 px-6 py-3 text-sm text-amber-800">
            ⚠️ Complete document verification to unlock features
          </div>
        )}

        <main className="flex-1 p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default TenantLayout;

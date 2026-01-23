import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle } from "lucide-react";

import {
  fetchActiveTenants,
  selectTenantForFleetOwner,
} from "../../services/fleetOwners/fleet";

const SelectTenant = () => {
  const navigate = useNavigate();

  const [tenants, setTenants] = useState([]);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [businessName, setBusinessName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchActiveTenants()
      .then((res) => setTenants(res.data))
      .catch(() => setError("Failed to load tenants"));
  }, []);

  const handleSubmit = async () => {
    if (!selectedTenant || !businessName) {
      setError("Select a tenant and enter business name");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await selectTenantForFleetOwner({
        tenant_id: selectedTenant.tenant_id,
        business_name: businessName,
        contact_email: email || undefined,
      });

      navigate("/fleet-owner/documents");
    } catch (err) {
      setError(
        err?.response?.data?.detail || "Failed to start fleet owner onboarding",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex justify-center items-start py-12 px-4">
      <div className="bg-white w-full max-w-3xl rounded-xl shadow-sm p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Join as Fleet Owner
        </h1>
        <p className="text-sm text-gray-600 mb-6">
          Select the platform you want to operate with. This choice is
          permanent.
        </p>

        {/* Error */}
        {error && (
          <div className="mb-4 text-sm text-red-600 bg-red-50 p-3 rounded">
            {error}
          </div>
        )}

        {/* Tenant List */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          {tenants.map((tenant) => {
            const isSelected = selectedTenant?.tenant_id === tenant.tenant_id;

            return (
              <button
                key={tenant.tenant_id}
                onClick={() => setSelectedTenant(tenant)}
                className={`border rounded-lg p-4 text-left transition-all ${
                  isSelected
                    ? "border-blue-600 bg-blue-50"
                    : "border-gray-200 hover:border-gray-400"
                }`}
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">
                    {tenant.tenant_name}
                  </h3>
                  {isSelected && (
                    <CheckCircle size={18} className="text-blue-600" />
                  )}
                </div>

                <p className="text-xs text-gray-500 mt-1">
                  {tenant.country_name}
                </p>
              </button>
            );
          })}
        </div>

        {/* Business Details */}
        <div className="space-y-4 mb-8">
          <div>
            <label className="block text-sm font-medium mb-1">
              Business Name *
            </label>
            <input
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm"
              placeholder="Your fleet company name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Contact Email (optional)
            </label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm"
              placeholder="ops@yourfleet.com"
            />
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Submitting…" : "Continue"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SelectTenant;

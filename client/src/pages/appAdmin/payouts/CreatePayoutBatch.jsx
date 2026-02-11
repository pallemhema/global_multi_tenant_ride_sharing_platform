import { useEffect, useState } from "react";
import { useAppAdmin } from "../../../context/AppAdminContext";
import { useNavigate } from "react-router-dom";
import { appAdminAPI } from "../../../services/appAdminApi";

export default function CreatePayoutBatch() {
  const { tenants, loadTenants, createPayoutBatch, loading, error, clearError } = useAppAdmin();
  const navigate = useNavigate();
  const [countries, setCountries] = useState([]);
  const [localError, setLocalError] = useState(null);
  const [fetchingCountries, setFetchingCountries] = useState(false);

  console.log(tenants)

  const [form, setForm] = useState({
    tenant_id: "",
    country_id: "",
  });

  const [creating, setCreating] = useState(false);
  const [createdBatch, setCreatedBatch] = useState(null);

  /* ----------------------------
     Load tenants on mount
  -----------------------------*/
  useEffect(() => {
    loadTenants();
  }, [loadTenants]);

  /* ----------------------------
     Handle tenant change
  -----------------------------*/
  const handleTenantChange = async (e) => {
    const tenantId = e.target.value;
    clearError();
    setLocalError(null);

    setForm({
      ...form,
      tenant_id: tenantId,
      country_id: "",
    });
    setCountries([]);

    if (!tenantId) return;

    try {
      setFetchingCountries(true);
      // Fetch tenant details which includes countries
      const res = await appAdminAPI.getTenantDetails(tenantId);
      if (res.data?.countries) {
        setCountries(res.data.countries);
      } else {
        setCountries([]);
        setLocalError("No countries found for this tenant");
      }
    } catch (err) {
      setLocalError("Failed to load countries");
      console.error(err);
    } finally {
      setFetchingCountries(false);
    }
  };

  console.log("countries:",countries)

  const handleChange = (e) => {
    clearError();
    setLocalError(null);
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    setCreating(true);
    clearError();
    setLocalError(null);

    try {
      const res = await createPayoutBatch({
        tenant_id: Number(form.tenant_id),
        country_id: Number(form.country_id),
      
      });

      if (res.success) {
        setCreatedBatch(res.data);
        setForm({
          tenant_id: "",
          country_id: "",
         
        });
        setCountries([]);
        // Redirect after 2 seconds
        setTimeout(() => {
          navigate("/dashboard/payouts");
        }, 2000);
      } else {
        setLocalError(res.error || "Failed to create batch");
      }
    } catch (err) {
      setLocalError("An unexpected error occurred");
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-2xl font-semibold mb-6">Create Payout Batch</h1>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded p-3">
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}

      {localError && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded p-3">
          <div className="text-sm text-red-700">{localError}</div>
        </div>
      )}

      {createdBatch && (
        <div className="mb-4 bg-green-50 border border-green-200 rounded p-4">
          <div className="font-semibold text-green-700">✓ Batch Created Successfully</div>
          <div className="text-sm mt-2 space-y-1">
            <div>Batch ID: <b>{createdBatch.payout_batch_id}</b></div>
            <div>Status: <b>{createdBatch.status}</b></div>
            <div>Currency: <b>{createdBatch.currency_code}</b></div>
          </div>
          <div className="text-xs text-gray-600 mt-3">Redirecting to batch list...</div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        {/* Tenant Dropdown */}
        <SelectField
          label="Tenant"
          value={form.tenant_id}
          onChange={handleTenantChange}
          options={tenants.map(t => ({
            value: t.id,
            label: t.name,
          }))}
          placeholder="Select Tenant"
          disabled={loading || creating || !!createdBatch}
        />

        {/* Country Dropdown */}
        <SelectField
          label="Country"
          name="country_id"
          value={form.country_id}
          onChange={handleChange}
          options={countries.map(c => ({
            value: c.country_id,
            label: c.country_name || `Country ${c.country_id}`,
          }))}
          placeholder={fetchingCountries ? "Loading countries..." : form.tenant_id ? "Select Country" : "Select tenant first"}
          disabled={!form.tenant_id || loading || creating || !!createdBatch || fetchingCountries}
        />

        <div>

          This will create payout for:
Monday → Sunday (Last Week)

        </div>

        <div className="pt-4 flex justify-end gap-3">
          <button
            onClick={() => navigate("/dashboard")}
            className="px-5 py-2 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
            disabled={creating || !!createdBatch}
          >
            Cancel
          </button>
          <button
            disabled={loading || creating || !!createdBatch}
            onClick={handleSubmit}
            className="bg-blue-600 text-white px-5 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Loading..." : creating ? "Creating..." : "Create Batch"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ----------------------------
   Reusable components
-----------------------------*/

function Field({ label, disabled, ...props }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1">{label}</label>
      <input
        {...props}
        disabled={disabled}
        className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
      />
    </div>
  );
}

function SelectField({ label, options, placeholder, disabled, ...props }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1">{label}</label>
      <select
        {...props}
        disabled={disabled}
        className="w-full border rounded px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
      >
        <option value="">{placeholder}</option>
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

import { useEffect, useState } from "react";


import { appAdminAPI } from "../../../services/appAdminApi";

export default function CreatePayoutBatch() {
  const [tenants, setTenants] = useState([]);
  const [countries, setCountries] = useState([]);
  console.log(tenants, countries)

  const [form, setForm] = useState({
    tenant_id: "",
    country_id: "",
    period_start_utc: "",
    period_end_utc: "",
  });

  const [loading, setLoading] = useState(false);
  const [createdBatch, setCreatedBatch] = useState(null);

  /* ----------------------------
     Load tenants on page load
  -----------------------------*/
  useEffect(() => {
    appAdminAPI.getTenants().then((res) => {
      setTenants(res.data);
    });
  }, []);

  /* ----------------------------
     When tenant changes → load countries
  -----------------------------*/
  const handleTenantChange = async (e) => {
    const tenantId = e.target.value;

    setForm({
      ...form,
      tenant_id: tenantId,
      country_id: "",
    });
    setCountries([]);

    if (!tenantId) return;

    const res = await appAdminAPI.getTenantDetails(tenantId);
    setCountries(res.data.countries);
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await appAdminAPI.createPayoutBatch({
        tenant_id: Number(form.tenant_id),
        country_id: Number(form.country_id),
        period_start_utc: new Date(form.period_start_utc).toISOString(),
        period_end_utc: new Date(form.period_end_utc).toISOString(),
      });

      setCreatedBatch(res.data);
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to create batch");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-2xl font-semibold mb-6">
        Create Payout Batch
      </h1>

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
          placeholder={
            form.tenant_id
              ? "Select Country"
              : "Select tenant first"
          }
          disabled={!form.tenant_id}
        />

        <Field
          label="Period Start"
          name="period_start_utc"
          type="datetime-local"
          value={form.period_start_utc}
          onChange={handleChange}
        />

        <Field
          label="Period End"
          name="period_end_utc"
          type="datetime-local"
          value={form.period_end_utc}
          onChange={handleChange}
        />

        <div className="pt-4 flex justify-end">
          <button
            disabled={loading}
            onClick={handleSubmit}
            className="bg-blue-600 text-white px-5 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create Batch"}
          </button>
        </div>
      </div>

      {createdBatch && (
        <div className="mt-6 bg-green-50 border border-green-200 rounded p-4">
          <div className="font-semibold text-green-700">
            Batch Created Successfully
          </div>
          <div className="text-sm mt-1">
            Batch ID: <b>{createdBatch.payout_batch_id}</b><br />
            Status: <b>{createdBatch.status}</b><br />
            Currency: <b>{createdBatch.currency_code}</b>
          </div>
        </div>
      )}
    </div>
  );
}

/* ----------------------------
   Reusable components
-----------------------------*/

function Field({ label, ...props }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1">
        {label}
      </label>
      <input
        {...props}
        className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );
}

function SelectField({
  label,
  options,
  placeholder,
  disabled,
  ...props
}) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1">
        {label}
      </label>
      <select
        {...props}
        disabled={disabled}
        className="w-full border rounded px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
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

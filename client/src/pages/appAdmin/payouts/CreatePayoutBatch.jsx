import { useEffect, useState } from "react";
import { useAppAdmin } from "../../../context/AppAdminContext";
import { useNavigate } from "react-router-dom";
import { appAdminAPI } from "../../../services/appAdminApi";

export default function CreatePayoutBatch() {
  const { tenants, loadTenants } = useAppAdmin();
  const navigate = useNavigate();

  const [countries, setCountries] = useState([]);
  const [mode, setMode] = useState("weekly");
  const [periods, setPeriods] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState(null);

  const [loadingPeriods, setLoadingPeriods] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);

  const [form, setForm] = useState({
    tenant_id: "",
    country_id: "",
  });

  /* ----------------------------
     Load Tenants
  -----------------------------*/
  useEffect(() => {
    loadTenants();
  }, [loadTenants]);

  /* ----------------------------
     Load Countries
  -----------------------------*/
  const handleTenantChange = async (e) => {
    const tenantId = e.target.value;

    setForm({ tenant_id: tenantId, country_id: "" });
    setCountries([]);
    setPeriods([]);
    setSelectedPeriod(null);

    if (!tenantId) return;

    try {
      const res = await appAdminAPI.getTenantDetails(tenantId);
      setCountries(res.data?.countries || []);
    } catch (err) {
      setError("Failed to load countries");
    }
  };

  /* ----------------------------
     Load Unsettled Periods
  -----------------------------*/
  const fetchPeriods = async () => {
    if (!form.tenant_id || !form.country_id) return;

    setLoadingPeriods(true);
    setError(null);

    try {
      const res = await appAdminAPI.getUnsettledPeriods({
        tenant_id: form.tenant_id,
        country_id: form.country_id,
        mode: mode,
      });

      setPeriods(res.data || []);
    } catch (err) {
      setError("Failed to fetch unsettled periods");
    } finally {
      setLoadingPeriods(false);
    }
  };

  useEffect(() => {
    fetchPeriods();
  }, [mode, form.country_id]);

  /* ----------------------------
     Create Batch From Period
  -----------------------------*/
  const handleCreateBatch = async () => {
    if (!selectedPeriod) {
      alert("Select a period first");
      return;
    }

    setCreating(true);

    try {
      const res = await appAdminAPI.createBatch({
        tenant_id: form.tenant_id,
        country_id: form.country_id,
        period_start: selectedPeriod.period_start,
        period_end: selectedPeriod.period_end,
      });

      navigate(`/dashboard/payouts`);
    } catch (err) {
      setError("Failed to create batch");
    } finally {
      setCreating(false);
    }
  };

  const formatDate = (d) =>
    new Date(d).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  return (
    <div className="p-6 max-w-4xl space-y-6">
      <h1 className="text-2xl font-semibold">Create Payout Batch</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 p-3 rounded text-red-600">
          {error}
        </div>
      )}

      <div className="bg-white p-6 rounded shadow space-y-4">

        {/* Tenant */}
        <SelectField
          label="Tenant"
          value={form.tenant_id}
          onChange={handleTenantChange}
          options={tenants.map((t) => ({
            value: t.id,
            label: t.name,
          }))}
          placeholder="Select Tenant"
        />

        {/* Country */}
        <SelectField
          label="Country"
          value={form.country_id}
          onChange={(e) =>
            setForm({ ...form, country_id: e.target.value })
          }
          options={countries.map((c) => ({
            value: c.country_id,
            label: c.country_name,
          }))}
          placeholder="Select Country"
          disabled={!form.tenant_id}
        />

        {/* Mode Selector */}
        {form.country_id && (
          <div>
            <label className="block text-sm font-medium mb-2">
              Settlement Mode
            </label>
            <div className="flex gap-2">
              {["daily", "weekly", "monthly"].map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`px-4 py-2 rounded capitalize text-sm ${
                    mode === m
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-100 hover:bg-gray-200"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Unsettled Periods Table */}
      {form.country_id && (
        <div className="bg-white p-6 rounded shadow">
          <h2 className="font-semibold mb-4">Unsettled Periods</h2>

          {loadingPeriods && <div>Loading...</div>}

          {!loadingPeriods && periods.length === 0 && (
            <div className="text-gray-500 text-sm">
              No unsettled earnings found.
            </div>
          )}

          {periods.length > 0 && (
            <table className="w-full text-sm">
              <thead className="border-b bg-gray-50">
                <tr>
                  <th className="p-3 text-left">Select</th>
                  <th className="p-3 text-left">Period</th>
                  <th className="p-3 text-right">Entries</th>
                  <th className="p-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {periods.map((p, i) => (
                  <tr key={i} className="border-t hover:bg-gray-50">
                    <td className="p-3">
                      <input
                        type="radio"
                        checked={selectedPeriod === p}
                        onChange={() => setSelectedPeriod(p)}
                      />
                    </td>
                    <td className="p-3">
                      {formatDate(p.period_start)} –{" "}
                      {formatDate(p.period_end)}
                    </td>
                    <td className="p-3 text-right">{p.entries}</td>
                    <td className="p-3 text-right font-semibold">
                      ₹{parseFloat(p.total_amount).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <div className="flex justify-end mt-4">
            <button
              disabled={!selectedPeriod || creating}
              onClick={handleCreateBatch}
              className="bg-blue-600 text-white px-5 py-2 rounded disabled:opacity-50"
            >
              {creating ? "Creating..." : "Create Batch"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ----------------------------
   Reusable Select
-----------------------------*/

function SelectField({ label, options, placeholder, disabled, ...props }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1">{label}</label>
      <select
        {...props}
        disabled={disabled}
        className="w-full border rounded px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

import { useState } from "react";
import { tenantAdminAPI } from "../../../services/tenantAdminApi";
import { Save, X, Clock, DollarSign } from "lucide-react";

export default function FareConfigFormModal({
  existing,
  category,
  countryId,
  cityId,
  close,
  reload,
}) {
  const [form, setForm] = useState({
    base_fare: existing?.base_fare || "",
    rate_per_km: existing?.rate_per_km || "",
    rate_per_minute: existing?.rate_per_minute || "",
    tax_percentage: existing?.tax_percentage || "",
    effective_from: existing?.effective_from
      ? new Date(existing.effective_from).toISOString().slice(0, 16)
      : "",
  });

  const handleSubmit = async () => {
    const payload = {
      country_id: countryId,
      city_id: cityId,
      vehicle_category: category.category_code,
      base_fare: Number(form.base_fare),
      rate_per_km: Number(form.rate_per_km),
      rate_per_minute: Number(form.rate_per_minute),
      tax_percentage: Number(form.tax_percentage),
      effective_from: new Date(form.effective_from).toISOString(),
    };

    if (existing) {
      await tenantAdminAPI.updateFareConfig(payload);
    } else {
      await tenantAdminAPI.createFareConfig(payload);
    }

    reload();
    close();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center">
      <div className="bg-white p-6 rounded-lg w-96 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg">{existing ? "Update" : "Create"} Fare</h3>
          <button onClick={close} className="text-slate-500">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-slate-500">Base fare (₹)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="Base fare"
              value={form.base_fare}
              onChange={(e) => setForm({ ...form, base_fare: e.target.value })}
              className="w-full border p-2 rounded mt-1"
            />
          </div>

          <div>
            <label className="text-xs text-slate-500">Rate / km (₹)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.rate_per_km}
              onChange={(e) => setForm({ ...form, rate_per_km: e.target.value })}
              className="w-full border p-2 rounded mt-1"
            />
          </div>

          <div>
            <label className="text-xs text-slate-500">Rate / min (₹)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.rate_per_minute}
              onChange={(e) => setForm({ ...form, rate_per_minute: e.target.value })}
              className="w-full border p-2 rounded mt-1"
            />
          </div>

          <div>
            <label className="text-xs text-slate-500">Tax (%)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.tax_percentage}
              onChange={(e) => setForm({ ...form, tax_percentage: e.target.value })}
              className="w-full border p-2 rounded mt-1"
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium">Effective From</label>
          <div className="flex items-center gap-2 mt-1">
            <Clock className="w-4 h-4 text-slate-400" />
            <input
              type="datetime-local"
              value={form.effective_from}
              onChange={(e) => setForm({ ...form, effective_from: e.target.value })}
              className="w-full border p-2 rounded"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <button onClick={close} className="px-3 py-1 rounded border">Cancel</button>
          <button onClick={handleSubmit} className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded">
            <Save className="w-4 h-4" /> Save
          </button>
        </div>
      </div>
    </div>
  );
}

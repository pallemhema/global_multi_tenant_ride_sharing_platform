import { useState } from "react";
import { tenantAdminAPI } from "../../../services/tenantAdminApi";

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
        <h3 className="font-semibold text-lg">
          {existing ? "Update" : "Create"} Fare
        </h3>

        {/* Pricing Inputs */}
        {["base_fare", "rate_per_km", "rate_per_minute", "tax_percentage"].map(
          (field) => (
            <input
              key={field}
              type="number"
              placeholder={field}
              value={form[field]}
              onChange={(e) =>
                setForm({ ...form, [field]: e.target.value })
              }
              className="w-full border p-2 rounded"
            />
          )
        )}

        {/* Effective From Calendar */}
        <div>
          <label className="text-sm font-medium">
            Effective From
          </label>
          <input
            type="datetime-local"
            value={form.effective_from}
            onChange={(e) =>
              setForm({ ...form, effective_from: e.target.value })
            }
            className="w-full border p-2 rounded mt-1"
          />
        </div>

        <div className="flex justify-end gap-2">
          <button onClick={close}>Cancel</button>
          <button
            onClick={handleSubmit}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

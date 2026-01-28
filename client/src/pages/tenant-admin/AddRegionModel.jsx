import React, { useEffect, useState } from "react";
import { lookupsAPI } from "../../services/appAdminApi";

import { tenantAdminAPI } from "../../services/tenantAdminApi";

const AddRegionModal = ({ tenantId, onClose, onSuccess }) => {
  const [countries, setCountries] = useState([]);
  const [cities, setCities] = useState([]);

  const [countryId, setCountryId] = useState("");
  const [selectedCities, setSelectedCities] = useState([]);
  const [loadingCities, setLoadingCities] = useState(false);

  /* ---------- Load Countries ---------- */
  useEffect(() => {
    lookupsAPI.fetchCountries().then((res) => setCountries(res.data));
  }, []);

  /* ---------- Load Available Cities (tenant-aware) ---------- */
  useEffect(() => {
    if (!countryId) return;

    setLoadingCities(true);
    setCities([]);
    setSelectedCities([]);

    tenantAdminAPI.getAvailableCities(tenantId, countryId)
      .then((res) => setCities(res.data))
      .finally(() => setLoadingCities(false));
  }, [countryId, tenantId]);

  /* ---------- Toggle City ---------- */
  const toggleCity = (cityId) => {
    setSelectedCities((prev) =>
      prev.includes(cityId)
        ? prev.filter((id) => id !== cityId)
        : [...prev, cityId],
    );
  };

  /* ---------- Submit ---------- */
  const handleSubmit = async () => {
    await tenantAdminAPI.addTenantRegion(tenantId, {
      country_id: Number(countryId),
      cities: selectedCities.map((id) => ({ city_id: id })),
    });

    onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-xl">
        <h2 className="text-lg font-semibold mb-4">Add Region</h2>

        {/* ---------- Country Select ---------- */}
        <select
          className="border p-2 w-full mb-4 rounded"
          value={countryId}
          onChange={(e) => setCountryId(e.target.value)}
        >
          <option value="">Select Country</option>
          {countries.map((c) => (
            <option key={c.country_id} value={c.country_id}>
              {c.country_name}
            </option>
          ))}
        </select>

        {/* ---------- Cities ---------- */}
        {countryId && (
          <>
            {loadingCities && (
              <p className="text-sm text-gray-400">Loading cities…</p>
            )}

            {!loadingCities && cities.length === 0 && (
              <p className="text-sm text-gray-500">
                All cities for this country are already added.
              </p>
            )}

            {!loadingCities && cities.length > 0 && (
              <div className="space-y-2 max-h-60 overflow-y-auto border rounded p-3">
                {cities.map((city) => (
                  <label
                    key={city.city_id}
                    className="flex items-center gap-2 text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={selectedCities.includes(city.city_id)}
                      onChange={() => toggleCity(city.city_id)}
                    />
                    {city.name}
                  </label>
                ))}
              </div>
            )}
          </>
        )}

        {/* ---------- Actions ---------- */}
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600">
            Cancel
          </button>

          <button
            onClick={handleSubmit}
            disabled={!countryId || selectedCities.length === 0}
            className="px-4 py-2 bg-blue-600 text-white rounded text-sm disabled:opacity-50"
          >
            Add Region
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddRegionModal;

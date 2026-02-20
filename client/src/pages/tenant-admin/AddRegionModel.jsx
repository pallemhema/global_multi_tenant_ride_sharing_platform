import React, { useEffect, useState } from "react";
import { lookupsAPI } from "../../services/lookups";
import { useTenant } from "../../context/TenantContext";

const AddRegionModal = ({ onClose, onSuccess }) => {
  const { addRegion, availableCities, loadAvailableCities,tenant } = useTenant();

  const [countries, setCountries] = useState([]);
  const [countryId, setCountryId] = useState("");
  const [selectedCities, setSelectedCities] = useState([]);
  const [loadingCities, setLoadingCities] = useState(false);
  const isApproved = tenant?.approval_status === "approved";


  /* ---------- Load Countries ---------- */
  useEffect(() => {
    const loadCountries = async () => {
      try {
        const res = await lookupsAPI.fetchCountries();
        setCountries(res || []);
      } catch (err) {
        console.error("failed to fetch countries", err);
      }
    };
    loadCountries();
  }, []);

  /* ---------- Load Available Cities (FIXED) ---------- */
  useEffect(() => {
    if (!countryId) return;

    const loadCities = async () => {
      setLoadingCities(true);
      await loadAvailableCities(Number(countryId));
      setSelectedCities([]);
      setLoadingCities(false);
    };

    loadCities();
  }, [countryId, loadAvailableCities]);

  const toggleCity = (cityId) => {
    setSelectedCities((prev) =>
      prev.includes(cityId)
        ? prev.filter((id) => id !== cityId)
        : [...prev, cityId]
    );
  };

  const handleSubmit = async () => {
    await addRegion({
  country_id: Number(countryId),
  cities: selectedCities.map((id) => ({ city_id: id })),
});

    onSuccess();
    onClose();
  };
  if(!isApproved){
  return(
    <>Not approved please wait until you approved</>
  )}

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-xl">
        <h2 className="text-lg font-semibold mb-4">Add Region</h2>

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

        {countryId && (
          <>
            {loadingCities && <p className="text-sm">Loading cities…</p>}

            {!loadingCities && availableCities.length === 0 && (
              <p className="text-sm text-gray-500">
                All cities for this country are already added.
              </p>
            )}

            {!loadingCities && availableCities.length > 0 && (
              <div className="space-y-2 max-h-60 overflow-y-auto border rounded p-3">
                {availableCities.map((city) => (
                  <label key={city.city_id} className="flex gap-2 text-sm">
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

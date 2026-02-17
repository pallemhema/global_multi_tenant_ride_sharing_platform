import { useState, useEffect } from "react";
import { tenantAdminAPI } from "../../../services/tenantAdminApi";
import { lookupsAPI } from "../../../services/lookups";
import { Edit2 } from "lucide-react";

export default function SurgeEventModal({ zone, surge, countryId, cityId, reload }) {
  const [show, setShow] = useState(false);
  const [vehicleCategories, setVehicleCategories] = useState([]);

  const [form, setForm] = useState({
    vehicle_category: surge?.vehicle_category || "",
    surge_multiplier: surge?.surge_multiplier || "",
  });

  // 🔥 Load vehicle categories when modal opens
  useEffect(() => {
    const loadCategories = async () => {
      const res = await lookupsAPI.getVehicleCategories()
      setVehicleCategories(res);
    };
    loadCategories();
  }, []);

 

  useEffect(() => {
    // update form when editing an existing surge
    setForm({
      vehicle_category: surge?.vehicle_category || "",
      surge_multiplier: surge?.surge_multiplier || "",
    });
  }, [surge]);

  const handleCreateOrUpdate = async () => {
    if (!form.vehicle_category || !form.surge_multiplier) {
      alert("Please select vehicle and enter multiplier");
      return;
    }

    const payload = {
      country_id: countryId,
      city_id: cityId,
      zone_id: zone ? zone.zone_id : surge?.zone_id,
      vehicle_category: form.vehicle_category,
      surge_multiplier: parseFloat(form.surge_multiplier),
    };

    if (surge) {
      await tenantAdminAPI.updateSurgeEvent(surge.surge_id, payload);
    } else {
      await tenantAdminAPI.createSurgeEvent(payload);
    }

    reload();
    setShow(false);
  };

  const handleEnd = async () => {
    if (!surge) return;
    if (!confirm('End this surge event?')) return;
    await tenantAdminAPI.endSurgeEvent(surge.surge_id);
    reload();
    setShow(false);
  };
  console.log(vehicleCategories);


  return (
    <>
      <button
        onClick={() => setShow(true)}
        className={`mt-2 px-3 py-1 rounded ${surge ? 'bg-slate-600 text-white' : 'bg-orange-600 text-white'}`}
      >
        {surge ?  <Edit2 className="w-4 h-4" /> : 'Add Surge'}
      </button>

      {show && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center">
          <div className="bg-white p-5 rounded w-96 space-y-4">
            <h3 className="font-semibold text-lg">{surge ? 'Edit Surge' : 'Create Surge'}</h3>

            {/* ✅ Vehicle Category Dropdown */}
            <select
              className="w-full border p-2 rounded bg-white text-black"
              value={form.vehicle_category}
              onChange={(e) =>
                setForm({ ...form, vehicle_category: e.target.value })
              }
            >
              <option value="">Select Vehicle Category</option>

              {vehicleCategories?.map((v) => (
                <option key={v.category_code} value={v.category_code}>
                  {v.category_code}
                </option>
              ))}
            </select>

            {/* ✅ Multiplier Input */}
            <input
              type="number"
              step="0.1"
              min="1"
              placeholder="Multiplier (e.g. 1.5)"
              className="w-full border p-2 rounded"
              value={form.surge_multiplier}
              onChange={(e) =>
                setForm({ ...form, surge_multiplier: e.target.value })
              }
            />

            <div className="flex justify-between items-center">
              {surge && (
                <div>
                  <button onClick={handleEnd} className="text-red-600">End Surge</button>
                </div>
              )}
              <div className="flex justify-end gap-2">
                <button onClick={() => setShow(false)}>Cancel</button>
                <button
                  onClick={handleCreateOrUpdate}
                  className="bg-blue-600 text-white px-4 py-2 rounded"
                >
                  {surge ? 'Save' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

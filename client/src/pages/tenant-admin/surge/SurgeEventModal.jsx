import { useState } from "react";
import { tenantAdminAPI } from "../../../services/tenantAdminApi";

export default function SurgeEventModal({ zone, countryId, cityId, reload }) {
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({
    vehicle_category: "",
    surge_multiplier: "",
  });

  const handleCreate = async () => {
    await tenantAdminAPI.createSurgeEvent({
      country_id: countryId,
      city_id: cityId,
      zone_id: zone.zone_id,
      ...form,
    });

    reload();
    setShow(false);
  };

  return (
    <>
      <button
        onClick={() => setShow(true)}
        className="mt-2 bg-orange-600 text-white px-3 py-1 rounded"
      >
        Add Surge
      </button>

      {show && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center">
          <div className="bg-white p-5 rounded w-96 space-y-4">
            <h3>Create Surge</h3>

            <input
              placeholder="Vehicle Category"
              className="w-full border p-2 rounded"
              onChange={(e) =>
                setForm({ ...form, vehicle_category: e.target.value })
              }
            />

            <input
              type="number"
              placeholder="Multiplier (e.g. 1.5)"
              className="w-full border p-2 rounded"
              onChange={(e) =>
                setForm({ ...form, surge_multiplier: e.target.value })
              }
            />

            <div className="flex justify-end gap-2">
              <button onClick={() => setShow(false)}>Cancel</button>
              <button
                onClick={handleCreate}
                className="bg-blue-600 text-white px-4 py-2 rounded"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

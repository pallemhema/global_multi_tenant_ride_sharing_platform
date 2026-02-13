import { useEffect, useState } from "react";
import { tenantAdminAPI } from "../../../services/tenantAdminApi";
import SurgeZoneForm from "./SurgeZoneForm";
import SurgeEventModal from "./SurgeEventModal";

export default function TenantSurge({ countryId, cityId }) {
  const [zones, setZones] = useState([]);
  const [surges, setSurges] = useState([]);
  const [showZoneForm, setShowZoneForm] = useState(false);

  const loadSurges = async () => {
    const res = await tenantAdminAPI.getActiveSurges(countryId,cityId);
    setSurges(res.data || []);
  };

  const loadZones = async () => {
    const res = await tenantAdminAPI.getZones(cityId);
    setZones(res.data || []);
  };

  useEffect(() => {
    if (cityId) {
      loadZones();
      loadSurges();
    }
  }, [cityId]);

  return (
    <div className="mt-8 space-y-6">
      <h2 className="text-xl font-semibold">Surge Management</h2>

      <button
        onClick={() => setShowZoneForm(true)}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        Create Surge Zone
      </button>

      {/* Zones List */}
      <div className="grid md:grid-cols-2 gap-4">
        {zones.map((zone) => (
          <div key={zone.zone_id} className="border p-4 rounded">
            <h3 className="font-semibold">{zone.zone_name}</h3>
            <SurgeEventModal
              zone={zone}
              countryId={countryId}
              cityId={cityId}
              reload={loadSurges}
            />
          </div>
        ))}
      </div>

      {/* Active Surges */}
      <div>
        <h3 className="font-semibold mt-6">Active Surges</h3>
        {surges.map((s) => (
          <div key={s.surge_id} className="border p-3 rounded mt-2">
            Zone {s.zone_id} — {s.vehicle_category} — x{s.surge_multiplier}
          </div>
        ))}
      </div>

      {showZoneForm && (
        <SurgeZoneForm
          cityId={cityId}
          close={() => setShowZoneForm(false)}
          reload={loadZones}
        />
      )}
    </div>
  );
}

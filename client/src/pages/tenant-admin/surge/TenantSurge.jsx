import { useEffect, useState } from "react";
import { tenantAdminAPI } from "../../../services/tenantAdminApi";
import SurgeZoneForm from "./SurgeZoneForm";
import SurgeEventModal from "./SurgeEventModal";
import { MapPin, PlusCircle, Clock, Tag, Repeat, DollarSign } from "lucide-react";

export default function TenantSurge({ countryId, cityId }) {
  const [zones, setZones] = useState([]);
  const [surges, setSurges] = useState([]);
  const [showZoneForm, setShowZoneForm] = useState(false);
   const [editingZoneId, setEditingZoneId] = useState(null);

  const loadSurges = async () => {
    const res = await tenantAdminAPI.getActiveSurges(countryId, cityId);
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

  const formatTime = (ts) => {
    if (!ts) return "-";
    try {
      return new Date(ts).toLocaleString();
    } catch (e) {
      return ts;
    }
  };

  return (
    <div className="mt-8 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Surge Management</h2>
          <p className="text-sm text-slate-500 mt-1">Manage surge zones, active events and fare multipliers.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowZoneForm(true)}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-blue-600 text-white px-4 py-2 rounded-md shadow hover:opacity-95"
          >
            <PlusCircle className="w-4 h-4" />
            Create Surge Zone
          </button>
        </div>
      </div>

      {/* Zones */}
      <section>
        <h3 className="text-lg font-medium mb-3">Zones</h3>
        {zones.length === 0 ? (
          <div className="rounded-md border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
            No zones found for this city. Create a new surge zone to get started.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {zones.map((zone) => (
              <div key={zone.zone_id} className="bg-white shadow-sm border rounded-lg p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-md font-semibold">{zone.zone_name}</h4>
                    </div>
                    <div className="text-slate-400">
                      <MapPin className="w-5 h-5" />
                    </div>
                  </div>

                  
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <SurgeEventModal
                    zone={zone}
                    countryId={countryId}
                    cityId={cityId}
                    reload={loadSurges}
                  />
                  <div className="text-sm text-slate-500">Created: {zone.created_at_utc ?  formatTime(zone.created_at_utc) :'-'}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Active Surges */}
      <section>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Active Surges</h3>
          <div className="text-sm text-slate-500">{surges.length} active</div>
        </div>

        {surges.length === 0 ? (
          <div className="mt-4 rounded-md border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
            There are no active surge events right now.
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {surges.map((s) => (
              <div key={s.surge_id} className="bg-white border rounded-lg p-4 shadow-sm flex flex-col justify-between">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <div className="inline-flex items-center px-2 py-1 bg-amber-50 text-amber-700 rounded text-sm font-medium">x{s.surge_multiplier}</div>
                      <div className="text-sm text-slate-600">{s.vehicle_category || 'Any'}</div>
                    </div>
                    <div className="mt-2 text-sm text-slate-500">Zone: {s.zone_name || s.zone_id}</div>
                  </div>

                  <div className="text-slate-400">
                    <Clock className="w-4 h-4" />
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <div className="text-sm text-slate-500">Started: {formatTime(s.started_at_utc)}</div>
                  <div className="flex items-center gap-3">
                    <div className="text-xs text-slate-600">Status: <span className="font-medium">{s.status || 'active'}</span></div>
                    <SurgeEventModal surge={s} countryId={countryId} cityId={cityId} reload={loadSurges} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {showZoneForm && (
        <SurgeZoneForm
          cityId={cityId}
          close={() => { setShowZoneForm(false); setEditingZoneId(null); }}
          reload={loadZones}
          zoneId={editingZoneId}
        />
      )}
    </div>
  );
}

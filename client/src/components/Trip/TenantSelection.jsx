import React, { useEffect, useState } from 'react';
import { listAvailableTenants, selectTenant } from '../../services/tripApi';

export default function TenantSelection({ tripRequestId, onTenantSelected }) {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selecting, setSelecting] = useState(false);

  useEffect(() => {
    if (!tripRequestId) return;
    setLoading(true);
    listAvailableTenants(tripRequestId)
      .then((r) => setTenants(r.tenants || []))
      .catch((e) => setError(e))
      .finally(() => setLoading(false));
  }, [tripRequestId]);

  const handleSelect = async (tenantId, vehicleCategory) => {
    setSelecting(true);
    try {
      const payload = { tenant_id: tenantId, vehicle_category: vehicleCategory };
      const resp = await selectTenant(tripRequestId, payload);
      if (onTenantSelected) onTenantSelected(resp);
    } catch (err) {
      console.error('selectTenant failed', err);
      alert('Failed to select tenant');
    } finally {
      setSelecting(false);
    }
  };

  if (!tripRequestId) return null;

  return (
    <div className="mb-6">
      <h3 className="text-lg font-semibold mb-2">Select a Tenant & Vehicle</h3>
      {loading && <div className="text-sm text-gray-600">Loading tenants…</div>}
      {error && <div className="text-sm text-red-600">Failed to load tenants</div>}

      <div className="grid grid-cols-1 gap-4">
        {tenants.map((t) => (
          <div key={t.tenant_id} className="p-4 border rounded-lg flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <div className="font-semibold">{t.tenant_name}</div>
              <div className="text-sm text-gray-600">Acceptance: {(t.acceptance_rate * 100).toFixed(0)}%</div>
            </div>
            <div className="mt-3 md:mt-0 flex gap-2">
              {t.vehicles.map((v) => (
                <button
                  key={v.vehicle_category}
                  onClick={() => handleSelect(t.tenant_id, v.vehicle_category)}
                  disabled={selecting}
                  className="px-3 py-2 bg-emerald-500 text-white rounded-md text-sm"
                >
                  {v.vehicle_category} • ₦{v.estimated_price.toFixed(0)}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

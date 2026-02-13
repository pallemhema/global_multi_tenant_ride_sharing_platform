import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import * as tripApi from "../../services/tripApi";

export default function ChooseOption() {
  const { tripRequestId } = useParams();
  const navigate = useNavigate();
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await tripApi.listAvailableTenants(tripRequestId);
        // Extract tenants from response
        const tenants = res?.tenants || [];
        setOptions(tenants);
      } catch (e) {
        console.error(e);
        setOptions([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [tripRequestId]);

  const proceed = async () => {
    if (!selected || !selectedVehicle) {
      alert("Please select a tenant and vehicle");
      return;
    }
    try {
      // Send tenant_id and vehicle_category to backend
      const payload = {
        tenant_id: selected.tenant_id,
        vehicle_category: selectedVehicle.vehicle_category,
      };
      await tripApi.selectTenant(tripRequestId, payload);
      // start driver search explicitly
      await tripApi.startDriverSearch(tripRequestId);
      navigate(`/rider/searching/${tripRequestId}`);
    } catch (e) {
      console.error(e);
      alert(e?.response?.data?.detail || "Failed to proceed");
    }
  };

  if (loading) return <div>Loading options…</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Choose Provider & Vehicle</h1>
      {options.length === 0 ? (
        <div className="p-4 bg-white rounded">No options available</div>
      ) : (
        <div className="grid gap-4">
          {options.map((t) => (
            <div
              key={t.tenant_id || t.id}
              className={`p-4 bg-white rounded border ${selected?.tenant_id === t.tenant_id ? "ring-2 ring-indigo-300" : ""}`}
            >
              <div>
                <div className="font-semibold">{t.tenant_name}</div>
                <div className="text-sm text-slate-600">
                  Acceptance: {(t.acceptance_rate * 100).toFixed(0)}%
                </div>
              </div>

              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">
                {(t.vehicles || []).map((v) => (
                  <button
                    key={v.vehicle_category}
                    onClick={() => {
                      setSelected(t);
                      setSelectedVehicle(v);
                    }}
                    className={`p-3 border rounded text-left transition ${
                      selected?.tenant_id === t.tenant_id &&
                      selectedVehicle?.vehicle_category === v.vehicle_category
                        ? "ring-2 ring-indigo-500 bg-indigo-50"
                        : "hover:bg-slate-50"
                    }`}
                  >
                    <div className="text-sm font-medium">
                      {v.vehicle_category}
                    </div>
                    <div className="text-sm text-slate-600">
                      ₹{v.base_fare} base + ₹{v.price_per_km}/km
                    </div>
                    <div className="text-sm text-slate-700 font-semibold">
                      Est: ₹{v.estimated_price?.toFixed(2)}
                    </div>
                    {v.surge_applied && (
                    <span className="absolute top-2 right-2 bg-red-600 text-white text-xs px-2 py-1 rounded">
                      Surge x{v.surge_multiplier}
                    </span>
                  )}

                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-end">
        <button
          onClick={proceed}
          disabled={!selected || !selectedVehicle}
          className="bg-indigo-600 text-white px-6 py-2 rounded disabled:opacity-50 hover:bg-indigo-700"
        >
          Proceed with this option
        </button>
      </div>
    </div>
  );
}

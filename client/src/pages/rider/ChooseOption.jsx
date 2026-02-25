import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Zap,
  MapPin,
  Clock,
  Star,
  TrendingUp,
  Check,
  Car,
  Bike,
  Truck,
} from "lucide-react";
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading available providers…</p>
        </div>
      </div>
    );
  }
  console.log(options);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
            Choose Your Ride
          </h1>
          <p className="text-slate-600 flex items-center gap-2">
            <MapPin size={18} />
            Select a provider and vehicle type
          </p>
        </div>

        {/* Empty State */}
        {options.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-slate-200">
            <Zap size={48} className="mx-auto mb-4 text-slate-300" />
            <h3 className="text-lg font-semibold text-slate-700 mb-2">
              No providers available
            </h3>
            <p className="text-slate-500 mb-6">
              Unfortunately, there are no ride services available in your area
              right now.
            </p>
            <button
              onClick={() => window.history.back()}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg transition"
            >
              Go Back
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Providers Grid */}
            {options.map((tenant) => (
              <div
                key={tenant.tenant_id || tenant.id}
                className={`rounded-2xl border-2 transition-all duration-200 overflow-hidden shadow-sm ${
                  selected?.tenant_id === tenant.tenant_id
                    ? "border-indigo-500 bg-indigo-50 shadow-lg shadow-indigo-100"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                {/* Provider Header */}
                <div className="p-6 bg-gradient-to-r from-slate-50 to-white border-b border-slate-200">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h2 className="text-xl md:text-2xl font-bold text-slate-900">
                        {tenant.tenant_name}
                      </h2>
                      <div className="flex items-center gap-4 mt-2">
                        <div className="flex items-center gap-1">
                          <Star
                            size={16}
                            className="text-yellow-500 fill-yellow-500"
                          />
                          <span className="text-sm font-medium text-slate-700">
                            {(tenant.average_rating || 5.0).toFixed(1)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <TrendingUp size={16} className="text-green-600" />
                          <span className="text-sm font-medium text-green-600">
                            {(tenant.acceptance_rate * 100).toFixed(0)}%
                          </span>
                          <span className="text-xs text-slate-500">
                            acceptance
                          </span>
                        </div>
                      </div>
                    </div>
                    {selected?.tenant_id === tenant.tenant_id && (
                      <div className="bg-green-500 text-white rounded-full p-2">
                        <Check size={20} />
                      </div>
                    )}
                  </div>
                </div>

                {/* Vehicle Options */}
                <div className="p-6">
                  <div className="mb-4">
                    <p className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
                      Available Vehicles
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(tenant.vehicles || []).map((vehicle) => {
                      const isSelected =
                        selected?.tenant_id === tenant.tenant_id &&
                        selectedVehicle?.vehicle_category ===
                          vehicle.vehicle_category;

                      const getVehicleIcon = () => {
                        const category = vehicle.vehicle_category.toLowerCase();
                        if (
                          category.includes("bike") ||
                          category.includes("motorcycle")
                        ) {
                          return <Bike size={24} />;
                        }
                        if (
                          category.includes("auto") ||
                          category.includes("tuk")
                        ) {
                          return <Truck size={24} />;
                        }
                        return <Car size={24} />;
                      };

                      return (
                        <button
                          key={vehicle.vehicle_category}
                          onClick={() => {
                            setSelected(tenant);
                            setSelectedVehicle(vehicle);
                          }}
                          className={`p-4 rounded-xl border-2 transition-all duration-200 text-left relative overflow-hidden group ${
                            isSelected
                              ? "border-indigo-500 bg-indigo-100 shadow-md"
                              : "border-slate-200 bg-white hover:border-indigo-300 hover:shadow-md"
                          }`}
                        >
                          {/* Selected Indicator */}
                          {isSelected && (
                            <div className="absolute top-2 right-2">
                              <div className="bg-indigo-600 text-white rounded-full p-1">
                                <Check size={16} />
                              </div>
                            </div>
                          )}

                          {/* Vehicle Icon & Name */}
                          <div className="flex items-center gap-3 mb-3">
                            <div
                              className={`p-2 rounded-lg transition ${
                                isSelected
                                  ? "bg-indigo-500 text-white"
                                  : "bg-slate-100 text-slate-600 group-hover:bg-indigo-100 group-hover:text-indigo-600"
                              }`}
                            >
                              {getVehicleIcon()}
                            </div>
                            <div>
                              <h4 className="font-semibold text-slate-900">
                                {vehicle.vehicle_category
                                  .charAt(0)
                                  .toUpperCase() +
                                  vehicle.vehicle_category.slice(1)}
                              </h4>
                              <p className="text-xs text-slate-500">
                                Capacity: 4-5 passengers
                              </p>
                            </div>
                          </div>

                          {/* Pricing */}
                          <div className="space-y-2 mb-3 pb-3 border-b border-slate-200">
                            <div className="flex justify-between text-sm">
                              <span className="text-slate-600">Base Fare</span>
                              <span className="font-semibold text-slate-900">
                                ₹{vehicle.base_fare}
                              </span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-slate-600">Per KM</span>
                              <span className="font-semibold text-slate-900">
                                ₹{vehicle.price_per_km}
                              </span>
                            </div>
                          </div>

                          {/* Estimated Price */}
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-500">
                              Estimated fare
                            </span>
                            <span className="text-lg font-bold text-indigo-600">
                              ₹{vehicle.estimated_price?.toFixed(2) || "0.00"}
                            </span>
                          </div>

                          {/* Surge Badge */}
                          {vehicle.surge_applied && (
                            <div className="absolute -top-2 -right-2">
                              <div className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg transform rotate-12">
                                Surge ×
                                {Number(vehicle.surge_multiplier).toFixed(1)}
                              </div>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}

            {/* Action Buttons */}
            <div className="sticky bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 rounded-t-2xl shadow-lg">
              <div className="max-w-4xl mx-auto flex gap-3">
                <button
                  onClick={() => navigate(-1)}
                  className="flex-1 px-6 py-3 border-2 border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 transition"
                >
                  Back
                </button>
                <button
                  onClick={proceed}
                  disabled={!selected || !selectedVehicle}
                  className={`flex-1 px-6 py-3 rounded-lg font-semibold text-white transition ${
                    selected && selectedVehicle
                      ? "bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200 cursor-pointer"
                      : "bg-slate-400 cursor-not-allowed opacity-60"
                  }`}
                >
                  {selected && selectedVehicle ? (
                    <span className="flex items-center justify-center gap-2">
                      <Check size={20} />
                      Proceed to Search
                    </span>
                  ) : (
                    "Select a provider & vehicle"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

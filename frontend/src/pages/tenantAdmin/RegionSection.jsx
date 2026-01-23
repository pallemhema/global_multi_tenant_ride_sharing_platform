import React, { useEffect, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  MapPin,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import {
  fetchTenantRegions,
  enableRegionCity,
  disableRegionCity,
} from "../../services/tenants/tenant";

import AddRegionModal from "./AddRegionModel";

/* ---------- Status Badge ---------- */

const StatusBadge = ({ status }) => {
  if (status === "ACTIVE") {
    return (
      <span className="inline-flex items-center text-xs text-emerald-700">
        <CheckCircle2 size={12} className="mr-1" /> Active
      </span>
    );
  }

  return (
    <span className="inline-flex items-center text-xs text-rose-700">
      <AlertCircle size={12} className="mr-1" /> Disabled
    </span>
  );
};

/* ---------- Country Accordion ---------- */

const CountryAccordion = ({ country, onToggleCity }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="border rounded-xl mb-3 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex justify-between p-4 bg-white"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">{country.flag}</span>
          <span className="font-semibold">{country.name}</span>
          <span className="text-xs bg-gray-100 px-2 rounded-full">
            {country.cities.length} Cities
          </span>
        </div>
        {open ? <ChevronDown /> : <ChevronRight />}
      </button>

      {open && (
        <table className="w-full text-sm">
          <tbody>
            {country.cities.map((city) => (
              <tr key={city.id} className="border-t">
                <td className="px-6 py-3 flex items-center">
                  <MapPin size={14} className="mr-2 text-gray-400" />
                  {city.name}
                </td>
                <td className="px-6 py-3">
                  <StatusBadge status={city.status} />
                </td>
                <td className="px-6 py-3 text-right">
                  <button
                    className="text-blue-600 text-sm"
                    onClick={() =>
                      onToggleCity(city.id, city.status === "ACTIVE")
                    }
                  >
                    {city.status === "ACTIVE" ? "Disable" : "Enable"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

/* ---------- Region Section ---------- */

const RegionSection = () => {
  const { user } = useAuth();
  const tenantId = user?.tenant_id;

  const [regions, setRegions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  const loadRegions = async () => {
    if (!tenantId) return;
    setLoading(true);
    const res = await fetchTenantRegions(tenantId);
    setRegions(res.data);
    setLoading(false);
  };

  useEffect(() => {
    loadRegions();
  }, [tenantId]);

  const toggleCity = async (cityId, isActive) => {
    if (isActive) {
      await disableRegionCity(tenantId, cityId);
    } else {
      await enableRegionCity(tenantId, cityId);
    }
    loadRegions();
  };

  if (loading) {
    return <div className="p-6 text-gray-400">Loading regions…</div>;
  }

  return (
    <section className="mt-8m p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">Operating Regions</h2>
        <button
          onClick={() => setShowAdd(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          + Add New Region
        </button>
      </div>

      {/* Regions */}
      {regions.map((country) => (
        <CountryAccordion
          key={country.country_id}
          country={country}
          onToggleCity={toggleCity}
        />
      ))}

      {/* Add Region Modal */}
      {showAdd && (
        <AddRegionModal
          tenantId={tenantId}
          onClose={() => setShowAdd(false)}
          onSuccess={loadRegions}
        />
      )}
    </section>
  );
};

export default RegionSection;

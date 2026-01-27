// import { useEffect, useState } from 'react';
// import { useAdmin } from '../../context/AdminContext';
// import { tenantAdminAPI } from '../../services/tenantAdminApi';
// import DataTable from '../../components/tenant-admin/DataTable';
// import EmptyState from '../../components/tenant-admin/EmptyState';
// import Loader from '../../components/common/Loader';
// import Button from '../../components/common/Button';
// import { MapPin, Plus, AlertCircle } from 'lucide-react';

// export default function Regions() {
//   const { tenantId } = useAdmin();
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState('');
//   const [regions, setRegions] = useState([]);
//   const [showAddForm, setShowAddForm] = useState(false);
//   const [submitting, setSubmitting] = useState(false);
//   const [selectedRegion, setSelectedRegion] = useState(null);
//   const [expandedRegion, setExpandedRegion] = useState(null);
//   const [formData, setFormData] = useState({
//     country: '',
//     cities: [],
//   });

//   // Fetch regions
//   useEffect(() => {
//     const fetchRegions = async () => {
//       try {
//         setLoading(true);
//         setError('');
//         const response = await tenantAdminAPI.getRegions(tenantId);
//         setRegions(response.data);
//       } catch (err) {
//         console.error('Failed to fetch regions:', err);
//         setError(err.response?.data?.detail || 'Failed to load regions');
//       } finally {
//         setLoading(false);
//       }
//     };

//     if (tenantId) {
//       fetchRegions();
//     }
//   }, [tenantId]);

//   // Handle add region
//   const handleAddRegion = async (e) => {
//     e.preventDefault();
//     if (!formData.country || formData.cities.length === 0) {
//       setError('Please fill all fields');
//       return;
//     }

//     try {
//       setSubmitting(true);
//       setError('');
//       const response = await tenantAdminAPI.addRegion(tenantId, {
//         country: formData.country,
//         cities: formData.cities.split(',').map((c) => c.trim()),
//       });
//       setRegions([...regions, response.data]);
//       setFormData({ country: '', cities: [] });
//       setShowAddForm(false);
//     } catch (err) {
//       setError(err.response?.data?.detail || 'Failed to add region');
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   // Handle toggle city
//   const handleToggleCity = async (regionId, cityId, currentStatus) => {
//     try {
//       setError('');
//       await tenantAdminAPI.toggleCity(
//         tenantId,
//         regionId,
//         cityId,
//         !currentStatus
//       );
//       // Update local state
//       setRegions(
//         regions.map((region) => {
//           if (region.id === regionId) {
//             return {
//               ...region,
//               cities: region.cities.map((city) =>
//                 city.id === cityId ? { ...city, enabled: !currentStatus } : city
//               ),
//             };
//           }
//           return region;
//         })
//       );
//     } catch (err) {
//       setError(err.response?.data?.detail || 'Failed to update city');
//     }
//   };

//   if (loading) {
//     return <Loader />;
//   }

//   return (
//     <div className="space-y-8">
//       {/* Header */}
//       <div className="flex items-center justify-between">
//         <div>
//           <h1 className="text-3xl font-bold text-slate-900 mb-2">Regions</h1>
//           <p className="text-slate-600">Manage service regions and cities</p>
//         </div>
//         <Button
//           variant="primary"
//           onClick={() => setShowAddForm(!showAddForm)}
//         >
//           <Plus size={18} className="mr-2 inline" />
//           Add Region
//         </Button>
//       </div>

//       {/* Error Alert */}
//       {error && (
//         <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
//           <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
//           <div>
//             <h3 className="font-semibold text-red-900">Error</h3>
//             <p className="text-sm text-red-700">{error}</p>
//           </div>
//         </div>
//       )}

//       {/* Add Region Form */}
//       {showAddForm && (
//         <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
//           <h2 className="text-lg font-bold text-slate-900 mb-6">
//             Add New Region
//           </h2>
//           <form onSubmit={handleAddRegion} className="space-y-6">
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//               <div>
//                 <label className="block text-sm font-medium text-slate-700 mb-2">
//                   Country
//                 </label>
//                 <input
//                   type="text"
//                   value={formData.country}
//                   onChange={(e) =>
//                     setFormData({ ...formData, country: e.target.value })
//                   }
//                   required
//                   className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
//                   placeholder="e.g., United States"
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-slate-700 mb-2">
//                   Cities (comma-separated)
//                 </label>
//                 <input
//                   type="text"
//                   value={formData.cities}
//                   onChange={(e) =>
//                     setFormData({ ...formData, cities: e.target.value })
//                   }
//                   required
//                   className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
//                   placeholder="e.g., New York, Los Angeles, Chicago"
//                 />
//               </div>
//             </div>

//             <div className="flex gap-3 justify-end">
//               <Button
//                 variant="secondary"
//                 onClick={() => setShowAddForm(false)}
//                 disabled={submitting}
//               >
//                 Cancel
//               </Button>
//               <Button variant="primary" type="submit" disabled={submitting}>
//                 {submitting ? 'Adding...' : 'Add Region'}
//               </Button>
//             </div>
//           </form>
//         </div>
//       )}

//       {/* Regions List */}
//       {regions.length === 0 ? (
//         <EmptyState
//           icon={MapPin}
//           title="No Regions"
//           description="Start by adding your first service region"
//           action={{
//             label: 'Add Region',
//             onClick: () => setShowAddForm(true),
//           }}
//         />
//       ) : (
//         <div className="space-y-4">
//           {regions.map((region) => (
//             <div
//               key={region.id}
//               className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"
//             >
//               {/* Region Header */}
//               <button
//                 onClick={() =>
//                   setExpandedRegion(
//                     expandedRegion === region.id ? null : region.id
//                   )
//                 }
//                 className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
//               >
//                 <div className="flex items-center gap-3 text-left">
//                   <MapPin className="text-indigo-600" size={20} />
//                   <div>
//                     <h3 className="font-semibold text-slate-900">
//                       {region.country}
//                     </h3>
//                     <p className="text-sm text-slate-500">
//                       {region.cities?.length || 0} cities
//                     </p>
//                   </div>
//                 </div>
//                 <span
//                   className={`transform transition-transform ${
//                     expandedRegion === region.id ? 'rotate-180' : ''
//                   }`}
//                 >
//                   ▼
//                 </span>
//               </button>

//               {/* Cities List */}
//               {expandedRegion === region.id && (
//                 <div className="bg-slate-50 px-6 py-4 border-t border-slate-200">
//                   <div className="space-y-3">
//                     {region.cities?.map((city) => (
//                       <div
//                         key={city.id}
//                         className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200"
//                       >
//                         <span className="font-medium text-slate-900">
//                           {city.name}
//                         </span>
//                         <button
//                           onClick={() =>
//                             handleToggleCity(
//                               region.id,
//                               city.id,
//                               city.enabled
//                             )
//                           }
//                           className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
//                             city.enabled
//                               ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
//                               : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
//                           }`}
//                         >
//                           {city.enabled ? 'Enabled' : 'Disabled'}
//                         </button>
//                       </div>
//                     ))}
//                   </div>
//                 </div>
//               )}
//             </div>
//           ))}
//         </div>
//       )}
//     </div>
//   );
// }
import React, { useEffect, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  MapPin,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

import { useAdmin } from "../../context/AdminContext";
import { tenantAdminAPI } from "../../services/tenantAdminApi";
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
  const { tenantId } = useAdmin();

  const [regions, setRegions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  const loadRegions = async () => {
    if (!tenantId) return;
    setLoading(true);
    const res = await tenantAdminAPI.getRegions(tenantId);
    setRegions(res.data);
    setLoading(false);
  };

  useEffect(() => {
    loadRegions();
  }, [tenantId]);

  const toggleCity = async (cityId, isActive) => {
    if (isActive) {
      await tenantAdminAPI.disableRegionCity(tenantId, cityId);
    } else {
      await tenantAdminAPI.enableRegionCity(tenantId, cityId);
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

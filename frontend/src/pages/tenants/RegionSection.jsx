import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Clock,
} from 'lucide-react';

/* ---------- Status Badge ---------- */

const StatusBadge = ({ status }) => {
  switch (status) {
    case 'ACTIVE':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
          <CheckCircle2 size={12} className="mr-1" /> Active
        </span>
      );

    case 'PENDING':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-100">
          <Clock size={12} className="mr-1" /> Pending Approval
        </span>
      );

    case 'SUSPENDED':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-100">
          <AlertCircle size={12} className="mr-1" /> Suspended
        </span>
      );

    default:
      return null;
  }
};

/* ---------- Country Accordion ---------- */

const CountryAccordion = ({ country }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-gray-100 rounded-xl mb-3 overflow-hidden transition-all duration-300">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-white hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center space-x-3">
          <span className="text-2xl">{country.flag}</span>
          <span className="font-semibold text-gray-800">{country.name}</span>
          <span className="bg-gray-100 text-gray-500 text-xs px-2 py-0.5 rounded-full font-bold">
            {country.cities.length} Cities
          </span>
        </div>
        {isOpen ? (
          <ChevronDown size={20} className="text-gray-400" />
        ) : (
          <ChevronRight size={20} className="text-gray-400" />
        )}
      </button>

      {isOpen && (
        <div className="bg-white border-t border-gray-50">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-400 font-medium uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3">City Name</th>
                  <th className="px-6 py-3">Operations Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {country.cities.map((city) => (
                  <tr
                    key={city.id}
                    className="hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-6 py-4 flex items-center font-medium text-gray-700">
                      <MapPin size={14} className="mr-2 text-gray-300" />
                      {city.name}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={city.status} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-blue-600 font-semibold hover:underline">
                        Manage
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

/* ---------- Region Section ---------- */

const RegionSection = ({ countries }) => {
  return (
    <section className="mt-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            Operating Regions
          </h2>
          <p className="text-sm text-gray-500">
            Manage your service availability across territories.
          </p>
        </div>

        <button className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm shadow-blue-200">
          + Add New Region
        </button>
      </div>

      <div className="grid grid-cols-1 gap-1">
        {countries.map((country) => (
          <CountryAccordion key={country.id} country={country} />
        ))}
      </div>
    </section>
  );
};

export default RegionSection;

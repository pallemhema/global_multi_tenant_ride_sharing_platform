import { useState, useRef, useEffect, useMemo } from "react";
import { ChevronDown } from "lucide-react";
import { lookupsAPI } from "../../services/lookups";

export const CountrySelector = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [countries, setCountries] = useState([]);
  const dropdownRef = useRef(null);

  // Load countries
  useEffect(() => {
    async function loadCountries() {
      try {
        const res = await lookupsAPI.fetchCountries();
        setCountries(res || []);
      } catch (err) {
        console.error("Failed to load countries", err);
      }
    }

    loadCountries();
  }, []);

  // Selected country
  const selectedCountry = useMemo(() => {
    return countries.find((c) => c.phone_code === value) || null;
  }, [countries, value]);

  // Filtered list
  const filteredCountries = useMemo(() => {
    return countries.filter(
      (c) =>
        c.country_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone_code.includes(searchTerm)
    );
  }, [countries, searchTerm]);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (phoneCode) => {
    onChange(phoneCode);
    setIsOpen(false);
    setSearchTerm("");
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full px-4 py-3 flex items-center justify-between bg-white border border-gray-300 rounded-lg hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
      >
        <div className="text-left">
          <div className="text-sm font-medium text-gray-700">
            {selectedCountry?.phone_code || "Select"}
          </div>
          <div className="text-xs text-gray-500">
            {selectedCountry?.country_name || ""}
          </div>
        </div>

        <ChevronDown
          size={20}
          className={`text-gray-400 transition ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-300 rounded-lg shadow-lg z-50">
          <input
            type="text"
            placeholder="Search country..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border-b border-gray-200 focus:outline-none text-sm"
          />

          <div className="max-h-64 overflow-y-auto">
            {filteredCountries.length > 0 ? (
              filteredCountries.map((country) => (
                <button
                  key={country.country_code}
                  type="button"
                  onClick={() => handleSelect(country.phone_code)}
                  className={`w-full px-4 py-3 text-left hover:bg-blue-50 transition ${
                    selectedCountry?.country_code ===
                    country.country_code
                      ? "bg-blue-100 border-l-4 border-blue-500"
                      : ""
                  }`}
                >
                  <div className="font-medium text-gray-900">
                    {country.country_name}
                  </div>
                  <div className="text-sm text-gray-500">
                    {country.phone_code}
                  </div>
                </button>
              ))
            ) : (
              <div className="px-4 py-8 text-center text-gray-500">
                No countries found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

import { useEffect, useState } from "react";
import { useTenant } from "../../../context/TenantContext";

export default function CountryCitySelector({
  onCountryChange,
  onCityChange,
}) {
  const { regions } = useTenant();

  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedCity, setSelectedCity] = useState("");

  // When country changes
  useEffect(() => {
    if (!selectedCountry) return;

    setSelectedCity("");
    onCountryChange?.(Number(selectedCountry));
    onCityChange?.(null);
  }, [selectedCountry]);

  // When city changes
  useEffect(() => {
    if (!selectedCity) return;
    onCityChange?.(Number(selectedCity));
  }, [selectedCity]);

  const selectedCountryObj = regions.find(
    (c) => c.country_id == selectedCountry
  );

  return (
    <div className="flex flex-col md:flex-row gap-4">
      {/* Country Dropdown */}
      <div className="flex flex-col w-full md:w-1/3">
        <label className="text-sm font-medium text-gray-700 mb-1">
          Select Country
        </label>
        <select
          value={selectedCountry}
          onChange={(e) => setSelectedCountry(e.target.value)}
          className="border rounded-lg p-2"
        >
          <option value="">-- Select Country --</option>

          {regions.map((country) => (
            <option
              key={country.country_id}
              value={country.country_id}
            >
              {country.name}
            </option>
          ))}
        </select>
      </div>

      {/* City Dropdown */}
      <div className="flex flex-col w-full md:w-1/3">
        <label className="text-sm font-medium text-gray-700 mb-1">
          Select City
        </label>
        <select
          value={selectedCity}
          onChange={(e) => setSelectedCity(e.target.value)}
          disabled={!selectedCountry}
          className="border rounded-lg p-2"
        >
          <option value="">-- Select City --</option>

          {selectedCountryObj?.cities
            ?.filter((city) => city.status === "ACTIVE")
            .map((city) => (
              <option key={city.id} value={city.id}>
                {city.name}
              </option>
            ))}
        </select>
      </div>
    </div>
  );
}

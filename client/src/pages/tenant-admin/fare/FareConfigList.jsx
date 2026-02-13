import { useEffect, useState } from "react";
import FareConfigCard from "./FareConfigCard";
import { lookupsAPI } from "../../../services/lookups";
export default function FareConfigList({
  configs,
  countryId,
  cityId,
  reload,
}) {
  const [vehicleCategories, setVehicleCategories] = useState([]);

  useEffect(() => {
    const loadCategories = async () => {
      const res = await lookupsAPI.getVehicleCategories()
      setVehicleCategories(res);
    };
    loadCategories();
  }, []);

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {vehicleCategories.map((category) => {
        const existing = configs.find(
          (c) => c.vehicle_category === category.category_code
        );

        return (
          <FareConfigCard
            key={category.category_code}
            category={category}
            existing={existing}
            countryId={countryId}
            cityId={cityId}
            reload={reload}
          />
        );
      })}
    </div>
  );
}

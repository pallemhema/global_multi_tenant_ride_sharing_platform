import { useState } from "react";
import FareConfigFormModal from "./FareConfigFormModal";
import { tenantAdminAPI } from "../../../services/tenantAdminApi";

export default function FareConfigCard({
  category,
  existing,
  countryId,
  cityId,
  reload,
}) {
  const [showModal, setShowModal] = useState(false);
  const [justExpired, setJustExpired] = useState(false);


 const handleDelete = async () => {
  if (!window.confirm("Expire this fare rule?")) return;

  await tenantAdminAPI.deleteFareConfig({
    country_id: countryId,
    city_id: cityId,
    vehicle_category: category.category_code,
  });

  setJustExpired(true);
  reload();
};

  return (
    <div className="border rounded-lg p-5 shadow-sm bg-white">
      <h3 className="font-semibold text-lg mb-3">
        {category.category_code}
      </h3>

      {existing ? (
  <div className="space-y-1 text-sm">
    <p>Base Fare: ₹{existing.base_fare}</p>
    <p>Rate/km: ₹{existing.rate_per_km}</p>
    <p>Rate/min: ₹{existing.rate_per_minute}</p>
    <p>Tax: {existing.tax_percentage}%</p>
     <p className="text-xs text-gray-500">
      Effective From:{" "}
      {new Date(existing.effective_from).toLocaleString()}
    </p>
    
  </div>
) : (
  <div>
    {justExpired ? (
      <p className="text-orange-600 text-sm font-medium">
        Fare config expired. Please create a new one.
      </p>
    ) : (
      <p className="text-gray-500 text-sm">No config set</p>
    )}
  </div>
)}


      <div className="mt-4 flex gap-2">
        <button
          onClick={() => setShowModal(true)}
          className="px-3 py-1 bg-blue-600 text-white rounded"
        >
          {existing ? "Edit" : "Create"}
        </button>

        {existing && (
          <button
            onClick={handleDelete}
            className="px-3 py-1 bg-red-600 text-white rounded"
          >
            Expire
          </button>
        )}
      </div>

      {showModal && (
        <FareConfigFormModal
          existing={existing}
          category={category}
          countryId={countryId}
          cityId={cityId}
          close={() => setShowModal(false)}
          reload={reload}
        />
      )}
    </div>
  );
}

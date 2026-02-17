import { useState } from "react";
import FareConfigFormModal from "./FareConfigFormModal";
import { tenantAdminAPI } from "../../../services/tenantAdminApi";
import { Edit3, Trash2, Clock, Tag, Percent } from "lucide-react";

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
    <div className="bg-white border rounded-lg p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
       
          <div>
            <h3 className="font-semibold text-lg">{category.category_code.charAt(0).toUpperCase() + category.category_code.slice(1)}</h3>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-400 text-white rounded"
          >
            {existing ?             <Edit3 className="w-4 h-4" />
  : "Create"}
          </button>
          {existing && (
            <button
              onClick={handleDelete}
              className="inline-flex items-center gap-2 px-3 py-1 bg-red-400 text-white rounded"
            >
              <Trash2 className="w-4 h-4" />
              
            </button>
          )}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        {existing ? (
          <>
            <div className="text-sm text-slate-600">
              <div className="text-xs text-slate-500">Base Fare</div>
              <div className="font-medium">₹{existing.base_fare}</div>
            </div>

            <div className="text-sm text-slate-600">
              <div className="text-xs text-slate-500">Rate / km</div>
              <div className="font-medium">₹{existing.rate_per_km}</div>
            </div>

            <div className="text-sm text-slate-600">
              <div className="text-xs text-slate-500">Rate / min</div>
              <div className="font-medium">₹{existing.rate_per_minute}</div>
            </div>

            <div className="text-sm text-slate-600">
              <div className="text-xs text-slate-500">Tax</div>
              <div className="font-medium flex items-center gap-2"><Percent className="w-3 h-3 text-slate-500" />{existing.tax_percentage}%</div>
            </div>
          </>
        ) : (
          <div className="col-span-2 text-sm text-slate-500">{justExpired ? (
            <span className="text-orange-600 font-medium">Fare config expired. Create a new one.</span>
          ) : (
            <span>No config set</span>
          )}</div>
        )}
      </div>

      {existing && (
        <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2"><Clock className="w-4 h-4" /> Effective: {new Date(existing.effective_from).toLocaleString()}</div>
          <div>Active</div>
        </div>
      )}

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

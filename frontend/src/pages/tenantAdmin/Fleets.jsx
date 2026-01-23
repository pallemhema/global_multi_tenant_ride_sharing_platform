import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { fetchFleets } from "../../services/tenants/tenantAdmin";

const Fleets = () => {
  const { user } = useAuth();
  const tenantId = user?.tenant_id;

  const [fleets, setFleets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tenantId) return;

    fetchFleets(tenantId)
      .then((res) => setFleets(res.data))
      .finally(() => setLoading(false));
  }, [tenantId]);
  console.log(fleets)

  return (
    <div className="p-8">
      <h2 className="text-xl font-bold mb-4">Fleets</h2>

      <div className="bg-white rounded-xl border overflow-hidden">
        {loading ? (
          <div className="p-6 text-sm text-gray-500">
            Loading fleets…
          </div>
        ) : fleets.length === 0 ? (
          <div className="p-6 text-sm text-gray-500">
            No fleets available
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="p-4 text-left">Fleet Name</th>
                <th className="p-4 text-left">Operator</th>
                <th className="p-4 text-left">Operating Region</th>
                <th className="p-4 text-right">Vehicles</th>
              </tr>
            </thead>

            <tbody>
              {fleets.map((fleet) => (
                <tr
                  key={fleet.fleet_owner_id}
                  className="border-t hover:bg-gray-50"
                >
                  <td className="p-4 font-medium">
                    {fleet.business_name}
                  </td>
                  <td className="p-4">
                    {fleet.contact_email || "—"}
                  </td>
                  <td className="p-4 text-gray-700">
                    {fleet.cities && fleet.cities.length > 0
                      ? fleet.cities.join(", ")
                      : "—"}
                  </td>

                  <td className="p-4 text-right font-semibold">
                    {fleet.vehicle_count}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Fleets;

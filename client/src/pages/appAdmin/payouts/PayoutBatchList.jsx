import { useEffect, useState } from "react";
import { appAdminAPI } from "../../../services/appAdminApi";
import { useNavigate } from "react-router-dom";

export default function PayoutBatchList() {
  const [batches, setBatches] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    appAdminAPI.listPayoutBatches().then(res => setBatches(res.data));
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Payout Batches</h1>

      <div className="bg-white shadow rounded">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-left">
            <tr>
              <th className="p-3">Batch ID</th>
              <th className="p-3">Tenant</th>
              <th className="p-3">Country</th>
              <th className="p-3">Period</th>
              <th className="p-3">Total Payouts</th>
              <th className="p-3">Amount</th>
              <th className="p-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {batches.map(b => (
              <tr
                key={b.batch_id}
                className="border-t hover:bg-gray-50 cursor-pointer"
                onClick={() => navigate(`/admin/payouts/${b.batch_id}`)}
              >
                <td className="p-3">{b.batch_id}</td>
                <td className="p-3">{b.tenant_id}</td>
                <td className="p-3">{b.country_id}</td>
                <td className="p-3">
                  {new Date(b.period_start_utc).toLocaleDateString()} →{" "}
                  {new Date(b.period_end_utc).toLocaleDateString()}
                </td>
                <td className="p-3">{b.total_payouts}</td>
                <td className="p-3">
                  {b.total_amount} {b.currency_code}
                </td>
                <td className="p-3">
                  <StatusBadge status={b.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    initiated: "bg-gray-200",
    calculated: "bg-blue-200",
    processing: "bg-yellow-200",
    completed: "bg-green-200",
    partial: "bg-orange-200",
  };

  return (
    <span className={`px-2 py-1 rounded text-xs ${map[status]}`}>
      {status}
    </span>
  );
}

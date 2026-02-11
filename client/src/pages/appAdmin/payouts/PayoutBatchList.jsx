import { useEffect } from "react";
import { useAppAdmin } from "../../../context/AppAdminContext";
import { useNavigate } from "react-router-dom";

export default function PayoutBatchList() {
  const { payoutBatches, loadPayoutBatches, loading, error, clearError } = useAppAdmin();
  const navigate = useNavigate();

  useEffect(() => {
    loadPayoutBatches();
  }, [loadPayoutBatches]);

  const handleRefresh = () => {
    clearError();
    loadPayoutBatches();
  };

  const handleRowClick = (batchId) => {
    navigate(`/dashboard/payouts/${batchId}`);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Payout Batches</h1>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded p-3">
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}

      {loading && payoutBatches.length === 0 ? (
        <div className="bg-white rounded shadow p-6 text-center text-gray-500">
          Loading payout batches...
        </div>
      ) : payoutBatches.length === 0 ? (
        <div className="bg-white rounded shadow p-6 text-center text-gray-500">
          No payout batches found
        </div>
      ) : (
        <div className="bg-white shadow rounded overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 text-left border-b">
              <tr>
                <th className="p-3 font-semibold">Batch ID</th>
                <th className="p-3 font-semibold">Tenant ID</th>
                <th className="p-3 font-semibold">Country</th>
                <th className="p-3 font-semibold">Currency</th>
                <th className="p-3 font-semibold">Period</th>
                <th className="p-3 font-semibold">Status</th>
                <th className="p-3 font-semibold text-right">Payouts</th>
                <th className="p-3 font-semibold text-right">Total Amount</th>
              </tr>
            </thead>
            <tbody>
              {payoutBatches.map((batch) => (
                <tr
                  key={batch.batch_id}
                  className="border-t hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => handleRowClick(batch.batch_id)}
                >
                  <td className="p-3 font-medium text-blue-600">#{batch.batch_id}</td>
                  <td className="p-3">{batch.tenant_id}</td>
                  <td className="p-3">{batch.country_id}</td>
                  <td className="p-3 font-mono">{batch.currency_code}</td>
                  <td className="p-3 text-xs">
                    <div>{new Date(batch.period_start_utc).toLocaleDateString()}</div>
                    <div className="text-gray-500">→ {new Date(batch.period_end_utc).toLocaleDateString()}</div>
                  </td>
                  <td className="p-3">
                    <StatusBadge status={batch.status} />
                  </td>
                  <td className="p-3 text-right">{batch.total_payouts}</td>
                  <td className="p-3 text-right font-mono">
                    {batch.total_amount.toFixed(2)} {batch.currency_code}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }) {
  const badges = {
    initiated: { bg: "bg-gray-100", text: "text-gray-800", label: "Initiated" },
    calculating: { bg: "bg-blue-100", text: "text-blue-800", label: "Calculating" },
    calculated: { bg: "bg-blue-100", text: "text-blue-800", label: "Calculated" },
    processing: { bg: "bg-yellow-100", text: "text-yellow-800", label: "Processing" },
    completed: { bg: "bg-green-100", text: "text-green-800", label: "Completed" },
    partial: { bg: "bg-orange-100", text: "text-orange-800", label: "Partial" },
    failed: { bg: "bg-red-100", text: "text-red-800", label: "Failed" },
  };

  const badge = badges[status] || badges.initiated;

  return (
    <span className={`px-2 py-1 rounded text-xs font-medium ${badge.bg} ${badge.text}`}>
      {badge.label}
    </span>
  );
}

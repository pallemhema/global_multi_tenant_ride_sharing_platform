import { useState } from "react";
import { useAppAdmin } from "../../../context/AppAdminContext";

export default function PayoutsTable({ payouts = [], batchId, loading = false }) {
  const { paySinglePayout, operationInProgress, error, clearError } = useAppAdmin();
  const [payingPayoutId, setPayingPayoutId] = useState(null);
  const [paymentResult, setPaymentResult] = useState(null);

  const handlePayPayout = async (payoutId) => {
    clearError();
    setPayingPayoutId(payoutId);
    setPaymentResult(null);

    const idempotencyKey = `payout-${payoutId}-${Date.now()}`;
    const res = await paySinglePayout(
        batchId,
        payoutId,
        {
          idempotency_key: idempotencyKey,
          payout_method: "manual"
        }
      );


    if (res.success) {
      setPaymentResult({
        success: true,
        payoutId,
        data: res.data,
      });
      // Clear result after 3 seconds
      setTimeout(() => setPaymentResult(null), 3000);
    } else {
      setPaymentResult({
        success: false,
        payoutId,
        error: res.error,
      });
    }

    setPayingPayoutId(null);
  };

  if (loading) {
    return (
      <div className="bg-white rounded shadow p-6 text-center text-gray-500">
        Loading payouts...
      </div>
    );
  }

  if (payouts.length === 0) {
    return (
      <div className="bg-white rounded shadow p-6 text-center text-gray-500">
        No payouts found for this batch
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {paymentResult && (
        <div
          className={`rounded p-3 ${
            paymentResult.success
              ? "bg-green-50 border border-green-200"
              : "bg-red-50 border border-red-200"
          }`}
        >
          <div
            className={`text-sm ${
              paymentResult.success ? "text-green-800" : "text-red-800"
            }`}
          >
            {paymentResult.success ? (
              <>
                <b>✓ Payment Processed:</b> Payout {paymentResult.payoutId} - {paymentResult.data.status}
              </>
            ) : (
              <>
                <b>✗ Payment Failed:</b> {paymentResult.error}
              </>
            )}
          </div>
        </div>
      )}

      <div className="bg-white rounded shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-left border-b">
            <tr>
              <th className="p-3 font-semibold">Payout ID</th>
              <th className="p-3 font-semibold">Entity Type</th>
              <th className="p-3 font-semibold">Owner Type</th>
              <th className="p-3 font-semibold">Entity ID</th>
              <th className="p-3 font-semibold text-right">Gross Amount</th>
              <th className="p-3 font-semibold text-right">Net Amount</th>
              <th className="p-3 font-semibold text-right">Paid Amount</th>
              <th className="p-3 font-semibold">Status</th>
              <th className="p-3 font-semibold text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {payouts.map((payout) => (
              <tr key={payout.payout_id} className="border-t hover:bg-gray-50">
                <td className="p-3 font-mono text-blue-600">#{payout.payout_id}</td>
                <td className="p-3 text-xs">{payout.entity_type}</td>
                <td className="p-3 text-xs">{payout.owner_type || "—"}</td>
                <td className="p-3 font-mono">{payout.entity_id}</td>
                <td className="p-3 font-mono text-right">
                  {parseFloat(payout.gross_amount || 0).toFixed(2)}
                </td>
                <td className="p-3 font-mono text-right">
                  {parseFloat(payout.net_amount || 0).toFixed(2)}
                </td>
                <td className="p-3 font-mono text-right font-semibold">
                  {parseFloat(payout.paid_amount || 0).toFixed(2)}
                </td>
                <td className="p-3">
                  <PayoutStatusBadge status={payout.status} />
                </td>
                <td className="p-3 text-right">
                  {payout.status === "pending" ? (
                    <button
                      onClick={() => handlePayPayout(payout.payout_id)}
                      disabled={operationInProgress || payingPayoutId === payout.payout_id}
                      className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {payingPayoutId === payout.payout_id ? "Processing..." : "Pay"}
                    </button>
                  ) : (
                    <span className="text-xs text-gray-500">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PayoutStatusBadge({ status }) {
  const badges = {
    pending: { bg: "bg-yellow-100", text: "text-yellow-800", label: "Pending" },
    paid: { bg: "bg-green-100", text: "text-green-800", label: "Paid" },
    failed: { bg: "bg-red-100", text: "text-red-800", label: "Failed" },
  };

  const badge = badges[status] || badges.pending;

  return (
    <span className={`px-2 py-1 rounded text-xs font-medium ${badge.bg} ${badge.text}`}>
      {badge.label}
    </span>
  );
}

export default function PaymentsTable({ payments = [], loading = false }) {
  if (loading) {
    return (
      <div className="bg-white rounded shadow p-6 text-center text-gray-500">
        Loading payments...
      </div>
    );
  }

  if (payments.length === 0) {
    return (
      <div className="bg-white rounded shadow p-6 text-center text-gray-500">
        No payments found for this period
      </div>
    );
  }

  return (
    <div className="bg-white rounded shadow overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-100 text-left border-b">
          <tr>
            <th className="p-3 font-semibold">Payment ID</th>
            <th className="p-3 font-semibold">Trip ID</th>
            <th className="p-3 font-semibold">Total Fare</th>
            <th className="p-3 font-semibold">Platform Fee</th>
            <th className="p-3 font-semibold">Tax</th>
            <th className="p-3 font-semibold">Driver Earning</th>
            <th className="p-3 font-semibold">Tenant Share</th>
            <th className="p-3 font-semibold">Created</th>
          </tr>
        </thead>
        <tbody>
          {payments.map((payment) => (
            <tr key={payment.payment_id} className="border-t hover:bg-gray-50">
              <td className="p-3 font-mono text-blue-600">#{payment.payment_id}</td>
              <td className="p-3 font-mono">{payment.trip_id}</td>
              <td className="p-3 font-mono">{parseFloat(payment.total_fare || 0).toFixed(2)}</td>
              <td className="p-3 font-mono">{parseFloat(payment.platform_fee || 0).toFixed(2)}</td>
              <td className="p-3 font-mono">{parseFloat(payment.tax || 0).toFixed(2)}</td>
              <td className="p-3 font-mono">{parseFloat(payment.driver_earning || 0).toFixed(2)}</td>
              <td className="p-3 font-mono">{parseFloat(payment.tenant_share || 0).toFixed(2)}</td>
              <td className="p-3 text-xs text-gray-600">
                {new Date(payment.paid_at_utc).toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

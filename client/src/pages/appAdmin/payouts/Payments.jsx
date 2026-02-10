function PaymentsTable({ payments }) {
  return (
    <table className="w-full bg-white rounded shadow text-sm">
      <thead className="bg-gray-100">
        <tr>
          <th className="p-2">Payment ID</th>
          <th className="p-2">Trip ID</th>
          <th className="p-2">Amount</th>
          <th className="p-2">Date</th>
        </tr>
      </thead>
      <tbody>
        {payments.map(p => (
          <tr key={p.payment_id} className="border-t">
            <td className="p-2">{p.payment_id}</td>
            <td className="p-2">{p.trip_id}</td>
            <td className="p-2">{p.total_amount}</td>
            <td className="p-2">
              {new Date(p.created_at_utc).toLocaleString()}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

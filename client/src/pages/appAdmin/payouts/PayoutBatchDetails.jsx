import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { appAdminAPI } from "../../../services/appAdminApi";
import PaymentsTable from "./PaymentsTable";
import PayoutsTable from "./PayoutsTable";

export default function PayoutBatchDetail() {
  const { batchId } = useParams();
  const [batch, setBatch] = useState(null);
  const [tab, setTab] = useState("payments");
  const [payments, setPayments] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    const res = await appAdminAPI.getPayoutBatchDetail(batchId);
    setBatch(res.data.batch);
    setPayouts(res.data.payouts);
  };

  const loadPayments = async () => {
    const res = await appAdminAPI.getBatchPayments(batchId);
    setPayments(res.data);
  };

  const handleCalculate = async () => {
    setLoading(true);
    await appAdminAPI.calculateBatchPayouts(batchId);
    await load();
    setLoading(false);
  };

  if (!batch) return null;

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-4">
        Payout Batch #{batch.batch_id}
      </h1>

      {/* Summary */}
      <div className="bg-white rounded shadow p-4 mb-4 grid grid-cols-4 gap-4 text-sm">
        <div>Status: <b>{batch.status}</b></div>
        <div>Tenant: <b>{batch.tenant_id}</b></div>
        <div>Country: <b>{batch.country_id}</b></div>
        <div>Currency: <b>{batch.currency_code}</b></div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-4">
        <button
          className={tab === "payments" ? "font-semibold" : ""}
          onClick={() => {
            setTab("payments");
            loadPayments();
          }}
        >
          Payments
        </button>
        <button
          className={tab === "payouts" ? "font-semibold" : ""}
          onClick={() => setTab("payouts")}
        >
          Payouts
        </button>
      </div>

      {/* Actions */}
      {batch.status === "initiated" && (
        <button
          disabled={loading}
          onClick={handleCalculate}
          className="mb-4 bg-blue-600 text-white px-4 py-2 rounded"
        >
          {loading ? "Calculating..." : "Calculate Payouts"}
        </button>
      )}

      {/* Content */}
      {tab === "payments" && <PaymentsTable payments={payments} />}
      {tab === "payouts" && <PayoutsTable payouts={payouts} />}
    </div>
  );
}

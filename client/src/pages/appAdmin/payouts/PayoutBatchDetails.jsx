import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAppAdmin } from "../../../context/AppAdminContext";
import PaymentsTable from "./Payments";
import PayoutsTable from "./Payouts";

export default function PayoutBatchDetail() {
  const { batchId } = useParams();
  const navigate = useNavigate();
  const {
    selectedBatch,
    batchPayments,
    batchPayouts,
    loading,
    operationInProgress,
    error,
    clearError,
    loadBatchDetail,
    loadBatchPayments,
    loadBatchPayouts,
    calculatePayouts,
    executeBatch,
  } = useAppAdmin();

  const [activeTab, setActiveTab] = useState("summary");
  const [executionIdempotencyKey, setExecutionIdempotencyKey] = useState(null);
  const [batchExecutionResponse, setBatchExecutionResponse] = useState(null);

  useEffect(() => {
    loadBatchDetail(batchId);
  }, [batchId, loadBatchDetail]);

  const handleCalculate = async () => {
    clearError();
    const res = await calculatePayouts(batchId);
    if (!res.success) {
      console.error("Calculate failed:", res.error);
    }
  };

  const handleExecute = async () => {
    clearError();
    const key = `exec-${Date.now()}`;
    setExecutionIdempotencyKey(key);
    const res = await executeBatch(batchId, key);
    if (res.success) {
      setBatchExecutionResponse(res.data);
    } else {
      console.error("Execute failed:", res.error);
    }
  };

  const handleLoadPayments = async () => {
    clearError();
    setActiveTab("payments");
    await loadBatchPayments(batchId);
  };

  const handleLoadPayouts = async () => {
    clearError();
    setActiveTab("payouts");
    await loadBatchPayouts(batchId);
  };

  if (!selectedBatch) {
    return (
      <div className="p-6">
        <div className="text-center text-gray-500">Loading batch details...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Payout Batch #{selectedBatch.batch_id}</h1>
        <button
          onClick={() => navigate("/dashboard/payouts")}
          className="text-sm px-3 py-2 border border-gray-300 rounded hover:bg-gray-50"
        >
          ← Back to List
        </button>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded p-3">
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}

      {batchExecutionResponse && (
        <div className="mb-4 bg-blue-50 border border-blue-200 rounded p-3">
          <div className="text-sm text-blue-800">
            <b>Batch Executed:</b> {batchExecutionResponse.total} total, {batchExecutionResponse.paid} paid, {batchExecutionResponse.failed} failed
          </div>
        </div>
      )}

      {/* Summary Section */}
      <div className="bg-white rounded shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Batch Summary</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Status:</span>
            <div className="mt-1"><StatusBadge status={selectedBatch.status} /></div>
          </div>
          <div>
            <span className="text-gray-600">Tenant ID:</span>
            <div className="font-mono mt-1">{selectedBatch.tenant_id}</div>
          </div>
          <div>
            <span className="text-gray-600">Country ID:</span>
            <div className="font-mono mt-1">{selectedBatch.country_id}</div>
          </div>
          <div>
            <span className="text-gray-600">Currency:</span>
            <div className="font-mono mt-1">{selectedBatch.currency_code}</div>
          </div>
          <div>
            <span className="text-gray-600">Period Start:</span>
            <div className="mt-1">{new Date(selectedBatch.period_start_utc).toLocaleString()}</div>
          </div>
          <div>
            <span className="text-gray-600">Period End:</span>
            <div className="mt-1">{new Date(selectedBatch.period_end_utc).toLocaleString()}</div>
          </div>
          <div>
            <span className="text-gray-600">Created:</span>
            <div className="mt-1">{new Date(selectedBatch.created_at_utc).toLocaleString()}</div>
          </div>
          {selectedBatch.processed_at_utc && (
            <div>
              <span className="text-gray-600">Processed:</span>
              <div className="mt-1">{new Date(selectedBatch.processed_at_utc).toLocaleString()}</div>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 mb-6">
        {selectedBatch.status === "initiated" && (
          <button
            disabled={operationInProgress || loading}
            onClick={handleCalculate}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
          >
            {loading ? "Calculating..." : "Calculate Payouts"}
          </button>
        )}

        {selectedBatch.status === "calculated" && (
          <button
            disabled={operationInProgress || loading}
            onClick={handleExecute}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 text-sm font-medium"
          >
            {operationInProgress ? "Executing..." : "Execute Batch"}
          </button>
        )}

        {(selectedBatch.status === "completed" || selectedBatch.status === "partial") && (
          <div className="flex gap-2">
            <span className="px-4 py-2 text-gray-600 text-sm">Batch Processing Complete</span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="flex gap-2 border-b">
          <button
            onClick={() => setActiveTab("summary")}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
              activeTab === "summary"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-600 hover:text-gray-800"
            }`}
          >
            Summary
          </button>
          <button
            onClick={handleLoadPayments}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
              activeTab === "payments"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-600 hover:text-gray-800"
            }`}
          >
            Payments ({batchPayments.length})
          </button>
          <button
            onClick={handleLoadPayouts}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
              activeTab === "payouts"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-600 hover:text-gray-800"
            }`}
          >
            Payouts ({batchPayouts.length})
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === "summary" && (
          <div className="bg-white rounded shadow p-6">
            <h3 className="font-semibold mb-4">Batch Information</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Payouts:</span>
                <span className="font-mono">{batchPayouts.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Amount:</span>
                <span className="font-mono">
                  {batchPayouts.reduce((sum, p) => sum + p.paid_amount, 0).toFixed(2)} {selectedBatch.currency_code}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Paid Payouts:</span>
                <span className="font-mono">{batchPayouts.filter(p => p.status === "paid").length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Pending Payouts:</span>
                <span className="font-mono">{batchPayouts.filter(p => p.status === "pending").length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Failed Payouts:</span>
                <span className="font-mono">{batchPayouts.filter(p => p.status === "failed").length}</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === "payments" && <PaymentsTable payments={batchPayments} loading={loading} />}
        {activeTab === "payouts" && <PayoutsTable payouts={batchPayouts} batchId={batchId} loading={loading} />}
      </div>
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

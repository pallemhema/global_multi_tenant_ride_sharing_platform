import { createContext, useContext, useState, useCallback } from "react";
import { appAdminAPI } from "../services/appAdminApi";

const AppAdminContext = createContext(null);

export function AppAdminProvider({ children }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [tenants, setTenants] = useState([]);
    const [payoutBatches, setPayoutBatches] = useState([]);
    const [selectedBatch, setSelectedBatch] = useState(null);
    const [batchPayments, setBatchPayments] = useState([]);
    const [batchPayouts, setBatchPayouts] = useState([]);
    const [operationInProgress, setOperationInProgress] = useState(false);
    const [tenantsSummary, setTenantsSummary] = useState(null);
    const [tenantDetails, setTenantDetails] = useState(null);
    const [tenantDocuments, setTenantDocuments] = useState([]);
    const [tenantAdmin, setTenantAdmin] = useState(null);

    // Load tenants
    const loadTenants = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await appAdminAPI.getTenants();
            setTenants(res.data);
        } catch (err) {
            setError(err.response?.data?.detail || "Failed to load tenants");
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    // Load payout batches
    const loadPayoutBatches = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await appAdminAPI.listPayoutBatches();
            setPayoutBatches(res.data);
        } catch (err) {
            setError(err.response?.data?.detail || "Failed to load payout batches");
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    // Create payout batch
    const createPayoutBatch = useCallback(async (payload) => {
        setLoading(true);
        setError(null);
        try {
            const res = await appAdminAPI.createPayoutBatch(payload);
            // Reload batches list
            const batchesRes = await appAdminAPI.listPayoutBatches();
            setPayoutBatches(batchesRes.data);
            return { success: true, data: res.data };
        } catch (err) {
            const errorMsg = err.response?.data?.detail || "Failed to create payout batch";
            setError(errorMsg);
            console.error(err);
            return { success: false, error: errorMsg };
        } finally {
            setLoading(false);
        }
    }, []);

    // Load batch detail
    const loadBatchDetail = useCallback(async (batchId) => {
        setLoading(true);
        setError(null);
        try {
            const res = await appAdminAPI.getPayoutBatchDetail(batchId);
            setSelectedBatch(res.data.batch);
            setBatchPayouts(res.data.payouts || []);
        } catch (err) {
            setError(err.response?.data?.detail || "Failed to load batch detail");
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    // Load batch payments
    const loadBatchPayments = useCallback(async (batchId) => {
        setLoading(true);
        setError(null);
        try {
            const res = await appAdminAPI.getBatchPayments(batchId);
            setBatchPayments(res.data);
        } catch (err) {
            setError(err.response?.data?.detail || "Failed to load batch payments");
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    // Load batch payouts
    const loadBatchPayouts = useCallback(async (batchId) => {
        setLoading(true);
        setError(null);
        try {
            const res = await appAdminAPI.getBatchPayouts(batchId);
            setBatchPayouts(res.data);
        } catch (err) {
            setError(err.response?.data?.detail || "Failed to load batch payouts");
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    // Calculate batch payouts
    const calculatePayouts = useCallback(async (batchId) => {
        setOperationInProgress(true);
        setError(null);
        try {
            await appAdminAPI.calculateBatchPayouts(batchId);
            // Reload batch detail to get updated status
            await loadBatchDetail(batchId);
            return { success: true };
        } catch (err) {
            const errorMsg = err.response?.data?.detail || "Failed to calculate payouts";
            setError(errorMsg);
            console.error(err);
            return { success: false, error: errorMsg };
        } finally {
            setOperationInProgress(false);
        }
    }, [loadBatchDetail]);

    // Execute batch
    const executeBatch = useCallback(async (batchId, executionIdempotencyKey) => {
        setOperationInProgress(true);
        setError(null);
        try {
            const res = await appAdminAPI.executeBatch(batchId, {
                payout_method: "manual",
                execution_idempotency_key: executionIdempotencyKey,
            });
            // Reload batch detail to get updated status
            await loadBatchDetail(batchId);
            return { success: true, data: res.data };
        } catch (err) {
            const errorMsg = err.response?.data?.detail || "Failed to execute batch";
            setError(errorMsg);
            console.error(err);
            return { success: false, error: errorMsg };
        } finally {
            setOperationInProgress(false);
        }
    }, [loadBatchDetail]);

    // Pay single payout
   const paySinglePayout = useCallback(
  async (batchId, payoutId, payload) => {
    setOperationInProgress(true);
    setError(null);

    try {
      const res = await appAdminAPI.paySinglePayout(
        batchId,
        payoutId,
        {
          payout_method: payload.payout_method,
          idempotency_key: payload.idempotency_key,
        }
      );

      if (batchId) {
        await loadBatchPayouts(batchId);
      }

      return { success: true, data: res.data };

    } catch (err) {
      let message = "Failed to pay payout";

      const detail = err.response?.data?.detail;

      if (Array.isArray(detail)) {
        message = detail.map(d => d.msg).join(", ");
      } else if (typeof detail === "string") {
        message = detail;
      }

      return { success: false, error: message };

    } finally {
      setOperationInProgress(false);
    }
  },
  [loadBatchPayouts]
);



    // Clear error
    const clearError = useCallback(() => {
        setError(null);
    }, []);

    // ==================== TENANT OPERATIONS ====================

    // Get tenants list
    const getTenants = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await appAdminAPI.getTenants();
            setTenants(res.data);
            return { success: true, data: res.data };
        } catch (err) {
            const errorMsg = err.response?.data?.detail || "Failed to load tenants";
            setError(errorMsg);
            console.error(err);
            return { success: false, error: errorMsg };
        } finally {
            setLoading(false);
        }
    }, []);

    // Get tenants summary
    const getTenantsSummaryData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await appAdminAPI.getTenantsSummary();
            setTenantsSummary(res.data);
            return { success: true, data: res.data };
        } catch (err) {
            const errorMsg = err.response?.data?.detail || "Failed to load tenants summary";
            setError(errorMsg);
            console.error(err);
            return { success: false, error: errorMsg };
        } finally {
            setLoading(false);
        }
    }, []);

    // Get tenant details
    const getTenantDetailsData = useCallback(async (tenantId) => {
        setLoading(true);
        setError(null);
        try {
            const res = await appAdminAPI.getTenantDetails(tenantId);
            setTenantDetails(res.data);
            return { success: true, data: res.data };
        } catch (err) {
            const errorMsg = err.response?.data?.detail || "Failed to load tenant details";
            setError(errorMsg);
            console.error(err);
            return { success: false, error: errorMsg };
        } finally {
            setLoading(false);
        }
    }, []);

    // Get tenant documents
    const getTenantDocumentsData = useCallback(async (tenantId) => {
        setLoading(true);
        setError(null);
        try {
            const res = await appAdminAPI.getTenantDocuments(tenantId);
            setTenantDocuments(res.data);
            return { success: true, data: res.data };
        } catch (err) {
            const errorMsg = err.response?.data?.detail || "Failed to load tenant documents";
            setError(errorMsg);
            console.error(err);
            return { success: false, error: errorMsg };
        } finally {
            setLoading(false);
        }
    }, []);

    // Get tenant admin
    const getTenantAdminData = useCallback(async (tenantId) => {
        setLoading(true);
        setError(null);
        try {
            const res = await appAdminAPI.getTenantAdmin(tenantId);
            setTenantAdmin(res.data);
            return { success: true, data: res.data };
        } catch (err) {
            const errorMsg = err.response?.data?.detail || "Failed to load tenant admin";
            setError(errorMsg);
            console.error(err);
            return { success: false, error: errorMsg };
        } finally {
            setLoading(false);
        }
    }, []);

    // Create tenant
    const createTenantData = useCallback(async (payload) => {
        setOperationInProgress(true);
        setError(null);
        try {
            const res = await appAdminAPI.createTenant(payload);
            // Reload tenants list
            await getTenants();
            return { success: true, data: res.data };
        } catch (err) {
            const errorMsg = err.response?.data?.detail || "Failed to create tenant";
            setError(errorMsg);
            console.error(err);
            return { success: false, error: errorMsg };
        } finally {
            setOperationInProgress(false);
        }
    }, [getTenants]);

    // Create tenant admin
    const createTenantAdminData = useCallback(async (tenantId, payload) => {
        setOperationInProgress(true);
        setError(null);
        try {
            const res = await appAdminAPI.createTenantAdmin(tenantId, payload);
            return { success: true, data: res.data };
        } catch (err) {
            const errorMsg = err.response?.data?.detail || "Failed to create tenant admin";
            setError(errorMsg);
            console.error(err);
            return { success: false, error: errorMsg };
        } finally {
            setOperationInProgress(false);
        }
    }, []);

    // Approve tenant
    const approveTenantData = useCallback(async (tenantId) => {
        setOperationInProgress(true);
        setError(null);
        try {
            await appAdminAPI.approveTenant(tenantId);
            // Reload tenants
            await getTenants();
            return { success: true };
        } catch (err) {
            const errorMsg = err.response?.data?.detail || "Failed to approve tenant";
            setError(errorMsg);
            console.error(err);
            return { success: false, error: errorMsg };
        } finally {
            setOperationInProgress(false);
        }
    }, [getTenants]);

    // Reject tenant
    const rejectTenantData = useCallback(async (tenantId) => {
        setOperationInProgress(true);
        setError(null);
        try {
            await appAdminAPI.rejectTenant(tenantId);
            // Reload tenants
            await getTenants();
            return { success: true };
        } catch (err) {
            const errorMsg = err.response?.data?.detail || "Failed to reject tenant";
            setError(errorMsg);
            console.error(err);
            return { success: false, error: errorMsg };
        } finally {
            setOperationInProgress(false);
        }
    }, [getTenants]);

    // Approve document
    const approveDocumentData = useCallback(async (tenantId, docId) => {
        setOperationInProgress(true);
        setError(null);
        try {
            await appAdminAPI.approveDocument(tenantId, docId);
            return { success: true };
        } catch (err) {
            const errorMsg = err.response?.data?.detail || "Failed to approve document";
            setError(errorMsg);
            console.error(err);
            return { success: false, error: errorMsg };
        } finally {
            setOperationInProgress(false);
        }
    }, []);

    // Reject document
    const rejectDocumentData = useCallback(async (tenantId, docId) => {
        setOperationInProgress(true);
        setError(null);
        try {
            await appAdminAPI.rejectDocument(tenantId, docId);
            return { success: true };
        } catch (err) {
            const errorMsg = err.response?.data?.detail || "Failed to reject document";
            setError(errorMsg);
            console.error(err);
            return { success: false, error: errorMsg };
        } finally {
            setOperationInProgress(false);
        }
    }, []);

    const value = {
        // State
        loading,
        error,
        operationInProgress,
        tenants,
        payoutBatches,
        selectedBatch,
        batchPayments,
        batchPayouts,
        tenantsSummary,
        tenantDetails,
        tenantDocuments,
        tenantAdmin,
        
        // Payout Actions
        loadTenants,
        loadPayoutBatches,
        createPayoutBatch,
        loadBatchDetail,
        loadBatchPayments,
        loadBatchPayouts,
        calculatePayouts,
        executeBatch,
        paySinglePayout,
        
        // Tenant Actions
        getTenants,
        getTenantsSummaryData,
        getTenantDetailsData,
        getTenantDocumentsData,
        getTenantAdminData,
        createTenantData,
        createTenantAdminData,
        approveTenantData,
        rejectTenantData,
        approveDocumentData,
        rejectDocumentData,
        
        // Utilities
        clearError,
        setSelectedBatch,
    };

    return (
        <AppAdminContext.Provider value={value}>
            {children}
        </AppAdminContext.Provider>
    );
}

export function useAppAdmin() {
    const context = useContext(AppAdminContext);
    if (!context) {
        throw new Error("useAppAdmin must be used within AppAdminProvider");
    }
    return context;
}

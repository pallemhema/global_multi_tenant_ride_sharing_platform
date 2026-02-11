import { apiClient } from "./axios";



// App Admin endpoints
export const appAdminAPI = {
  // Tenants
  getTenants: () => {
    return apiClient.get('/app-admin/tenants');
  },

  getTenantsSummary: () => {
    return apiClient.get('/app-admin/tenants/summary');
  },

  getTenantDetails: (tenantId) => {
    return apiClient.get(`/app-admin/tenants/${tenantId}`);
  },
    
  createTenant:(payload)=>{
    return apiClient.post("/app-admin/tenants",payload);
  },


  approveTenant: (tenantId) => {
    return apiClient.post(`/app-admin/tenants/${tenantId}/approve`);
  },

  rejectTenant: (tenantId) => {
    return apiClient.post(`/app-admin/tenants/${tenantId}/reject`);
  },


  // Documents
  getTenantDocuments: (tenantId) => {
    return apiClient.get(`/app-admin/tenants/${tenantId}/documents`);
  },



  approveDocument: (tenantId, docId) => {
    return apiClient.post(
      `/app-admin/tenants/${tenantId}/documents/${docId}/verify`
    );
  },

  rejectDocument: (tenantId, docId) => {
    return apiClient.post(
      `/app-admin/tenants/${tenantId}/documents/${docId}/verify`
    );
  },

  createTenantAdmin:(createdTenantId,payload)=>{
    return apiClient.post(`/app-admin/tenants/${createdTenantId}/admins`,payload);
  },

  getTenantAdmins: (tenantId) => {
    return apiClient.get(`/app-admin/tenant-admins?tenant_id=${tenantId}`);
  },

  getTenantAdmin: (tenantId) => {
    return apiClient.get(`/app-admin/tenants/${tenantId}/admin`);
  },

  createPayoutBatch : (payload) =>{
   return apiClient.post("/app-admin/payout-batches", payload)
  },

  listPayoutBatches : () =>{
   return apiClient.get("/app-admin/payout-batches");
  },

  getPayoutBatchDetail: (batchId) =>{
    return apiClient.get(`/app-admin/payout-batches/${batchId}`);
  },

  executeBatch : (batchId, payload) =>{
    return apiClient.post(`/app-admin/payout-batches/${batchId}/execute`, payload);
  },

  getBatchPayments : (batchId) =>{
  return apiClient.get(`/app-admin/payout-batches/${batchId}/payments`);
 },

  getBatchPayouts : (batchId) =>{
  return apiClient.get(`/app-admin/payout-batches/${batchId}/payouts`);
 },

  calculateBatchPayouts : (batchId) =>{
  return apiClient.post(`/app-admin/payout-batches/${batchId}/calculate`);
 },

 paySinglePayout: (batchId, payoutId, payload) => {
  return apiClient.post(
    `/app-admin/payout-batches/${batchId}/payouts/${payoutId}/pay`,
    payload
  );
}


};





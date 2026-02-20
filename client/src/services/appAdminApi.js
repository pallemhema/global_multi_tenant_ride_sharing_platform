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
    return apiClient.post("/app-admin/create-tenant",payload);
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
      `/app-admin/tenants/${tenantId}/documents/${docId}/approve`
    );
  },

  rejectDocument: (tenantId, docId) => {
    return apiClient.post(
      `/app-admin/tenants/${tenantId}/documents/${docId}/reject`
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

  getUnsettledPeriods : (params) =>{
   return apiClient.get("/app-admin/payouts/unsettled-periods", { params });
  },

  createBatch :(params) =>{
   return apiClient.post("/app-admin/payouts/create-from-period", null, { params });
  },
  
  listPayoutBatches : () =>{
   return apiClient.get("/app-admin/payouts/batches");
  },


  getPayoutBatchDetail: (batchId) =>{
    return apiClient.get(`/app-admin/payouts/batches/details/${batchId}`);
  },

 
  getBatchPayments : (batchId) =>{
  return apiClient.get(`/app-admin/payouts/batches/${batchId}/payments`);
 },

  getBatchPayouts : (batchId) =>{
  return apiClient.get(`/app-admin/payouts/batches/${batchId}`);
 },

  calculateBatchPayouts : (batchId) =>{
  return apiClient.post(`/app-admin/payouts/batches/${batchId}/calculate`);
 },
  executeBatch : (batchId, payload) =>{
    return apiClient.post(`/app-admin/payouts/batches/${batchId}/execute`, payload);
  },


 paySinglePayout: (batchId, payoutId, payload) => {
  return apiClient.post(
    `/app-admin/payouts/batches/${batchId}/payouts/${payoutId}/pay`,
    payload
  );
},
};





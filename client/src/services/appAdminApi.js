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

  approveTenant: (tenantId) => {
    return apiClient.post(`/app-admin/tenants/${tenantId}/approve`);
  },

  // Documents
  getTenantDocuments: (tenantId) => {
    return apiClient.get(`/app-admin/tenants/${tenantId}/documents`);
  },

  verifyDocument: (tenantId, docId) => {
    return apiClient.post(
      `/app-admin/tenants/${tenantId}/documents/${docId}/verify`
    );
  },

  // Tenant Admins
  createTenantAdmin: (tenantId, data) => {
    return apiClient.post(`/app-admin/tenant-admins`, {
      tenant_id: tenantId,
      ...data,
    });
  },

  getTenantAdmins: (tenantId) => {
    return apiClient.get(`/app-admin/tenant-admins?tenant_id=${tenantId}`);
  },

  getTenantAdmin: (tenantId) => {
    return apiClient.get(`/app-admin/tenants/${tenantId}/admin`);
  },
};

// Lookups endpoints
export const lookupsAPI = {
  getTenantDocumentTypes: () => {
    return apiClient.get('/lookups/tenant-document-types');
  },
};

export default apiClient;

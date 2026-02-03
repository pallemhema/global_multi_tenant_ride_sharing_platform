import { apiClient } from "./axios";
// Tenant Admin Dashboard
export const tenantAdminAPI = {
  // Dashboard - Summary stats
  getDashboardStats: (tenantId) => {
    return apiClient.get(`/tenant-admin/${tenantId}/dashboard`);
  },

  // Documents
  getDocumentTypes: (tenantId) => {
    return apiClient.get(`/tenant-admin/${tenantId}/document-types`);
  },

  getDocuments: (tenantId) => {
    return apiClient.get(`/tenant-admin/${tenantId}/documents`);
  },

  uploadDocument: (tenantId, formData) => {
    return apiClient.post(`/tenant-admin/${tenantId}/documents`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  updateDocument: (tenantId, docId, formData) => {
    return apiClient.put(`/tenant-admin/${tenantId}/documents/${docId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  deleteDocument: (tenantId, docId) => {
    return apiClient.delete(`/tenant-admin/${tenantId}/documents/${docId}`);
  },

  // Regions
  getRegions: (tenantId) => {
    return apiClient.get(`/tenant-admin/${tenantId}/regions`);
  },

  addRegion: (tenantId, data) => {
    return apiClient.post(`/tenant-admin/${tenantId}/regions`, data);
  },

  updateRegionCity: (tenantId, regionId, data) => {
    return apiClient.put(`/tenant-admin/${tenantId}/regions/${regionId}`, data);
  },

  enableRegionCity : (tenantId, cityId) =>{
  return apiClient.patch(`/tenant-admin/${tenantId}/regions/${cityId}/enable`);
  },

  disableRegionCity : (tenantId, cityId) =>{
  return apiClient.patch(`/tenant-admin/${tenantId}/regions/${cityId}/disable`);
  },

  getAvailableCities:(tenantId, countryId)=>{
    return apiClient.get(`/tenant-admin/${tenantId}/regions/available-cities`, {
    params: { country_id: countryId },
  })
  },


  getVehicles: (tenantId) => {
    return apiClient.get(`/tenant-admin/${tenantId}/vehicles`);
  },

  getVehicleDocuments: (tenantId, vehicleId) => {
    return apiClient.get(
      `/tenant-admin/${tenantId}/vehicles/${vehicleId}/documents`
    );
  },


  approveVehicleDocument: (tenantId, vehicleId, docId) => {
  return apiClient.put(
    `/tenant-admin/${tenantId}/vehicles/${vehicleId}/documents/${docId}/approve`
  );
},

  rejectVehicleDocument: (tenantId, vehicleId, docId, reason) => {
    return apiClient.put(
      `/tenant-admin/${tenantId}/vehicles/${vehicleId}/documents/${docId}/reject`,
      { reason }
    );
  },

  approveVehicle: (tenantId, vehicleId) => {
    return apiClient.post(`/tenant-admin/${tenantId}/vehicles/${vehicleId}/approve`);
  },

  // Fleet Owners
  getPendingFleetOwners: (tenantId) => {
    return apiClient.get(`/tenant-admin/${tenantId}/fleet-owners`);
  },

  getFleetOwners: (tenantId) => {
    return apiClient.get(`/tenant-admin/${tenantId}/fleet-owners/`);
  },

  getFleetOwnerDocuments: (tenantId, fleetOwnerId) => {
    return apiClient.get(
      `/tenant-admin/${tenantId}/fleet-owners/${fleetOwnerId}/documents`
    );
  },

  approveFleetOwnerDocument: (tenantId, fleetOwnerId, docId) => {
    return apiClient.put(
      `/tenant-admin/${tenantId}/fleet-owners/${fleetOwnerId}/documents/${docId}/approve`
    );
  },

  rejectFleetOwnerDocument: (tenantId, fleetOwnerId, docId, reason) => {
    return apiClient.put(
      `/tenant-admin/${tenantId}/fleet-owners/${fleetOwnerId}/documents/${docId}/reject`,
      { reason }
    );
  },

  approveFleetOwner: (tenantId, fleetOwnerId) => {
    return apiClient.post(
      `/tenant-admin/${tenantId}/fleet-owners/${fleetOwnerId}/approve`
    );
  },

  // Drivers
 

  getDrivers: (tenantId) => {
    return apiClient.get(`/tenant-admin/${tenantId}/drivers`);
  },

  getDriverDocuments: (tenantId, driverId) => {
    return apiClient.get(`/tenant-admin/${tenantId}/drivers/${driverId}/documents`);
  },

  approveDriverDocument: (tenantId, driverId, docId) => {
    return apiClient.put(
      `/tenant-admin/${tenantId}/drivers/${driverId}/documents/${docId}/approve`
    );
  },

  rejectDriverDocument: (tenantId, driverId, docId, reason) => {
    return apiClient.put(
      `/tenant-admin/${tenantId}/drivers/${driverId}/documents/${docId}/reject`,
      { reason }
    );
  },

  approveDriver: (tenantId, driverId) => {
    return apiClient.put(`/tenant-admin/${tenantId}/drivers/${driverId}/approve`);
  },

  // Profile
  getTenantProfile: (tenantId) => {
    return apiClient.get(`/tenant-admin/${tenantId}`);
  },
};

export default apiClient;

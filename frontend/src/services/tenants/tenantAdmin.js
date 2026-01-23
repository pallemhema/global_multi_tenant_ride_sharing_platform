import api from "../axios";

export const fetchTenantDashboard = (tenantId) =>
  api.get(`/tenant-admin/${tenantId}/dashboard`);


/* ===============================
   TENANT DOCUMENTS
================================ */

export const fetchTenantDocuments = (tenantId) =>
  api.get(`/tenant-admin/${tenantId}/documents`);

export const uploadTenantDocument = (tenantId, formData) => {
  return api.post(
    `/tenant-admin/${tenantId}/documents`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
};




export const updateTenantDocument = (
  tenantId,
  docId,
  formData
) =>
  api.put(
    `/tenant-admin/${tenantId}/documents/${docId}`,
    formData
  );


//apporve fleet owner
export const fetchFleetOwnerDocuments = (tenantId, fleetOwnerId) =>
  api.get(`/tenant-admin/${tenantId}/fleet-owners/${fleetOwnerId}/documents`);

export const approveFleetOwnerDocument = (docId) =>
  api.put(`/tenant-admin/fleet-owner-documents/${docId}/approve`);

export const rejectFleetOwnerDocument = (docId) =>
  api.put(`/tenant-admin/fleet-owner-documents/${docId}/reject`);

export const approveFleetOwner = (tenantId, fleetOwnerId) =>
  api.post(`/tenant-admin/${tenantId}/fleet-owners/${fleetOwnerId}/approve`);


export const fetchPendingFleetOwners = (tenantId) =>
  api.get(`/tenant-admin/${tenantId}/fleet-owners/pending`);


export const fetchFleets = (tenantId) =>
  api.get(`/tenant-admin/${tenantId}/fleets`);


//vehciles

export const fetchPendingVehicles = (tenantId) =>
  api.get(`/tenant-admin/${tenantId}/vehicles/pending`);

export const fetchVehicleDocuments = (tenantId, vehicleId) =>
  api.get(`/tenant-admin/${tenantId}/vehicles/${vehicleId}/documents`);

export const approveVehicleDocument = (docId) =>
  api.put(`/tenant-admin/vehicle-documents/${docId}/approve`);

export const rejectVehicleDocument = (docId) =>
  api.put(`/tenant-admin/vehicle-documents/${docId}/reject`);

export const approveVehicle = (tenantId, vehicleId) =>
  api.post(`/tenant-admin/${tenantId}/vehicles/${vehicleId}/approve`);


//driver approval
export const fetchPendingDrivers = (tenantId) =>
  api.get(`/tenant-admin/${tenantId}/drivers/pending`);

export const approveDriver = (tenantId, driverId) =>
  api.post(`/tenant-admin/${tenantId}/drivers/${driverId}/approve`);


export const fetchDriverDocuments = (tenantId, driverId) =>
  api.get(`/tenant-admin/${tenantId}/drivers/${driverId}/documents`);

export const approveDriverDocument = (docId) =>
  api.put(`/tenant-admin/documents/${docId}/approve`);

export const rejectDriverDocument = (docId) =>
  api.put(`/tenant-admin/documents/${docId}/reject`);

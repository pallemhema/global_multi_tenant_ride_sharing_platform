import { apiClient } from "./axios";

/* ================= VEHICLES ================= */

export const vehicleApi = {
  /* -------- Vehicles -------- */

  listVehicles: async () => {
    const res = await apiClient.get('/vehicles');
    return res.data;
  },

  createVehicle: async (payload) => {
    const res = await apiClient.post('/vehicles/add', payload);
    return res.data;
  },

  updateVehicle: async (vehicleId, payload) => {
    const res = await apiClient.put(`/vehicles/${vehicleId}/edit`, payload);
    return res.data;
  },

  deleteVehicle: async (vehicleId) => {
    const res = await apiClient.delete(`/vehicles/${vehicleId}/delete`);
    return res.data;
  },

  /* -------- Vehicle Documents -------- */

  listVehicleDocuments: async (vehicleId) => {
    const res = await apiClient.get(
      `/vehicles/${vehicleId}/documents`
    );
    return res.data;
  },

  uploadVehicleDocument: async (
    vehicleId,
    {
      document_type,
      document_number,
      expiry_date,
      file,
    }
  ) => {
    const formData = new FormData();
    formData.append('document_type', document_type);
    if (document_number)
      formData.append('document_number', document_number);
    if (expiry_date)
      formData.append('expiry_date', expiry_date);
    formData.append('file', file);

    const res = await apiClient.post(
      `/vehicles/${vehicleId}/documents`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    return res.data;
  },

  updateVehicleDocument: async (
  vehicleId,
  documentId,
  { file }
) => {
  const formData = new FormData();
  formData.append('file', file);

  const res = await apiClient.put(
    `/vehicles/${vehicleId}/documents/${documentId}`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );

  return res.data;
},


  deleteVehicleDocument: async (vehicleId, documentId) => {
  const res = await apiClient.delete(
    `/vehicles/${vehicleId}/documents/${documentId}`
  );
  return res.data;
},

};

import { apiClient } from "./axios";

export const driverApi = {
  

  async selectTenantForDriver(tenant_id, home_city_id = null) {
    try {
      const res = await apiClient.post("/driver/select-tenant", {
        tenant_id,
        home_city_id,
      });
      return res.data;
    } catch (err) {
      throw new Error(
        err.response?.data?.message ||
          err.response?.data?.detail ||
          "Failed to select tenant"
      );
    }
  },


  uploadDriverDocument: async (
  document_type,
  document_number,
  expiry_date,
  file
) => {
  const formData = new FormData();
  formData.append('document_type', document_type);

  if (document_number) {
    formData.append('document_number', document_number);
  }

  if (expiry_date) {
    formData.append('expiry_date', expiry_date);
  }

  formData.append('file', file);

  const res = await apiClient.post('/documents', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return res.data;
},

 
  async getDriverDocuments() {
    try {
      const res = await apiClient.get("/driver/documents");
      return res.data;
    } catch (err) {
      throw new Error(
        err.response?.data?.message ||
          err.response?.data?.detail ||
          "Failed to fetch documents"
      );
    }
  },

  updateDriverDocument: async (
  documentId,
  { document_number, expiry_date, file }
) => {
  const formData = new FormData();

  if (document_number !== undefined) {
    formData.append('document_number', document_number);
  }

  if (expiry_date !== undefined) {
    formData.append('expiry_date', expiry_date);
  }

  if (file) {
    formData.append('file', file);
  }

  const res = await apiClient.put(
    `/documents/${documentId}`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );

  return res.data;
},

deleteDriverDocument: async (documentId) => {
  await apiClient.delete(`/documents/${documentId}`);
},

 
  async getDriverProfile() {
    try {
      const res = await apiClient.get("/driver/profile");
      return res.data;
    } catch (err) {
      throw new Error(
        err.response?.data?.message ||
          err.response?.data?.detail ||
          "Failed to fetch driver profile"
      );
    }
  },

  async updateDriverProfile(profileData) {
    try {
      const res = await apiClient.put("/driver/profile", profileData);
      return res.data;
    } catch (err) {
      throw new Error(
        err.response?.data?.message ||
          err.response?.data?.detail ||
          "Failed to update profile"
      );
    }
  },
    async deleteDriverDocument(docId) {
    try {
      const res = await apiClient.delete(`/driver/documents/${docId}`);
      return res.data;
    } catch (err) {
      throw new Error(
        err.response?.data?.message ||
          err.response?.data?.detail ||
          "Failed to delete document"
      );
    }
  },

 
  async getDriverInvites (){
  const res = await apiClient.get('/driver/invites');
  return res.data;
},

  

  getShiftStatus: async () => {
    const res = await apiClient.get('/driver/shift/current');
    return res.data;
  },

  startShift: async payload => {
    const res = await apiClient.post('/driver/shift/start', payload);
    return res.data;
  },

  endShift: async () => {
    const res = await apiClient.post('/driver/shift/end');
    return res.data;
  },

  getVehicleSummary: async () => {
    const res = await apiClient.get('/driver/vehicles/summary');
    return res.data;
  },

   sendLocationHeartbeat: async (payload) => {
    const res = await apiClient.post('/driver/location/heartbeat', payload);
    return res.data;
  },


  async getRuntimeStatus() {
    try {
      const res = await apiClient.get("/driver/runtime-status");
      return res.data;
    } catch (err) {
      console.warn('Runtime status not available:', err.message);
      return null;
    }
  },
  updateRuntimeStatus: async (status) => {
  return apiClient.put('/driver/runtime-status', {
    runtime_status: status,
  });
},




};

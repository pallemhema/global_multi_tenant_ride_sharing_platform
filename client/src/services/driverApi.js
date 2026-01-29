import { apiClient } from "./axios";

export const driverApi = {
  /* ===============================
     ONBOARDING ENDPOINTS
  =============================== */

  async selectTenantForDriver(tenant_id) {
    try {
      const res = await apiClient.post("/driver/select-tenant", {
        tenant_id,
      });
      return res.data;
    } catch (err) {
      throw new Error(
        err.response?.data?.detail ||
          err.response?.data?.message ||
          "Failed to select tenant",
      );
    }
  },

  async updateDriverType(driver_type) {
    try {
      const res = await apiClient.put("/driver/driver-type", {
        driver_type,
      });
      return res.data;
    } catch (err) {
      throw new Error(
        err.response?.data?.detail ||
          err.response?.data?.message ||
          "Failed to update driver type",
      );
    }
  },

  async submitDocuments() {
    try {
      const res = await apiClient.post("/driver/submit-documents");
      return res.data;
    } catch (err) {
      throw new Error(
        err.response?.data?.detail ||
          err.response?.data?.message ||
          "Failed to submit documents",
      );
    }
  },

  /* ===============================
     DOCUMENT ENDPOINTS
  =============================== */

// uploadDriverDocument: async (
//   document_type,
//   document_number,
//   expiry_date,
//   file
// ) => {
//   console.log("file in driverApi:",file);
//   console.log("document_type in driverApi:",document_type);
//   console.log("document_number in driverApi:",document_number);
//   console.log("expiry_date in driverApi:",expiry_date);
//   const formData = new FormData();

//   formData.append("document_type", document_type);

//   if (document_number) {
//     formData.append("document_number", document_number);
//   }

//   if (expiry_date) {
//     formData.append("expiry_date", expiry_date);
//   }

//   formData.append("file", file); // ✅ correct key

//   // ❌ DO NOT set Content-Type manually
//   const res = await apiClient.post("/driver/documents", formData);

//   return res.data;
// },
uploadDriverDocument: async ({
  document_type,
  document_number,
  expiry_date,
  file,
}) => {

  if (!file) {
    throw new Error("File is required");
  }

  const formData = new FormData();
  formData.append("document_type", document_type);

  if (document_number) {
    formData.append("document_number", document_number);
  }

  if (expiry_date) {
    formData.append("expiry_date", expiry_date);
  }

  formData.append("file", file);

  const res = await apiClient.post("/driver/documents", formData);
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
          "Failed to fetch documents",
      );
    }
  },

  updateDriverDocument: async (
    documentId,
    { document_number, expiry_date, file },
  ) => {
    const formData = new FormData();

    if (document_number !== undefined) {
      formData.append("document_number", document_number);
    }

    if (expiry_date !== undefined) {
      formData.append("expiry_date", expiry_date);
    }

    if (file) {
      formData.append("file", file);
    }

    const res = await apiClient.put(
      `/driver/documents/${documentId}`,
      formData,
    );

    return res.data;
  },

  deleteDriverDocument: async (documentId) => {
    try {
      await apiClient.delete(`/driver/documents/${documentId}`);
    } catch (err) {
      throw new Error(
        err.response?.data?.detail ||
          err.response?.data?.message ||
          "Failed to delete document",
      );
    }
  },

  /* ===============================
     PROFILE ENDPOINTS
  =============================== */

  async getDriverProfile() {
    try {
      const res = await apiClient.get("/driver/profile");
      return res.data;
    } catch (err) {
      throw new Error(
        err.response?.data?.message ||
          err.response?.data?.detail ||
          "Failed to fetch driver profile",
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
          "Failed to update profile",
      );
    }
  },

  async getDriverInvites() {
    try {
      const res = await apiClient.get("/driver/invites");
      return res.data;
    } catch (err) {
      throw new Error(
        err.response?.data?.detail ||
          err.response?.data?.message ||
          "Failed to fetch invites",
      );
    }
  },

  /* ===============================
     SHIFT ENDPOINTS
  =============================== */

  getShiftStatus: async () => {
    const res = await apiClient.get("/driver/shift/current");
    return res.data;
  },

  startShift: async (payload) => {
    const res = await apiClient.post("/driver/shift/start", payload);
    return res.data;
  },

  endShift: async (payload) => {
    const res = await apiClient.post("/driver/shift/end", payload || {});
    return res.data;
  },

  /* ===============================
     VEHICLE & RUNTIME ENDPOINTS
  =============================== */

  getVehicleSummary: async () => {
    const res = await apiClient.get("/driver/vehicles/summary");
    return res.data;
  },

  sendLocationHeartbeat: async (payload) => {
    const res = await apiClient.post("/driver/location/heartbeat", payload);
    return res.data;
  },

  async getRuntimeStatus() {
    try {
      const res = await apiClient.get("/driver/runtime-status");
      return res.data;
    } catch (err) {
      console.warn("Runtime status not available:", err.message);
      return null;
    }
  },

  updateRuntimeStatus: async (status) => {
    try {
      const res = await apiClient.put("/driver/runtime-status", {
        runtime_status: status,
      });
      return res.data;
    } catch (err) {
      throw new Error(
        err.response?.data?.detail ||
          err.response?.data?.message ||
          "Failed to update runtime status",
      );
    }
  },
};
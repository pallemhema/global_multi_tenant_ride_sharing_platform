import { apiClient } from "./axios";

export const fleetOwnerApi = {
  /* ===============================
     ONBOARDING ENDPOINTS
  =============================== */

  async registerFleetOwner() {
    try {
      const res = await apiClient.post("/fleet-owner/register");
      return res.data;
    } catch (err) {
      throw new Error(
        err.response?.data?.detail ||
          err.response?.data?.message ||
          "Failed to register as fleet owner",
      );
    }
  },

  async selectTenantForFleetOwner(tenant_id) {
    try {
      const res = await apiClient.post("/fleet-owner/select-tenant", {
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

  async fillFleetDetails(detailsData) {
    try {
      const res = await apiClient.post(
        "/fleet-owner/upload-fleet-details",
        detailsData,
      );
      return res.data;
    } catch (err) {
      throw new Error(
        err.response?.data?.detail ||
          err.response?.data?.message ||
          "Failed to save fleet details",
      );
    }
  },

  async getFleetOnboardingStatus() {
    try {
      const res = await apiClient.get("/fleet-owner/status");
      return res.data;
    } catch (err) {
      throw new Error(
        err.response?.data?.detail ||
          err.response?.data?.message ||
          "Failed to fetch onboarding status",
      );
    }
  },

  /* ===============================
     DOCUMENTS ENDPOINTS
  =============================== */

  async getFleetDocuments() {
    try {
      const res = await apiClient.get("/fleet-owner/documents");
      console.log(res.data)
      return res.data;
    } catch (err) {
      throw new Error(
        err.response?.data?.detail ||
          err.response?.data?.message ||
          "Failed to fetch documents",
      );
    }
  },

  async uploadFleetDocument(formData) {
    try {
      const res = await apiClient.post("/fleet-owner/documents", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res.data;
    } catch (err) {
      throw new Error(
        err.response?.data?.detail ||
          err.response?.data?.message ||
          "Failed to upload document",
      );
    }
  },

  async updateFleetDocument(documentId, formData) {
    try {
      const res = await apiClient.put(
        `/fleet-owner/documents/${documentId}`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        },
      );
      return res.data;
    } catch (err) {
      throw new Error(
        err.response?.data?.detail ||
          err.response?.data?.message ||
          "Failed to update document",
      );
    }
  },

  async deleteFleetDocument(documentId) {
    try {
      const res = await apiClient.delete(
        `/fleet-owner/documents/${documentId}`,
      );
      return res.data;
    } catch (err) {
      throw new Error(
        err.response?.data?.detail ||
          err.response?.data?.message ||
          "Failed to delete document",
      );
    }
  },

  /* ===============================
     VEHICLES ENDPOINTS
  =============================== */

  async getFleetVehicles() {
    try {
      const res = await apiClient.get("/fleet-owner/vehicles");
      return res.data;
    } catch (err) {
      throw new Error(
        err.response?.data?.message ||
          err.response?.data?.detail ||
          "Failed to fetch vehicles",
      );
    }
  },

  async addFleetVehicle(vehicleData) {
    try {
      const res = await apiClient.post("/fleet-owner/vehicles", vehicleData);
      return res.data;
    } catch (err) {
      throw new Error(
        err.response?.data?.message ||
          err.response?.data?.detail ||
          "Failed to add vehicle",
      );
    }
  },

  async updateFleetVehicle(vehicleId, vehicleData) {
    try {
      const res = await apiClient.put(
        `/fleet-owner/vehicles/${vehicleId}`,
        vehicleData,
      );
      return res.data;
    } catch (err) {
      throw new Error(
        err.response?.data?.message ||
          err.response?.data?.detail ||
          "Failed to update vehicle",
      );
    }
  },

  async deleteFleetVehicle(vehicleId) {
    try {
      const res = await apiClient.delete(`/fleet-owner/vehicles/${vehicleId}`);
      return res.data;
    } catch (err) {
      throw new Error(
        err.response?.data?.message ||
          err.response?.data?.detail ||
          "Failed to delete vehicle",
      );
    }
  },

  async getVehicleDocuments(vehicleId) {
    try {
      const res = await apiClient.get(
        `/fleet-owner/vehicles/${vehicleId}/documents`,
      );
      return res.data;
    } catch (err) {
      throw new Error(
        err.response?.data?.message ||
          err.response?.data?.detail ||
          "Failed to fetch vehicle documents",
      );
    }
  },

  async uploadVehicleDocument(vehicleId, formData) {
    try {
      const res = await apiClient.post(
        `/fleet-owner/vehicles/${vehicleId}/documents`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } },
      );
      return res.data;
    } catch (err) {
      throw new Error(
        err.response?.data?.detail ||
          err.response?.data?.message ||
          "Failed to upload vehicle document",
      );
    }
  },

  /* ===============================
     DRIVER INVITES ENDPOINTS
  =============================== */

  async getDriverInvites() {
    try {
      const res = await apiClient.get("/fleet-owner/invites");
      return res.data;
    } catch (err) {
      throw new Error(
        err.response?.data?.detail ||
          err.response?.data?.message ||
          "Failed to fetch invites",
      );
    }
  },

  async inviteDriver(driverId) {
    try {
      const res = await apiClient.post("/fleet-owner/invites", {
        driver_id: driverId,
      });
      return res.data;
    } catch (err) {
      throw new Error(
        err.response?.data?.detail ||
          err.response?.data?.message ||
          "Failed to invite driver",
      );
    }
  },

  async cancelInvite(inviteId) {
    try {
      const res = await apiClient.delete(`/fleet-owner/invites/${inviteId}`);
      return res.data;
    } catch (err) {
      throw new Error(
        err.response?.data?.detail ||
          err.response?.data?.message ||
          "Failed to cancel invite",
      );
    }
  },

  /* ===============================
     VEHICLE ASSIGNMENTS ENDPOINTS
  =============================== */

  async assignVehicleToDriver(inviteId, vehicleId) {
    try {
      const res = await apiClient.post("/fleet-owner/assignments", {
        invite_id: inviteId,
        vehicle_id: vehicleId,
      });
      return res.data;
    } catch (err) {
      throw new Error(
        err.response?.data?.detail ||
          err.response?.data?.message ||
          "Failed to assign vehicle",
      );
    }
  },

  async unassignVehicle(assignmentId) {
    try {
      const res = await apiClient.put(
        `/fleet-owner/assignments/${assignmentId}/end`,
      );
      return res.data;
    } catch (err) {
      throw new Error(
        err.response?.data?.detail ||
          err.response?.data?.message ||
          "Failed to unassign vehicle",
      );
    }
  },

  async getAssignments() {
    try {
      const res = await apiClient.get("/fleet-owner/assignments");
      return res.data;
    } catch (err) {
      throw new Error(
        err.response?.data?.detail ||
          err.response?.data?.message ||
          "Failed to fetch assignments",
      );
    }
  },

  /* ===============================
     DASHBOARD ENDPOINTS
  =============================== */

  async getDashboardStats() {
    try {
      const res = await apiClient.get("/fleet/dashboard/stats");
      return res.data;
    } catch (err) {
      throw new Error(
        err.response?.data?.detail ||
          err.response?.data?.message ||
          "Failed to fetch dashboard stats",
      );
    }
  },

  async getFleetProfile() {
    try {
      const res = await apiClient.get("/fleet-owner/profile");
      return res.data;
    } catch (err) {
      throw new Error(
        err.response?.data?.message ||
          err.response?.data?.detail ||
          "Failed to fetch fleet profile",
      );
    }
  },
};

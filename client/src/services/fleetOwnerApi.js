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

  async uploadFleetDetails(detailsData) {
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

  async getFleet() {
    try {
      console.log("Fetching fleet details...");
      const res = await apiClient.get("/fleet-owner");
      console.log("Fleet data from api:", res.data);
      return res.data;
    } catch (err) {
      throw new Error(
        err.response?.data?.detail ||
          err.response?.data?.message ||
          "Failed to fetch fleet details",
      );
    }
  },

  /* ===============================
     DOCUMENTS ENDPOINTS
  =============================== */

  async getFleetDocuments() {
    try {
      console.log("Fetching fleet documents...");
      const res = await apiClient.get("/fleet-owner/documents");
      console.log(res.data);
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
     DRIVER INVITES ENDPOINTS
  =============================== */
  async getAvaialibleDrivers() {
    try {
      const res = await apiClient.get("/fleet-owner/drivers/available");
      return res.data;
    } catch (err) {
      throw new Error(
        err.response?.data?.detail ||
          err.response?.data?.message ||
          "Failed to fetch available drivers",
      );
    }
  },

  async getDriverInvites() {
    try {
      const res = await apiClient.get("/fleet-owner/drivers/invite");
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
      const res = await apiClient.post("/fleet-owner/drivers/invite", {
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
      const res = await apiClient.put(
        `/fleet-owner/drivers/invites/${inviteId}/cancel`,
      );
      return res.data;
    } catch (err) {
      throw new Error(
        err.response?.data?.detail ||
          err.response?.data?.message ||
          "Failed to cancel invite",
      );
    }
  },
  async getFleetDrivers() {
    try {
      const res = await apiClient.get("/fleet-owner/fleet-drivers");
      return res.data;
    } catch (err) {
      throw new Error(
        err.response?.data?.detail ||
          err.response?.data?.message ||
          "Failed to fetch fleet drivers",
      );
    }
  },

  // async getFleetVehicles() {
  //   try {
  //     const res = await apiClient.get("/fleet-owner/vehicles");
  //     return res.data;
  //   } catch (err) {
  //     throw new Error(
  //       err.response?.data?.detail ||
  //         err.response?.data?.message ||
  //         "Failed to fetch fleet vehicles",
  //     );
  //   }
  // },

  async getFleetAssignments() {
    try {
      const res = await apiClient.get("/fleet-owner/assignments");
      return res.data;
    } catch (err) {
      throw new Error(
        err.response?.data?.detail ||
          err.response?.data?.message ||
          "Failed to fetch fleet assignments",
      );
    }
  },

  /* ===============================
     VEHICLE ASSIGNMENTS ENDPOINTS
  =============================== */

  async assignVehicleToDriver(driverId, vehicleId) {
    try {
      const res = await apiClient.post("/fleet-owner/vehicle-assignments", {
        driver_id: driverId,
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
  async getVehicleLock(vehicleId) {
    try {
      const res = await apiClient.get(
        `/fleet-owner/vehicle-assignments/vehicle/${vehicleId}/lock-status`,
      );
      return res.data;
    } catch (err) {
      throw new Error(
        err.response?.data?.detail ||
          err.response?.data?.message ||
          "Failed to check vehicle lock",
      );
    }
  },

  async getDriverLock(driverId) {
    try {
      const res = await apiClient.get(
        `/fleet-owner/vehicle-assignments/driver/${driverId}/lock-status`,
      );
      return res.data;
    } catch (err) {
      throw new Error(
        err.response?.data?.detail ||
          err.response?.data?.message ||
          "Failed to check driver lock",
      );
    }
  },

  /* ===============================
     DASHBOARD ENDPOINTS
  =============================== */

  async getDashboardStats() {
    try {
      const res = await apiClient.get("/fleet-owner/dashboard/stats");
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

  /* ===============================
     FINANCES - WALLET
  =============================== */

  async getWallet() {
    try {
      const res = await apiClient.get("/fleet-owner/wallet");
      return res.data;
    } catch (err) {
      throw new Error(err.response?.data?.detail || "Failed to fetch wallet");
    }
  },
};

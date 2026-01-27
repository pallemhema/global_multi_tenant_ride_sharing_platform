import { apiClient } from "./axios";

export const fleetOwnerApi = {
  /**
   * Get fleet owner profile
   * @returns {Promise<Object>} - Fleet owner profile data
   */
  async getFleetProfile() {
    try {
      const res = await apiClient.get("/fleet-owner/profile");
      return res.data;
    } catch (err) {
      throw new Error(
        err.response?.data?.message ||
          err.response?.data?.detail ||
          "Failed to fetch fleet profile"
      );
    }
  },

  /**
   * Get all drivers assigned to fleet
   * @returns {Promise<Array>} - List of drivers
   */
  async getFleetDrivers() {
    try {
      const res = await apiClient.get("/fleet-owner/drivers");
      return res.data;
    } catch (err) {
      throw new Error(
        err.response?.data?.message ||
          err.response?.data?.detail ||
          "Failed to fetch drivers"
      );
    }
  },

  /**
   * Get all vehicles in fleet
   * @returns {Promise<Array>} - List of vehicles
   */
  async getFleetVehicles() {
    try {
      const res = await apiClient.get("/fleet-owner/vehicles");
      return res.data;
    } catch (err) {
      throw new Error(
        err.response?.data?.message ||
          err.response?.data?.detail ||
          "Failed to fetch vehicles"
      );
    }
  },

  /**
   * Add vehicle to fleet
   * @param {Object} vehicleData - Vehicle data
   * @returns {Promise<Object>} - Created vehicle
   */
  async addVehicle(vehicleData) {
    try {
      const res = await apiClient.post("/fleet-owner/vehicles", vehicleData);
      return res.data;
    } catch (err) {
      throw new Error(
        err.response?.data?.message ||
          err.response?.data?.detail ||
          "Failed to add vehicle"
      );
    }
  },

  /**
   * Invite driver to fleet
   * @param {Object} inviteData - Driver invitation data
   * @returns {Promise<Object>} - Invitation result
   */
  async inviteDriver(inviteData) {
    try {
      const res = await apiClient.post("/fleet-owner/drivers/invite", inviteData);
      return res.data;
    } catch (err) {
      throw new Error(
        err.response?.data?.message ||
          err.response?.data?.detail ||
          "Failed to invite driver"
      );
    }
  },

  /**
   * Remove driver from fleet
   * @param {number} driverId - Driver ID
   * @returns {Promise<Object>} - Result
   */
  async removeDriver(driverId) {
    try {
      const res = await apiClient.post(`/fleet-owner/drivers/${driverId}/remove`);
      return res.data;
    } catch (err) {
      throw new Error(
        err.response?.data?.message ||
          err.response?.data?.detail ||
          "Failed to remove driver"
      );
    }
  },

  /**
   * Update fleet profile
   * @param {Object} profileData - Fleet profile data
   * @returns {Promise<Object>} - Updated profile
   */
  async updateFleetProfile(profileData) {
    try {
      const res = await apiClient.put("/fleet-owner/profile", profileData);
      return res.data;
    } catch (err) {
      throw new Error(
        err.response?.data?.message ||
          err.response?.data?.detail ||
          "Failed to update profile"
      );
    }
  },

  /**
   * Get fleet revenue summary
   * @returns {Promise<Object>} - Revenue data
   */
  async getRevenuesSummary() {
    try {
      const res = await apiClient.get("/fleet-owner/revenue/summary");
      return res.data;
    } catch (err) {
      throw new Error(
        err.response?.data?.message ||
          err.response?.data?.detail ||
          "Failed to fetch revenue data"
      );
    }
  },

  /**
   * Get fleet statistics
   * @returns {Promise<Object>} - Stats data
   */
  async getFleetStats() {
    try {
      const res = await apiClient.get("/fleet-owner/stats");
      return res.data;
    } catch (err) {
      throw new Error(
        err.response?.data?.message ||
          err.response?.data?.detail ||
          "Failed to fetch stats"
      );
    }
  },
};

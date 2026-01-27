import { apiClient } from "./axios";

export const userAuthApi = {
  async requestOtp(phone_e164) {
    try {
      const res = await apiClient.post("/auth/user/otp/request", {
        phone_e164,
      });
      return res.data;
    } catch (err) {
      throw new Error(
        err.response?.data?.message ||
          err.response?.data?.detail ||
          "Failed to send OTP"
      );
    }
  },


  async verifyOtp(phone_e164, otp) {
    try {
      const res = await apiClient.post("/auth/user/otp/verify", {
        phone_e164,
        otp,
      });
      return res.data;
    } catch (err) {
      throw new Error(
        err.response?.data?.message ||
          err.response?.data?.detail ||
          "Invalid OTP"
      );
    }
  },

 
  async getAvailableRoles() {
    try {
      const res = await apiClient.get("/auth/user/available-roles");
      return res.data;
    } catch (err) {
      throw new Error(
        err.response?.data?.message ||
          err.response?.data?.detail ||
          "Failed to fetch available roles"
      );
    }
  },

 
  async switchRole(role) {
    try {
      const res = await apiClient.post("/auth/user/switch-role", null, {
        params: { role },
      });
      return res.data;
    } catch (err) {
      throw new Error(
        err.response?.data?.message ||
          err.response?.data?.detail ||
          `Failed to switch to ${role}`
      );
    }
  },
  async createUserProfile(payload) {
    try {
      const res = await apiClient.post("/auth/user/profile", payload);
      return res.data;
    } catch (err) {
      throw new Error(
        err.response?.data?.detail || "Failed to create user profile"
      );
    }
  },

  async editUserProfile(payload) {
    try {
      const res = await apiClient.put("/auth/user/profile", payload);
      return res.data;
    } catch (err) {
      throw new Error(
        err.response?.data?.detail || "Failed to update user profile"
      );
    }
  },

  async getUserProfile() {
    try {
      const res = await apiClient.get("/auth/user/profile");
      return res.data;
    } catch (err) {
      throw new Error(
        err.response?.data?.detail || "Failed to fetch user profile"
      );
    }
  },
};
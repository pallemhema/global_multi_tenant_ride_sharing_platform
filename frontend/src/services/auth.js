import http from "./http";

export const authService = {
  async requestOtp(phone_e164) {
    try {
      const res = await http.post('/auth/otp/request', {
        phone_e164,
      });
      return res.data;
    } catch (err) {
      throw new Error(
        err.response?.data?.message ||
        err.response?.data?.detail ||
        'Failed to send OTP'
      );
    }
  },

  async verifyOtp(phone_e164, otp) {
    try {
      const res = await http.post('/auth/otp/verify', {
        phone_e164,
        otp,
      });
      return res.data;
    } catch (err) {
      throw new Error(
        err.response?.data?.message ||
        err.response?.data?.detail ||
        'Invalid OTP'
      );
    }
  },
};

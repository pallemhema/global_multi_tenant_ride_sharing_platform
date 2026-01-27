import { apiClient } from "./axios";
// Auth endpoints
export const authAPI = {
  login: (email, password) => {
    return apiClient.post('/auth/admin/login', { email, password });
  },
};
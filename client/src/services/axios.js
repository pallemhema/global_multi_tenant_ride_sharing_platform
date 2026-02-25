import axios from 'axios';

const API_BASE = 'http://localhost:8000/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE,
});

// Request interceptor to add token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  console.log('API Request - Token present:', !!token, 'Token:', token?.substring(0, 20) + '...');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response logging for debugging
apiClient.interceptors.response.use(
  (res) => {
    console.log('API Response:', res.config.method.toUpperCase(), res.config.url, res.status);
    return res;
  },
  (err) => {
    console.error('API Error:', err.config?.method?.toUpperCase(), err.config?.url, err.response?.status, err.message);
    return Promise.reject(err);
  },
);
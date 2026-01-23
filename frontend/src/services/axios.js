// import axios from "axios";
// import { tokenStorage } from "../utils/toeknStorage";
// const api = axios.create({
//   baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1",
//   timeout: 10000,
//   headers: {
//     "Content-Type": "application/json",
//   },
// });

// api.interceptors.request.use((config) => {
//   const token = tokenStorage.get();
//   if (token) {
//     config.headers.Authorization = `Bearer ${token}`;
//   }
//   return config;
// });

// export default api;

import axios from "axios";
import { tokenStorage } from "../utils/toeknStorage";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1",
});

api.interceptors.request.use((config) => {
  const token = tokenStorage.get();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      tokenStorage.clear();
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;

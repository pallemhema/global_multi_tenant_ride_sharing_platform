import { apiClient } from "./axios";

export const requestTrip = async (payload) => {
  // payload should include pickup/dropoff lat/lng and any optional metadata
  return apiClient.post("/rider/trips/request", payload).then((r) => r.data);
};

export const listAvailableTenants = async (tripRequestId) => {
  return apiClient
    .get(`/rider/trips/available-tenants/${tripRequestId}`)
    .then((r) => r.data);
};

export const selectTenant = async (tripRequestId, payload) => {
  return apiClient
    .post(`/rider/trips/select-tenant/${tripRequestId}`, payload)
    .then((r) => r.data);
};

export const startDriverSearch = async (tripRequestId) => {
  return apiClient
    .post(`/rider/trips/start-driver-search/${tripRequestId}`)
    .then((r) => r.data);
};

export const getTripStatus = async (tripRequestId) => {
  // Use trip_request_id endpoint until driver accepts
  return apiClient
    .get(`/rider/trips/request/${tripRequestId}/status`)
    .then((r) => r.data);
};

export const getTripStatusByTripId = async (tripId) => {
  // Use trip_id endpoint after driver accepts (for live tracking)
  return apiClient.get(`/rider/trips/${tripId}/status`).then((r) => r.data);
};

export const getTripOtp = async (tripId) => {
  // OTP is stored by trip_id, not trip_request_id
  return apiClient.get(`/rider/trips/${tripId}/otp`).then((r) => r.data);
};

export const resendTripOtp = async (tripId) => {
  // Resend OTP using trip_id
  return apiClient
    .post(`/rider/trips/${tripId}/resend-otp`)
    .then((r) => r.data);
};

export const getTripReceipt = async (tripId) => {
  return apiClient.get(`/rider/trips/${tripId}/receipt`).then((r) => r.data);
};

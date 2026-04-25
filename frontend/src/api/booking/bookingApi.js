import { apiClient } from "../apiClient";

const cleanParams = (params = {}) =>
  Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== "" && value !== null && value !== undefined)
  );

export const bookingApi = {
  create: (payload) => apiClient.post("/bookings", payload).then((r) => r.data),
  getMine: () => apiClient.get("/bookings/my").then((r) => r.data),
  getAll: (filters = {}) => apiClient.get("/bookings", { params: cleanParams(filters) }).then((r) => r.data),
  approve: (id) => apiClient.patch(`/bookings/${id}/approve`).then((r) => r.data),
  reject: (id, payload) => apiClient.patch(`/bookings/${id}/reject`, payload).then((r) => r.data),
  cancel: (id) => apiClient.patch(`/bookings/${id}/cancel`).then((r) => r.data),
  checkConflicts: (params) => apiClient.get("/bookings/conflicts/check", { params: cleanParams(params) }).then((r) => r.data),
  getQrCode: (id) => apiClient.get(`/bookings/${id}/qr`).then((r) => r.data),
  checkIn: (payload) => apiClient.post("/bookings/check-in", payload).then((r) => r.data),
  getPeakAnalytics: () => apiClient.get("/bookings/analytics/peak-hours").then((r) => r.data),
  getUnavailableResourceIds: (params) => apiClient.get("/bookings/unavailable", { params: cleanParams(params) }).then((r) => r.data),
};

import { apiClient } from "../apiClient";

export const resourceAssetApi = {
  create: (resourceId, payload) =>
    apiClient.post(`/resource-assets/${resourceId}`, payload).then((r) => r.data),
  getByResourceId: (resourceId) =>
    apiClient.get(`/resource-assets/${resourceId}`).then((r) => r.data),
  update: (resourceId, payload) =>
    apiClient.put(`/resource-assets/${resourceId}`, payload).then((r) => r.data),
  deleteByResourceId: (resourceId) => apiClient.delete(`/resource-assets/${resourceId}`),
  patchInspectionStatus: (resourceId, status) =>
    apiClient
      .patch(`/resource-assets/${resourceId}/inspection-status`, null, {
        params: { status },
      })
      .then((r) => r.data),
  getByQr: (qrCodeValue) =>
    apiClient.get(`/resource-assets/qr/${encodeURIComponent(qrCodeValue)}`).then((r) => r.data),
};

import { apiClient } from "../apiClient";

export const resourceInspectionApi = {
  create: (resourceId, payload) =>
    apiClient.post(`/resource-inspections/${resourceId}`, payload).then((r) => r.data),
  listByResourceId: (resourceId) =>
    apiClient.get(`/resource-inspections/${resourceId}`).then((r) => r.data),
  listOverdue: () => apiClient.get("/resource-inspections/overdue").then((r) => r.data),
  deleteById: (inspectionId) =>
    apiClient.delete(`/resource-inspections/${inspectionId}`),
};


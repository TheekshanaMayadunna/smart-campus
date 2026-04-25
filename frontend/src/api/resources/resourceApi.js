import { apiClient } from "../apiClient";

export const resourceApi = {
  list: (params) => apiClient.get("/resources", { params }).then((r) => r.data),
  getById: (id) => apiClient.get(`/resources/${id}`).then((r) => r.data),
  create: (payload) => apiClient.post("/resources", payload).then((r) => r.data),
  update: (id, payload) => apiClient.put(`/resources/${id}`, payload).then((r) => r.data),
  softDelete: (id) => apiClient.delete(`/resources/${id}`),
  updateStatus: (id, status) =>
    apiClient.patch(`/resources/${id}/status`, null, { params: { status } }).then((r) => r.data),
  uploadImage: (id, file) => {
    const form = new FormData();
    form.append("image", file);
    return apiClient
      .post(`/resources/${id}/image`, form, { headers: { "Content-Type": "multipart/form-data" } })
      .then((r) => r.data);
  },
  analytics: () => apiClient.get("/resources/analytics").then((r) => r.data),
};

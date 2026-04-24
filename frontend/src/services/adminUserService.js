import { apiClient } from "../api/apiClient";

export const adminUserService = {
  async list() {
    const response = await apiClient.get("/auth/admin/users");
    return response.data;
  },

  async create(payload) {
    const response = await apiClient.post("/auth/admin/users", payload);
    return response.data;
  },

  async update(id, payload) {
    const response = await apiClient.put(`/auth/admin/users/${id}`, payload);
    return response.data;
  },

  async remove(id) {
    const response = await apiClient.delete(`/auth/admin/users/${id}`);
    return response.data;
  },
};

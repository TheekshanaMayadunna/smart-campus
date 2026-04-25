import { apiClient } from "../api/apiClient";

export const notificationService = {
  async list() {
    const response = await apiClient.get("/notifications");
    return response.data;
  },

  async unreadCount() {
    const response = await apiClient.get("/notifications/unread-count");
    return response.data?.count ?? 0;
  },

  async markRead(id) {
    const response = await apiClient.put(`/notifications/${id}/read`);
    return response.data;
  },

  async markAllRead() {
    const response = await apiClient.put("/notifications/read-all");
    return response.data;
  },

  async getPreferences() {
    const response = await apiClient.get("/notifications/preferences");
    return response.data;
  },

  async updatePreferences(payload) {
    const response = await apiClient.put("/notifications/preferences", payload);
    return response.data;
  },
};

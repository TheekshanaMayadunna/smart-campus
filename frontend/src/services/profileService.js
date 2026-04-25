import { apiClient } from "../api/apiClient";

export const profileService = {
  updateProfile: (payload) => apiClient.put("/auth/me/profile", payload).then((r) => r.data),
  deleteAccount: () => apiClient.delete("/auth/me").then((r) => r.data),
};

import { apiClient } from "../api/apiClient";

export const settingsService = {
  get: () => apiClient.get("/settings").then((r) => r.data),
  update: (payload) => apiClient.put("/settings", payload).then((r) => r.data),
};

import { apiClient } from "../api/apiClient";

export const resourceService = {
  list: (params) => apiClient.get("/resources", { params }).then(r => r.data),
  create: (payload) => apiClient.post("/resources", payload).then(r => r.data),
  update: (id, payload) => apiClient.put(`/resources/${id}`, payload).then(r => r.data),
  remove: (id) => apiClient.delete(`/resources/${id}`),

  //  PDF report
  downloadReportPdf: (params) =>
  apiClient.get("/resources/report/pdf", {
    params,
    responseType: "blob"
  }).then(r => r.data),
};
import { apiClient } from "../apiClient";

export const ticketApi = {
  async list(filters = {}) {
    const response = await apiClient.get("/tickets", { params: filters });
    return response.data;
  },

  async getById(ticketId) {
    const response = await apiClient.get(`/tickets/${ticketId}`);
    return response.data;
  },

  async uploadAttachments(ticketId, files) {
    const formData = new FormData();
    (files || []).forEach((file) => {
      if (file) formData.append("attachments", file);
    });
    const response = await apiClient.post(`/tickets/${ticketId}/attachments`, formData);
    return response.data;
  },

  async create(payload) {
    const formData = new FormData();
    formData.append("resourceId", payload.resourceId ?? "");
    formData.append("locationText", payload.resourceLocation || payload.locationText || "");
    formData.append("category", payload.category || "");
    formData.append("description", payload.description || "");
    formData.append("priority", payload.priority || "MEDIUM");
    formData.append("preferredContact", payload.preferredContact || "");
    (payload.images || payload.attachments || []).slice(0, 3).forEach((file) => {
      if (file) formData.append("attachments", file);
    });
    const response = await apiClient.post("/tickets", formData);
    return response.data;
  },

  async assign(ticketId, technicianId) {
    const response = await apiClient.put(`/tickets/${ticketId}/assign`, { technicianId });
    return response.data;
  },

  async updateStatus(ticketId, payload) {
    const response = await apiClient.put(`/tickets/${ticketId}/status`, payload);
    return response.data;
  },

  async updateResolutionNotes(ticketId, resolutionNotes) {
    const response = await apiClient.put(`/tickets/${ticketId}/resolution-notes`, { resolutionNotes });
    return response.data;
  },

  async listComments(ticketId) {
    const response = await apiClient.get(`/tickets/${ticketId}/comments`);
    return response.data;
  },

  async addComment(ticketId, content) {
    const response = await apiClient.post(`/tickets/${ticketId}/comments`, { content });
    return response.data;
  },

  async updateComment(commentId, content) {
    const response = await apiClient.put(`/tickets/comments/${commentId}`, { content });
    return response.data;
  },

  async deleteComment(commentId) {
    const response = await apiClient.delete(`/tickets/comments/${commentId}`);
    return response.data;
  },

  async deleteResolvedTicket(ticketId) {
    await apiClient.delete(`/tickets/${ticketId}`);
  },

  async downloadResolvedTicketPdf(ticketId) {
    try {
      const response = await apiClient.get(`/tickets/${ticketId}/pdf`, { responseType: "blob" });
      const blob = response.data;
      const ct = String(response.headers["content-type"] || "");
      if (!ct.includes("application/pdf")) {
        const msg = typeof blob?.text === "function" ? await blob.text() : "";
        throw new Error(msg || "Server did not return a PDF");
      }
      const url = window.URL.createObjectURL(new Blob([blob], { type: "application/pdf" }));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `ticket-${ticketId}-resolved.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      const data = e?.response?.data;
      if (data instanceof Blob && typeof data.text === "function") {
        const msg = await data.text();
        throw new Error(msg || e.message || "PDF download failed");
      }
      throw e;
    }
  },
};

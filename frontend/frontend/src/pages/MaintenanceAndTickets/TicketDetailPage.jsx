import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import ResourceLayout from "../../components/resource/ResourceLayout";
import { ticketApi } from "../../api/MaintenanceAndTickets/ticketApi";
import { BACKEND_BASE_URL } from "../../api/apiClient";

function attachmentUrl(path) {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  return `${BACKEND_BASE_URL}/${String(path).replace(/^\/+/, "")}`;
}

function InfoCard({ title, children }) {
  return (
    <section className="card" style={{ borderRadius: 16, padding: 18 }}>
      <h3 style={{ marginTop: 0, marginBottom: 12, fontSize: 16 }}>{title}</h3>
      {children}
    </section>
  );
}

function KeyValue({ label, value }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "150px 1fr", gap: 12, padding: "6px 0" }}>
      <div style={{ color: "var(--muted)", fontSize: 13, fontWeight: 600 }}>{label}</div>
      <div style={{ color: "var(--text)", fontSize: 14 }}>{value ?? "-"}</div>
    </div>
  );
}

export default function TicketDetailPage({ onLogout, user, theme = "light", onToggleTheme }) {
  const { id } = useParams();
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [selectedFiles, setSelectedFiles] = useState([]);
  const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
  const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

  const loadDetail = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await ticketApi.getById(id);
      setDetail(data);
    } catch (err) {
      setError(String(err?.response?.data || err?.message || "Failed to load ticket detail."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDetail();
  }, [id]);

  const ticket = detail?.ticket;
  const attachments = detail?.attachments || [];
  const comments = detail?.comments || [];
  const timeline = detail?.timeline || [];
  const sla = detail?.slaSummary;
  const remainingSlots = Math.max(0, 3 - attachments.length);
  const isRejected = String(ticket?.status || "").toUpperCase() === "REJECTED";

  const handleFileSelection = (event) => {
    const incoming = Array.from(event.target.files || []);
    const merged = [...selectedFiles];
    const rejected = [];
    for (const file of incoming) {
      if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
        rejected.push(`${file.name}: unsupported type`);
        continue;
      }
      if (file.size > MAX_IMAGE_BYTES) {
        rejected.push(`${file.name}: larger than 5 MB`);
        continue;
      }
      const exists = merged.some(
        (candidate) =>
          candidate.name === file.name &&
          candidate.size === file.size &&
          candidate.lastModified === file.lastModified
      );
      if (!exists) merged.push(file);
    }
    if (rejected.length > 0) {
      setUploadError(`Some files were ignored. ${rejected.join(" | ")}`);
    } else {
      setUploadError("");
    }
    setSelectedFiles(merged.slice(0, remainingSlots));
    event.target.value = "";
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;
    setUploading(true);
    setUploadError("");
    try {
      await ticketApi.uploadAttachments(id, selectedFiles);
      setSelectedFiles([]);
      await loadDetail();
    } catch (err) {
      setUploadError(String(err?.response?.data || err?.message || "Failed to upload attachments."));
    } finally {
      setUploading(false);
    }
  };

  return (
    <ResourceLayout onLogout={onLogout} user={user} theme={theme} onToggleTheme={onToggleTheme}>
        <div style={{ display: "grid", gap: 16 }}>
        <div className="card" style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <div>
            <Link to="/tickets" style={{ fontSize: 13, color: "var(--muted)", textDecoration: "none" }}>Back to tickets</Link>
            <h2 style={{ margin: "8px 0 4px" }}>{ticket?.ticketCode || `Ticket #${id}`}</h2>
            <div style={{ color: "var(--muted)", fontSize: 14 }}>
              Aggregated detail view with metadata, comments, attachments, activity timeline, and SLA summary.
            </div>
          </div>
          {ticket ? (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              <span style={{ padding: "6px 10px", borderRadius: 999, background: "rgba(148, 163, 184, 0.14)", color: "var(--text)", fontWeight: 700, fontSize: 12 }}>
                {ticket.status}
              </span>
              {sla?.slaState ? (
                <span
                  style={{
                    padding: "6px 10px",
                    borderRadius: 999,
                    background: sla.slaState === "SLA BREACHED" ? "#fee2e2" : sla.slaState === "DUE SOON" ? "#fef3c7" : "#dcfce7",
                    color: sla.slaState === "SLA BREACHED" ? "#b91c1c" : sla.slaState === "DUE SOON" ? "#92400e" : "#166534",
                    fontWeight: 700,
                    fontSize: 12,
                  }}
                >
                  {sla.slaState}
                </span>
              ) : null}
            </div>
          ) : null}
        </div>

        {loading ? <div className="card">Loading ticket detail...</div> : null}
        {error ? <div className="card" style={{ color: "#b91c1c" }}>{error}</div> : null}

        {!loading && !error && detail ? (
          <>
            <div style={{ display: "grid", gap: 16, gridTemplateColumns: "2fr 1fr" }}>
              <InfoCard title="Ticket Metadata">
                <KeyValue label="Reporter" value={detail.reporter?.name || "-"} />
                <KeyValue label="Assigned Technician" value={detail.assignedTechnician?.name || "Not assigned"} />
                <KeyValue label="Category" value={ticket?.category} />
                <KeyValue label="Priority" value={ticket?.priority} />
                <KeyValue label="Location" value={ticket?.locationText} />
                <KeyValue label="Preferred Contact" value={ticket?.preferredContact} />
                <KeyValue label="Created At" value={ticket?.createdAt ? new Date(ticket.createdAt).toLocaleString() : "-"} />
                <KeyValue label="Updated At" value={ticket?.updatedAt ? new Date(ticket.updatedAt).toLocaleString() : "-"} />
              </InfoCard>

              <InfoCard title="SLA Indicators">
                <KeyValue label="Priority Band" value={sla?.priorityBand} />
                <KeyValue label="First Response Target" value={sla?.firstResponseTargetMinutes != null ? `${sla.firstResponseTargetMinutes} min` : "-"} />
                <KeyValue label="Resolution Target" value={sla?.resolutionTargetMinutes != null ? `${sla.resolutionTargetMinutes} min` : "-"} />
                <KeyValue label="Elapsed Hours" value={sla?.elapsedHours != null ? `${sla.elapsedHours}h` : "-"} />
                <KeyValue label="First Response Deadline" value={sla?.firstResponseDeadlineAt ? new Date(sla.firstResponseDeadlineAt).toLocaleString() : "-"} />
                <KeyValue label="Resolution Deadline" value={sla?.resolutionDeadlineAt ? new Date(sla.resolutionDeadlineAt).toLocaleString() : "-"} />
                <KeyValue label="Current State" value={sla?.statusLabel} />
                <KeyValue label="First Response SLA" value={sla?.firstResponseBreached ? "Breached" : "Within SLA"} />
                <KeyValue label="Resolution SLA" value={sla?.resolutionBreached ? "Breached" : "Within SLA"} />
                <KeyValue label="Remaining to First Response" value={sla?.firstResponseRemainingMinutes != null ? `${sla.firstResponseRemainingMinutes} min` : "-"} />
                <KeyValue label="Remaining to Resolution" value={sla?.resolutionRemainingMinutes != null ? `${sla.resolutionRemainingMinutes} min` : "-"} />
                <KeyValue label="Overall SLA" value={sla?.slaState || "-"} />
              </InfoCard>
            </div>

            <InfoCard title="Description">
              <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.6, color: "var(--text)" }}>{ticket?.description || "-"}</div>
            </InfoCard>

            <div style={{ display: "grid", gap: 16, gridTemplateColumns: "1fr 1fr" }}>
              <InfoCard title="Attachments">
                {attachments.length === 0 ? <div style={{ color: "var(--muted)" }}>No attachments.</div> : null}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                  {attachments.map((attachment) => (
                    <a key={attachment.id} href={attachmentUrl(attachment.filePath)} target="_blank" rel="noreferrer">
                      <img
                        src={attachmentUrl(attachment.filePath)}
                        alt={attachment.originalFileName || "attachment"}
                        style={{ width: 120, height: 120, objectFit: "cover", borderRadius: 10, border: "1px solid rgba(124, 144, 192, 0.24)" }}
                      />
                    </a>
                  ))}
                </div>
                <div style={{ marginTop: 16, borderTop: "1px solid rgba(124, 144, 192, 0.24)", paddingTop: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>
                    Upload more images
                  </div>
                  <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 10 }}>
                    JPEG, PNG, or WEBP only. Max 5 MB each. Remaining slots: {remainingSlots}
                  </div>
                  {uploadError ? <div style={{ color: "#b91c1c", fontSize: 13, marginBottom: 10 }}>{uploadError}</div> : null}
                  {isRejected ? (
                    <div style={{ color: "var(--muted)", fontSize: 13 }}>
                      This ticket was rejected, so no more attachments can be added.
                    </div>
                  ) : remainingSlots === 0 ? (
                    <div style={{ color: "var(--muted)", fontSize: 13 }}>This ticket already has the maximum 3 attachments.</div>
                  ) : (
                    <>
                      <input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={handleFileSelection} />
                      {selectedFiles.length > 0 ? (
                        <div style={{ marginTop: 10, display: "grid", gap: 6 }}>
                          {selectedFiles.map((file) => (
                            <div key={`${file.name}-${file.lastModified}`} style={{ fontSize: 13, color: "var(--text)" }}>
                              {file.name} ({Math.round(file.size / 1024)} KB)
                            </div>
                          ))}
                        </div>
                      ) : null}
                      <button
                        type="button"
                        onClick={handleUpload}
                        disabled={uploading || selectedFiles.length === 0}
                        style={{
                          marginTop: 12,
                          padding: "10px 14px",
                          borderRadius: 10,
                          border: "1px solid rgba(124, 144, 192, 0.28)",
                          background: uploading
                            ? "rgba(148, 163, 184, 0.16)"
                            : "linear-gradient(135deg, #7c3aed, #2563eb 56%, #0f766e)",
                          color: uploading ? "var(--muted)" : "#fff",
                          cursor: uploading ? "not-allowed" : "pointer",
                          fontWeight: 700,
                        }}
                      >
                        {uploading ? "Uploading..." : "Upload attachments"}
                      </button>
                    </>
                  )}
                </div>
              </InfoCard>

              <InfoCard title="Resolution Notes">
                <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.6, color: "var(--text)" }}>
                  {ticket?.resolutionNotes || ticket?.rejectionReason || "No resolution notes yet."}
                </div>
              </InfoCard>
            </div>

            <InfoCard title="Comments">
              {comments.length === 0 ? <div style={{ color: "var(--muted)" }}>No comments yet.</div> : null}
              <div style={{ display: "grid", gap: 12 }}>
                {comments.map((comment) => (
                  <div key={comment.id} style={{ border: "1px solid rgba(124, 144, 192, 0.22)", borderRadius: 12, padding: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                      <strong style={{ fontSize: 14 }}>{comment.author?.name || "Unknown user"}</strong>
                      <span style={{ color: "var(--muted)", fontSize: 12 }}>
                        {comment.createdAt ? new Date(comment.createdAt).toLocaleString() : "-"}
                        {comment.edited ? " • edited" : ""}
                      </span>
                    </div>
                    <div style={{ marginTop: 8, whiteSpace: "pre-wrap", color: "var(--text)" }}>{comment.content}</div>
                  </div>
                ))}
              </div>
            </InfoCard>

            <InfoCard title="Timeline / Activity">
              {timeline.length === 0 ? <div style={{ color: "var(--muted)" }}>No activity recorded.</div> : null}
              <div style={{ display: "grid", gap: 10 }}>
                {timeline.map((entry) => (
                  <div key={entry.id} style={{ borderLeft: "3px solid rgba(124, 144, 192, 0.32)", paddingLeft: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                      <div style={{ fontWeight: 700, color: "var(--text)", fontSize: 13 }}>{entry.activityType}</div>
                      <div style={{ color: "var(--muted)", fontSize: 12 }}>
                        {entry.actorName || "System"}
                        {entry.actorRole ? ` (${entry.actorRole})` : ""}
                      </div>
                    </div>
                    <div style={{ color: "var(--text)", fontSize: 14, marginTop: 2 }}>{entry.description}</div>
                    {(entry.oldValue || entry.newValue) ? (
                      <div style={{ color: "var(--muted)", fontSize: 12, marginTop: 4 }}>
                        {entry.oldValue ? `From: ${entry.oldValue}` : "From: -"} | {entry.newValue ? `To: ${entry.newValue}` : "To: -"}
                      </div>
                    ) : null}
                    <div style={{ color: "var(--muted)", fontSize: 12, marginTop: 4 }}>
                      {entry.createdAt ? new Date(entry.createdAt).toLocaleString() : "-"}
                    </div>
                  </div>
                ))}
              </div>
            </InfoCard>
          </>
        ) : null}
      </div>
    </ResourceLayout>
  );
}

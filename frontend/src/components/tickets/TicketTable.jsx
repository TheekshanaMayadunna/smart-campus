import AdminAssignment from "./AdminAssignment";
import CommentSection from "./CommentSection";
import TechnicianActions from "./TechnicianActions";

import { API_BASE_URL as API_BASE } from "../../api/apiClient";
const API_ORIGIN = API_BASE.replace(/\/api\/?$/, "");

function toAttachmentUrl(path) {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_ORIGIN}/${String(path).replace(/^\/+/, "")}`;
}

function statusPillStyle(status) {
  const value = String(status || "").toUpperCase();
  if (value === "OPEN") return { background: "#fef3c7", color: "#92400e" };
  if (value === "IN_PROGRESS") return { background: "#dbeafe", color: "#1d4ed8" };
  if (value === "RESOLVED") return { background: "#dcfce7", color: "#166534" };
  if (value === "REJECTED") return { background: "#fee2e2", color: "#b91c1c" };
  if (value === "CLOSED") return { background: "#e2e8f0", color: "#0f172a" };
  return { background: "#e5e7eb", color: "#111827" };
}

const adminBtn = {
  fontSize: 12,
  fontWeight: 600,
  padding: "6px 12px",
  borderRadius: 8,
  border: "1px solid #cbd5e1",
  background: "#fff",
  color: "#334155",
  cursor: "pointer",
  fontFamily: "inherit",
};

const adminRequestLine = { fontSize: 13, color: "#0f172a", lineHeight: 1.45, marginBottom: 5 };
const adminRequestKey = { color: "#64748b", fontWeight: 600 };

export default function TicketTable({
  tickets,
  isAdmin,
  isTechnician,
  users,
  commentsByTicket,
  commentDrafts,
  user,
  onAssign,
  onReject,
  onStatus,
  onCommentDraft,
  onCommentPost,
  onCommentEdit,
  onCommentDelete,
  onDeleteResolvedTicket,
  onAdminDownloadResolvedPdf,
}) {
  const canDeleteResolved = (status) =>
    String(status || "").toUpperCase() === "RESOLVED" || String(status || "").toUpperCase() === "CLOSED";

  return (
    <div style={{ display: "grid", gap: 12 }}>
      {tickets.map((ticket) => (
        <div key={ticket.id} style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", alignItems: "flex-start" }}>
            <div>
              <strong>Ticket #{ticket.id}</strong>
              <div style={{ fontSize: 13, color: "#64748b", marginTop: 2 }}>
                <span style={{ fontWeight: 600, color: "#475569" }}>Category:</span> {ticket.category || "—"}
              </div>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
              {isAdmin && canDeleteResolved(ticket.status) && typeof onAdminDownloadResolvedPdf === "function" ? (
                <button type="button" style={adminBtn} onClick={() => onAdminDownloadResolvedPdf(ticket.id)}>
                  Download PDF
                </button>
              ) : null}
              {(isAdmin || isTechnician) &&
              canDeleteResolved(ticket.status) &&
              typeof onDeleteResolvedTicket === "function" ? (
                <button
                  type="button"
                  style={{ ...adminBtn, borderColor: "#fecaca", color: "#b91c1c", background: "#fef2f2" }}
                  onClick={() => onDeleteResolvedTicket(ticket.id)}
                >
                  Delete ticket
                </button>
              ) : null}
              <span
                style={{
                  ...statusPillStyle(ticket.status),
                  borderRadius: 999,
                  padding: "3px 10px",
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: 0.2,
                }}
              >
                {ticket.status}
              </span>
            </div>
          </div>
          {isAdmin ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: 10,
                marginTop: 8,
              }}
            >
              <div style={{ border: "1px solid #e2e8f0", borderRadius: 10, padding: 10, background: "#f8fafc" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 6 }}>USER REQUEST DETAILS</div>
                <div style={adminRequestLine}>
                  <span style={adminRequestKey}>Description</span>
                  {" - "}
                  {ticket.description?.trim() ? ticket.description : "—"}
                </div>
                <div style={adminRequestLine}>
                  <span style={adminRequestKey}>Resource / location</span>
                  {" - "}
                  {ticket.resourceLocation?.trim() ? ticket.resourceLocation : "—"}
                </div>
                <div style={adminRequestLine}>
                  <span style={adminRequestKey}>Priority</span>
                  {" - "}
                  {ticket.priority || "—"}
                </div>
                <div style={adminRequestLine}>
                  <span style={adminRequestKey}>Preferred contact</span>
                  {" - "}
                  {ticket.preferredContact?.trim() ? ticket.preferredContact : "—"}
                </div>
                {ticket.createdAt ? (
                  <div style={{ ...adminRequestLine, marginBottom: 0 }}>
                    <span style={adminRequestKey}>Submitted</span>
                    {" - "}
                    {new Date(ticket.createdAt).toLocaleString()}
                  </div>
                ) : null}
              </div>

              <div style={{ border: "1px solid #e2e8f0", borderRadius: 10, padding: 10, background: "#f8fafc" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 6 }}>TECHNICIAN WORKFLOW</div>
                <div style={{ fontSize: 13 }}>
                  Assigned: <strong>{ticket.assignedTechnicianName || "Not assigned yet"}</strong>
                </div>
                {ticket.resolutionNotes ? <div style={{ fontSize: 13, marginTop: 6 }}>Resolution: {ticket.resolutionNotes}</div> : null}
                {ticket.rejectionReason ? <div style={{ fontSize: 13, color: "#b71c1c", marginTop: 6 }}>Rejected: {ticket.rejectionReason}</div> : null}
              </div>
            </div>
          ) : (
            <>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#64748b", marginBottom: 2 }}>Description</div>
              <div style={{ marginBottom: 8 }}>{ticket.description}</div>
              <div style={{ fontSize: 13, color: "var(--muted)" }}>
                <strong style={{ color: "#475569" }}>Where:</strong> {ticket.resourceLocation || "—"}{" "}
                <span style={{ margin: "0 6px", opacity: 0.5 }}>|</span>
                <strong style={{ color: "#475569" }}>Priority:</strong> {ticket.priority}
                {ticket.preferredContact ? (
                  <>
                    <span style={{ margin: "0 6px", opacity: 0.5 }}>|</span>
                    <strong style={{ color: "#475569" }}>Contact:</strong> {ticket.preferredContact}
                  </>
                ) : null}
              </div>
              {ticket.assignedTechnicianName ? <div style={{ fontSize: 13 }}>Assigned: {ticket.assignedTechnicianName}</div> : null}
              {ticket.resolutionNotes ? <div style={{ fontSize: 13 }}>Resolution: {ticket.resolutionNotes}</div> : null}
              {ticket.rejectionReason ? <div style={{ fontSize: 13, color: "#b71c1c" }}>Rejected: {ticket.rejectionReason}</div> : null}
            </>
          )}
          {Array.isArray(ticket.attachments) && ticket.attachments.length > 0 ? (
            <div style={{ marginTop: 8 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Attachments</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {ticket.attachments.map((path, idx) => {
                  const src = toAttachmentUrl(path);
                  return (
                    <a key={`${ticket.id}-attachment-${idx}`} href={src} target="_blank" rel="noreferrer">
                      <img
                        src={src}
                        alt={`ticket-${ticket.id}-attachment-${idx + 1}`}
                        style={{
                          width: 90,
                          height: 90,
                          objectFit: "cover",
                          borderRadius: 8,
                          border: "1px solid #d1d5db",
                        }}
                      />
                    </a>
                  );
                })}
              </div>
            </div>
          ) : null}

          {isAdmin ? <div style={{ marginTop: 8 }}><AdminAssignment ticket={ticket} users={users} onAssign={onAssign} onReject={onReject} /></div> : null}
          {isTechnician ? <TechnicianActions ticket={ticket} onStatusChange={onStatus} /> : null}

          <CommentSection
            comments={commentsByTicket[ticket.id] || []}
            currentUser={user}
            draft={commentDrafts[ticket.id] || ""}
            onDraft={(value) => onCommentDraft(ticket.id, value)}
            onPost={() => onCommentPost(ticket.id)}
            onEdit={onCommentEdit}
            onDelete={onCommentDelete}
          />
        </div>
      ))}
    </div>
  );
}

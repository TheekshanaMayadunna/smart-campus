import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Link } from "react-router-dom";
import AdminAssignment from "./AdminAssignment";
import CommentSection from "./CommentSection";
import TechnicianActions from "./TechnicianActions";
import { promptPopup, showErrorPopup } from "../../utils/popup";

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
  if (value === "CLOSED") return { background: "rgba(148, 163, 184, 0.18)", color: "var(--text)" };
  return { background: "rgba(148, 163, 184, 0.16)", color: "var(--text)" };
}

const adminBtn = {
  fontSize: 12,
  fontWeight: 600,
  padding: "6px 12px",
  borderRadius: 8,
  border: "1px solid var(--border)",
  background: "var(--panel)",
  color: "var(--text)",
  cursor: "pointer",
  fontFamily: "inherit",
};

const adminRequestLine = { fontSize: 13, color: "var(--text)", lineHeight: 1.45, marginBottom: 5 };
const adminRequestKey = { color: "var(--muted)", fontWeight: 600 };

function canDeleteResolved(status) {
  const value = String(status || "").toUpperCase();
  return value === "RESOLVED" || value === "CLOSED";
}

function locationLabel(ticket) {
  return ticket.locationText || ticket.resourceLocation || "-";
}

function formatDateTime(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString();
}

function showSlaBadge(ticket) {
  const status = String(ticket.status || "").toUpperCase();
  return Boolean(ticket.slaState) && ticket.slaState !== "ON TRACK" && status !== "CLOSED" && status !== "REJECTED";
}

function slaBadgeStyle(ticket) {
  if (ticket.slaState === "SLA BREACHED") {
    return { background: "#fee2e2", color: "#b91c1c" };
  }
  if (ticket.slaState === "DUE SOON") {
    return { background: "#fef3c7", color: "#92400e" };
  }
  return { background: "#dcfce7", color: "#166534" };
}

function canPostComment(ticket, user) {
  if (String(user?.role || "").toUpperCase() === "ADMIN") {
    return true;
  }
  const status = String(ticket?.status || "").toUpperCase();
  return status === "OPEN" || status === "IN_PROGRESS" || status === "RESOLVED";
}

function priorityTone(priority) {
  const value = String(priority || "").toUpperCase();
  if (value === "CRITICAL" || value === "URGENT") {
    return { background: "rgba(220, 38, 38, 0.12)", color: "#b91c1c", border: "rgba(220, 38, 38, 0.2)" };
  }
  if (value === "HIGH") {
    return { background: "rgba(245, 158, 11, 0.16)", color: "#92400e", border: "rgba(245, 158, 11, 0.22)" };
  }
  if (value === "MEDIUM") {
    return { background: "rgba(59, 130, 246, 0.12)", color: "#1d4ed8", border: "rgba(59, 130, 246, 0.2)" };
  }
  return { background: "rgba(15, 23, 42, 0.06)", color: "#475569", border: "rgba(148, 163, 184, 0.24)" };
}

function shortDescription(text) {
  const value = String(text || "").trim();
  if (!value) return "-";
  return value.length > 150 ? `${value.slice(0, 147).trim()}...` : value;
}

function AdminWorkflowActions({ ticket, onStatus }) {
  const status = String(ticket.status || "").toUpperCase();

  const runStatusUpdate = async (payload) => {
    try {
      await onStatus(ticket.id, payload);
    } catch (error) {
      showErrorPopup("Could not update ticket", String(error?.response?.data || error?.message || "Request failed"));
    }
  };

  const rejectTicket = async () => {
    const reason = await promptPopup({
      title: "Reject ticket",
      inputPlaceholder: "Enter rejection reason",
      confirmButtonText: "Reject ticket",
      cancelButtonText: "Cancel",
    });
    if (!reason || !reason.trim()) return;
    await runStatusUpdate({ status: "REJECTED", rejectionReason: reason.trim() });
  };

  const resolveTicket = async () => {
    const notes = await promptPopup({
      title: "Resolve ticket",
      inputPlaceholder: "Enter resolution notes",
      confirmButtonText: "Mark resolved",
      cancelButtonText: "Cancel",
    });
    if (!notes || !notes.trim()) return;
    await runStatusUpdate({ status: "RESOLVED", resolutionNotes: notes.trim() });
  };

  const updateResolutionNotes = async () => {
    const notes = await promptPopup({
      title: "Update resolution notes",
      inputValue: ticket.resolutionNotes || "",
      inputPlaceholder: "Enter resolution notes",
      confirmButtonText: "Save notes",
      cancelButtonText: "Cancel",
    });
    if (!notes || !notes.trim()) return;
    try {
      await onStatus(ticket.id, { resolutionNotes: notes.trim() }, "resolution-notes");
    } catch (error) {
      showErrorPopup("Could not update resolution notes", String(error?.response?.data || error?.message || "Request failed"));
    }
  };

  const actions = [];
  if (status === "OPEN") {
    actions.push(
      <button key="progress" type="button" className="btnMini" onClick={() => runStatusUpdate({ status: "IN_PROGRESS" })}>
        Move to In Progress
      </button>
    );
    actions.push(
      <button key="reject" type="button" className="btnMini danger" onClick={rejectTicket}>
        Reject
      </button>
    );
  }
  if (status === "IN_PROGRESS") {
    actions.push(
      <button key="notes" type="button" className="btnMini" onClick={updateResolutionNotes}>
        Save Resolution Notes
      </button>
    );
    actions.push(
      <button key="resolve" type="button" className="btnMini" onClick={resolveTicket}>
        Mark Resolved
      </button>
    );
    actions.push(
      <button key="reject" type="button" className="btnMini danger" onClick={rejectTicket}>
        Reject
      </button>
    );
  }
  if (status === "RESOLVED") {
    actions.push(
      <button key="notes" type="button" className="btnMini" onClick={updateResolutionNotes}>
        Update Resolution Notes
      </button>
    );
    actions.push(
      <button key="reopen" type="button" className="btnMini" onClick={() => runStatusUpdate({ status: "IN_PROGRESS" })}>
        Reopen
      </button>
    );
    actions.push(
      <button key="close" type="button" className="btnMini" onClick={() => runStatusUpdate({ status: "CLOSED" })}>
        Close Ticket
      </button>
    );
  }

  if (actions.length === 0) return null;

  return (
    <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
      {actions}
    </div>
  );
}

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
  const [expandedTickets, setExpandedTickets] = useState({});

  useEffect(() => {
    setExpandedTickets((prev) => {
      const next = {};
      tickets.forEach((ticket) => {
        next[ticket.id] = Object.prototype.hasOwnProperty.call(prev, ticket.id) ? prev[ticket.id] : false;
      });
      return next;
    });
  }, [tickets]);

  const toggleExpanded = (ticketId) => {
    setExpandedTickets((prev) => ({ ...prev, [ticketId]: !prev[ticketId] }));
  };

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <style>{`
        .ticketCard {
          position: relative;
          overflow: hidden;
          border: 1px solid rgba(148, 163, 184, 0.22);
          border-radius: 24px;
          padding: 18px;
          background:
            radial-gradient(circle at top right, rgba(14, 165, 233, 0.10), transparent 34%),
            linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.98));
          box-shadow: 0 20px 42px rgba(15, 23, 42, 0.08);
        }

        .ticketCard::before {
          content: "";
          position: absolute;
          inset: 0 auto 0 0;
          width: 5px;
          background: linear-gradient(180deg, #0f766e, #0ea5e9 52%, #f59e0b);
          opacity: 0.9;
        }

        .ticketHeader {
          display: flex;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
          align-items: flex-start;
        }

        .ticketCode {
          margin: 0;
          font-size: 1.05rem;
          font-weight: 800;
          color: #0f172a;
          letter-spacing: -0.02em;
        }

        .ticketMetaRow {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 10px;
        }

        .ticketMicroPill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 7px 11px;
          border-radius: 999px;
          border: 1px solid rgba(148, 163, 184, 0.18);
          background: rgba(255, 255, 255, 0.72);
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          color: #475569;
        }

        .ticketPreviewRow {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          gap: 12px;
          align-items: center;
          margin-top: 14px;
          padding: 14px 16px;
          border-radius: 18px;
          border: 1px solid rgba(148, 163, 184, 0.15);
          background: rgba(255, 255, 255, 0.74);
        }

        .ticketPreviewLabel {
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #64748b;
          margin-bottom: 6px;
        }

        .ticketPreviewText {
          font-size: 14px;
          line-height: 1.55;
          color: #0f172a;
          word-break: break-word;
        }

        .ticketExpandBtn {
          min-height: 42px;
          padding: 0 14px;
          border-radius: 14px;
          border: 1px solid rgba(15, 118, 110, 0.16);
          background: rgba(20, 184, 166, 0.10);
          color: #0f766e;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          font-family: inherit;
          white-space: nowrap;
        }

        .ticketExpandArea {
          display: grid;
          gap: 14px;
          margin-top: 14px;
        }

        .ticketSummaryGrid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 10px;
        }

        .ticketSummaryItem {
          border: 1px solid rgba(148, 163, 184, 0.16);
          border-radius: 16px;
          padding: 12px 14px;
          background: rgba(255, 255, 255, 0.7);
          min-width: 0;
        }

        .ticketSummaryLabel {
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #64748b;
          margin-bottom: 6px;
        }

        .ticketSummaryValue {
          font-size: 14px;
          font-weight: 600;
          color: #0f172a;
          line-height: 1.45;
          word-break: break-word;
        }

        .ticketBodyShell {
          border-radius: 20px;
          border: 1px solid rgba(148, 163, 184, 0.14);
          background: rgba(255, 255, 255, 0.62);
          padding: 16px;
          backdrop-filter: blur(8px);
        }

        .ticketSectionLabel {
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #64748b;
          margin-bottom: 8px;
        }

        .ticketDescription {
          margin: 0;
          color: #0f172a;
          line-height: 1.7;
          font-size: 14px;
          white-space: pre-wrap;
        }

        .ticketCallout {
          margin-top: 12px;
          border-radius: 16px;
          padding: 12px 14px;
          font-size: 13px;
          line-height: 1.55;
          border: 1px solid rgba(148, 163, 184, 0.16);
          background: rgba(241, 245, 249, 0.72);
          color: #334155;
        }

        .ticketCalloutDanger {
          background: rgba(254, 242, 242, 0.95);
          border-color: rgba(248, 113, 113, 0.24);
          color: #b91c1c;
        }

        .ticketAttachmentGrid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(92px, 92px));
          gap: 10px;
        }

        .ticketAttachmentThumb {
          width: 92px;
          height: 92px;
          object-fit: cover;
          border-radius: 16px;
          border: 1px solid rgba(148, 163, 184, 0.2);
          box-shadow: 0 8px 16px rgba(15, 23, 42, 0.08);
          background: #fff;
        }

        @media (max-width: 720px) {
          .ticketPreviewRow {
            grid-template-columns: 1fr;
          }

          .ticketExpandBtn {
            width: 100%;
            justify-content: center;
          }
        }

        :root[data-theme="dark"] .ticketCard {
          border-color: rgba(148, 163, 184, 0.16);
          background:
            radial-gradient(circle at top right, rgba(56, 189, 248, 0.12), transparent 34%),
            linear-gradient(180deg, rgba(15, 23, 42, 0.92), rgba(11, 18, 32, 0.98));
          box-shadow: 0 20px 44px rgba(2, 6, 23, 0.34);
        }

        :root[data-theme="dark"] .ticketCode,
        :root[data-theme="dark"] .ticketSummaryValue,
        :root[data-theme="dark"] .ticketDescription,
        :root[data-theme="dark"] .ticketPreviewText {
          color: rgba(226, 232, 240, 0.96);
        }

        :root[data-theme="dark"] .ticketMicroPill,
        :root[data-theme="dark"] .ticketSummaryItem,
        :root[data-theme="dark"] .ticketBodyShell,
        :root[data-theme="dark"] .ticketPreviewRow {
          background: rgba(15, 23, 42, 0.72);
          border-color: rgba(148, 163, 184, 0.14);
        }

        :root[data-theme="dark"] .ticketMicroPill,
        :root[data-theme="dark"] .ticketSectionLabel,
        :root[data-theme="dark"] .ticketSummaryLabel,
        :root[data-theme="dark"] .ticketPreviewLabel {
          color: rgba(148, 163, 184, 0.92);
        }

        :root[data-theme="dark"] .ticketCallout {
          background: rgba(30, 41, 59, 0.78);
          border-color: rgba(148, 163, 184, 0.14);
          color: rgba(226, 232, 240, 0.9);
        }

        :root[data-theme="dark"] .ticketCalloutDanger {
          background: rgba(127, 29, 29, 0.28);
          border-color: rgba(248, 113, 113, 0.24);
          color: rgba(254, 202, 202, 0.94);
        }

        :root[data-theme="dark"] .ticketExpandBtn {
          background: rgba(20, 184, 166, 0.14);
          border-color: rgba(45, 212, 191, 0.18);
          color: #7dd3fc;
        }
      `}</style>
      {tickets.map((ticket) => {
        const isExpanded = Boolean(expandedTickets[ticket.id]);
        const priorityStyle = priorityTone(ticket.priority);

        return (
          <div key={ticket.id} className="ticketCard">
            <div className="ticketHeader">
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  <h3 className="ticketCode">{ticket.ticketCode || `Ticket #${ticket.id}`}</h3>
                  <Link to={`/tickets/${ticket.id}`} style={{ fontSize: 12, fontWeight: 800, color: "#0f766e", textDecoration: "none" }}>
                    View details
                  </Link>
                </div>
                <div className="ticketMetaRow">
                  <span className="ticketMicroPill">Category {ticket.category || "-"}</span>
                  <span className="ticketMicroPill">Created {formatDateTime(ticket.createdAt) || "-"}</span>
                  {ticket.updatedAt ? <span className="ticketMicroPill">Updated {formatDateTime(ticket.updatedAt)}</span> : null}
                  {ticket.assignedTechnicianName ? <span className="ticketMicroPill">Assigned {ticket.assignedTechnicianName}</span> : null}
                  {ticket.preferredContact ? <span className="ticketMicroPill">Contact {ticket.preferredContact}</span> : null}
                </div>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
                {showSlaBadge(ticket) ? (
                  <span
                    style={{
                      ...slaBadgeStyle(ticket),
                      borderRadius: 999,
                      padding: "3px 10px",
                      fontSize: 12,
                      fontWeight: 700,
                      letterSpacing: 0.2,
                    }}
                  >
                    {ticket.slaState}
                  </span>
                ) : null}
                {isAdmin && canDeleteResolved(ticket.status) && typeof onAdminDownloadResolvedPdf === "function" ? (
                  <button type="button" style={adminBtn} onClick={() => onAdminDownloadResolvedPdf(ticket.id)}>
                    Download PDF
                  </button>
                ) : null}
                {(isAdmin || isTechnician) && canDeleteResolved(ticket.status) && typeof onDeleteResolvedTicket === "function" ? (
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
                    padding: "6px 12px",
                    fontSize: 12,
                    fontWeight: 800,
                    letterSpacing: 0.3,
                  }}
                >
                  {ticket.status}
                </span>
              </div>
            </div>

            <div className="ticketPreviewRow">
              <div>
                <div className="ticketPreviewLabel">Quick Summary</div>
                <div className="ticketPreviewText">{shortDescription(ticket.description)}</div>
              </div>
              <button
                type="button"
                className="ticketExpandBtn"
                onClick={() => toggleExpanded(ticket.id)}
                aria-expanded={isExpanded}
                aria-controls={`ticket-expand-${ticket.id}`}
              >
                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                <span>{isExpanded ? "Show less" : "Show more"}</span>
              </button>
            </div>

            {isExpanded ? (
              <div id={`ticket-expand-${ticket.id}`} className="ticketExpandArea">
                <div className="ticketSummaryGrid">
                  <div className="ticketSummaryItem">
                    <div className="ticketSummaryLabel">Location</div>
                    <div className="ticketSummaryValue">{locationLabel(ticket)}</div>
                  </div>
                  <div className="ticketSummaryItem">
                    <div className="ticketSummaryLabel">Priority</div>
                    <div className="ticketSummaryValue">
                      <span
                        style={{
                          ...priorityStyle,
                          display: "inline-flex",
                          alignItems: "center",
                          padding: "6px 10px",
                          borderRadius: 999,
                          border: `1px solid ${priorityStyle.border}`,
                          fontSize: 12,
                          fontWeight: 800,
                          letterSpacing: 0.04,
                          textTransform: "uppercase",
                        }}
                      >
                        {ticket.priority || "-"}
                      </span>
                    </div>
                  </div>
                  <div className="ticketSummaryItem">
                    <div className="ticketSummaryLabel">Progress</div>
                    <div className="ticketSummaryValue">{ticket.slaState || "On track"}</div>
                  </div>
                </div>

                <div className="ticketBodyShell">
                  {isAdmin ? (
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                        gap: 10,
                      }}
                    >
                      <div style={{ border: "1px solid var(--border)", borderRadius: 18, padding: 14, background: "var(--panel-soft)" }}>
                        <div className="ticketSectionLabel">User Request Details</div>
                        <div style={adminRequestLine}>
                          <span style={adminRequestKey}>Description</span>
                          {" - "}
                          {ticket.description?.trim() ? ticket.description : "-"}
                        </div>
                        <div style={adminRequestLine}>
                          <span style={adminRequestKey}>Resource / location</span>
                          {" - "}
                          {locationLabel(ticket)?.trim() ? locationLabel(ticket) : "-"}
                        </div>
                        <div style={adminRequestLine}>
                          <span style={adminRequestKey}>Priority</span>
                          {" - "}
                          {ticket.priority || "-"}
                        </div>
                        <div style={adminRequestLine}>
                          <span style={adminRequestKey}>Preferred contact</span>
                          {" - "}
                          {ticket.preferredContact?.trim() ? ticket.preferredContact : "-"}
                        </div>
                        {ticket.createdAt ? (
                          <div style={{ ...adminRequestLine, marginBottom: 0 }}>
                            <span style={adminRequestKey}>Submitted</span>
                            {" - "}
                            {new Date(ticket.createdAt).toLocaleString()}
                          </div>
                        ) : null}
                      </div>

                      <div style={{ border: "1px solid var(--border)", borderRadius: 18, padding: 14, background: "var(--panel-soft)" }}>
                        <div className="ticketSectionLabel">Technician Workflow</div>
                        <div style={{ fontSize: 13 }}>
                          Assigned: <strong>{ticket.assignedTechnicianName || "Not assigned yet"}</strong>
                        </div>
                        {ticket.resolutionNotes ? <div style={{ fontSize: 13, marginTop: 6 }}>Resolution: {ticket.resolutionNotes}</div> : null}
                        {ticket.rejectionReason ? <div style={{ fontSize: 13, color: "#b71c1c", marginTop: 6 }}>Rejected: {ticket.rejectionReason}</div> : null}
                        {typeof onStatus === "function" ? <AdminWorkflowActions ticket={ticket} onStatus={onStatus} /> : null}
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="ticketSectionLabel">Issue Summary</div>
                      <p className="ticketDescription">{ticket.description || "-"}</p>
                      {ticket.assignedTechnicianName ? (
                        <div className="ticketCallout">
                          <strong>Assigned technician:</strong> {ticket.assignedTechnicianName}
                        </div>
                      ) : null}
                      {ticket.resolutionNotes ? (
                        <div className="ticketCallout">
                          <strong>Resolution notes:</strong> {ticket.resolutionNotes}
                        </div>
                      ) : null}
                      {ticket.rejectionReason ? (
                        <div className="ticketCallout ticketCalloutDanger">
                          <strong>Rejected:</strong> {ticket.rejectionReason}
                        </div>
                      ) : null}
                    </>
                  )}
                </div>

                {Array.isArray(ticket.attachments) && ticket.attachments.length > 0 ? (
                  <div>
                    <div className="ticketSectionLabel">Attachments</div>
                    <div className="ticketAttachmentGrid">
                      {ticket.attachments.map((path, idx) => {
                        const src = toAttachmentUrl(path);
                        return (
                          <a key={`${ticket.id}-attachment-${idx}`} href={src} target="_blank" rel="noreferrer">
                            <img
                              src={src}
                              alt={`ticket-${ticket.id}-attachment-${idx + 1}`}
                              className="ticketAttachmentThumb"
                            />
                          </a>
                        );
                      })}
                    </div>
                  </div>
                ) : null}

                {isAdmin ? (
                  <div>
                    <AdminAssignment ticket={ticket} users={users} onAssign={onAssign} onReject={onReject} />
                  </div>
                ) : null}
                {isTechnician ? <TechnicianActions ticket={ticket} onStatusChange={onStatus} /> : null}

                <CommentSection
                  comments={commentsByTicket[ticket.id] || []}
                  currentUser={user}
                  draft={commentDrafts[ticket.id] || ""}
                  onDraft={(value) => onCommentDraft(ticket.id, value)}
                  onPost={() => onCommentPost(ticket.id)}
                  onEdit={onCommentEdit}
                  onDelete={onCommentDelete}
                  canPost={canPostComment(ticket, user)}
                  postBlockedMessage="Comments are closed for rejected or closed tickets unless you are an admin."
                />
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

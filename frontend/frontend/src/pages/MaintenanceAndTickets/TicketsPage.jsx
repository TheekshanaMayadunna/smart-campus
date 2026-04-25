import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import ResourceLayout from "../../components/resource/ResourceLayout";
import { ticketApi } from "../../api/MaintenanceAndTickets/ticketApi";
import { resourceService } from "../../services/resourceService";
import TechnicianDashboard from "./TechnicianDashboard";
import AdminTicketManager from "./AdminTicketManager";
import TicketForm from "../../components/tickets/TicketForm";
import TicketTable from "../../components/tickets/TicketTable";
import TicketFiltersPanel, { buildTicketListFilters } from "./TicketFiltersPanel";
import { confirmPopup, promptPopup } from "../../utils/popup";

const EMPTY_FILTERS = {
  status: "",
  priority: "",
  category: "",
  assignedTechnicianId: "",
  createdFrom: "",
  createdTo: "",
  resourceOrLocation: "",
  keyword: "",
};

export default function TicketsPage({ onLogout, user, theme = "light", onToggleTheme }) {
  const [tickets, setTickets] = useState([]);
  const [commentsByTicket, setCommentsByTicket] = useState({});
  const [commentDrafts, setCommentDrafts] = useState({});
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [showCreate, setShowCreate] = useState(false);

  const isAdmin = user?.role === "ADMIN";
  if (user?.role === "TECHNICIAN") {
    return (
      <ResourceLayout onLogout={onLogout} user={user} theme={theme} onToggleTheme={onToggleTheme}>
        <TechnicianDashboard user={user} />
      </ResourceLayout>
    );
  }
  if (isAdmin) {
    return (
      <ResourceLayout onLogout={onLogout} user={user} theme={theme} onToggleTheme={onToggleTheme}>
        <div className="card"><h2 style={{ marginTop: 0 }}>Admin Ticket Manager</h2></div>
        <div className="card" style={{ marginTop: 16 }}><AdminTicketManager user={user} /></div>
      </ResourceLayout>
    );
  }

  const loadTickets = async (activeFilters = filters) => {
    setLoading(true);
    setError("");
    try {
      const data = await ticketApi.list(buildTicketListFilters(activeFilters));
      const all = Array.isArray(data) ? data : [];
      setTickets(all);
      const allComments = {};
      await Promise.all(
        all.map(async (ticket) => {
          const comments = await ticketApi.listComments(ticket.id);
          allComments[ticket.id] = Array.isArray(comments) ? comments : [];
        })
      );
      setCommentsByTicket(allComments);
    } catch (err) {
      setError(err?.response?.data || "Failed to load tickets.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
    resourceService
      .list({ size: 500 })
      .then((data) => {
        const list = Array.isArray(data) ? data : Array.isArray(data?.content) ? data.content : [];
        setResources(list);
      })
      .catch(() => setResources([]));
  }, []);

  useEffect(() => {
    if (!showCreate) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (e) => {
      if (e.key === "Escape") setShowCreate(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [showCreate]);

  const updateFilter = (key, value) => {
    const next = { ...filters, [key]: value };
    setFilters(next);
    loadTickets(next);
  };

  const resetFilters = () => {
    setFilters(EMPTY_FILTERS);
    loadTickets(EMPTY_FILTERS);
  };

  const createTicket = async (form) => {
    setError("");
    try {
      await ticketApi.create(form);
      setShowCreate(false);
      await loadTickets();
    } catch (err) {
      setError(err?.response?.data || "Failed to create ticket.");
    }
  };

  const addComment = async (ticketId) => {
    const content = commentDrafts[ticketId];
    if (!content || !content.trim()) return;
    await ticketApi.addComment(ticketId, content.trim());
    setCommentDrafts((prev) => ({ ...prev, [ticketId]: "" }));
    await loadTickets();
  };

  const updateComment = async (comment) => {
    const next = await promptPopup({
      title: "Edit comment",
      inputValue: comment.content || "",
      inputPlaceholder: "Update your comment",
      confirmButtonText: "Save changes",
      cancelButtonText: "Cancel",
    });
    if (next === null) return;
    await ticketApi.updateComment(comment.id, next);
    await loadTickets();
  };

  const deleteComment = async (commentId) => {
    const confirmed = await confirmPopup({
      title: "Delete this comment?",
      text: "This action cannot be undone.",
      confirmButtonText: "Yes, delete",
      cancelButtonText: "Cancel",
      icon: "warning",
    });
    if (!confirmed) return;
    await ticketApi.deleteComment(commentId);
    await loadTickets();
  };

  return (
    <ResourceLayout onLogout={onLogout} user={user} theme={theme} onToggleTheme={onToggleTheme}>
      <style>{`
        @keyframes ticketModalIn {
          from { opacity: 0; transform: translateY(10px) scale(0.985); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
      <div style={{ display: "grid", gap: 16 }}>
        <div className="card">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <h2 style={{ marginTop: 0, marginBottom: 0 }}>Incident Ticketing</h2>
            <button
              type="button"
              className="btnMini"
              onClick={() => setShowCreate(true)}
              style={{ padding: "10px 14px", fontSize: 13, fontWeight: 700 }}
            >
              + Create new ticket
            </button>
          </div>
          {error ? <div style={{ color: "#b71c1c", marginBottom: 8 }}>{String(error)}</div> : null}
          {showCreate ? (
            createPortal(
              <div
                role="dialog"
                aria-modal="true"
                onClick={(e) => {
                  if (e.target === e.currentTarget) setShowCreate(false);
                }}
                style={{
                  position: "fixed",
                  inset: 0,
                  background: "rgba(2, 6, 23, 0.58)",
                  backdropFilter: "blur(6px)",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  padding: 16,
                  zIndex: 99999,
                }}
              >
                <div
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    width: "min(820px, 100%)",
                    maxHeight: "calc(100vh - 32px)",
                    overflow: "auto",
                    background: theme === "dark" ? "rgba(15, 23, 42, 0.96)" : "#ffffff",
                    borderRadius: 18,
                    border: theme === "dark" ? "1px solid rgba(148, 163, 184, 0.22)" : "1px solid rgba(226,232,240,0.9)",
                    boxShadow: "0 28px 70px rgba(2, 6, 23, 0.45)",
                    animation: "ticketModalIn 140ms ease-out",
                  }}
                >
                  <div
                    style={{
                      position: "sticky",
                      top: 0,
                      zIndex: 1,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 10,
                      padding: "12px 14px",
                      background: theme === "dark" ? "rgba(15, 23, 42, 0.86)" : "rgba(255,255,255,0.9)",
                      borderBottom: theme === "dark" ? "1px solid rgba(148, 163, 184, 0.2)" : "1px solid #e2e8f0",
                      backdropFilter: "blur(8px)",
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 900, color: theme === "dark" ? "rgba(226, 232, 240, 0.96)" : "#0f172a", lineHeight: 1.2 }}>Create ticket</div>
                      <div style={{ fontSize: 12, color: theme === "dark" ? "rgba(148, 163, 184, 0.9)" : "#64748b", marginTop: 2 }}>
                        Choose a category and describe the issue. Attach up to 3 images if needed.
                      </div>
                    </div>
                    <button
                      type="button"
                      aria-label="Close dialog"
                      onClick={() => setShowCreate(false)}
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 12,
                        border: theme === "dark" ? "1px solid rgba(148, 163, 184, 0.22)" : "1px solid #e2e8f0",
                        background: theme === "dark" ? "rgba(12, 20, 36, 0.92)" : "#fff",
                        color: theme === "dark" ? "rgba(226, 232, 240, 0.96)" : "#0f172a",
                        fontWeight: 900,
                        display: "grid",
                        placeItems: "center",
                        boxShadow: "none",
                      }}
                    >
                      ×
                    </button>
                  </div>
                  <div style={{ padding: 14 }}>
                    <TicketForm onCreate={createTicket} resources={resources} />
                  </div>
                </div>
              </div>,
              document.body
            )
          ) : null}
        </div>

        <div className="card">
          <h3 style={{ marginTop: 0 }}>My Tickets</h3>
          <TicketFiltersPanel filters={filters} onChange={updateFilter} onReset={resetFilters} />
          {loading ? <p>Loading...</p> : null}
          {!loading && tickets.length === 0 ? <p>No tickets found.</p> : null}
          <TicketTable
            tickets={tickets}
            isAdmin={false}
            isTechnician={false}
            users={[]}
            commentsByTicket={commentsByTicket}
            commentDrafts={commentDrafts}
            user={user}
            onAssign={async () => {}}
            onReject={async () => {}}
            onStatus={async () => {}}
            onCommentDraft={(ticketId, value) => setCommentDrafts((prev) => ({ ...prev, [ticketId]: value }))}
            onCommentPost={addComment}
            onCommentEdit={updateComment}
            onCommentDelete={deleteComment}
          />
        </div>
      </div>
    </ResourceLayout>
  );
}

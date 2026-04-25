import { useEffect, useState } from "react";
import { ticketApi } from "../../api/MaintenanceAndTickets/ticketApi";
import TicketTable from "../../components/tickets/TicketTable";
import TicketFiltersPanel, { buildTicketListFilters } from "./TicketFiltersPanel";
import { confirmPopup, promptPopup, showErrorPopup } from "../../utils/popup";
import "../../components/resource/resource.css";
import "../notifications.css";

const FILTERS = [
  {
    key: "URGENT_ATTENTION",
    label: "Urgent Attention",
    getCount: (tickets) =>
      tickets.filter(
        (ticket) =>
          ticket.status !== "CLOSED" &&
          ticket.status !== "REJECTED" &&
          (ticket.slaState === "SLA BREACHED" || ["URGENT", "CRITICAL", "HIGH"].includes(String(ticket.priority || "").toUpperCase()))
      ).length,
    dot: "#dc2626",
  },
  { key: "ASSIGNED_TO_ME", label: "Assigned To Me", getCount: (tickets) => tickets.filter((ticket) => ticket.status === "OPEN" || ticket.status === "IN_PROGRESS").length, dot: "#3b82f6" },
  { key: "RESOLVED_AWAITING_CLOSURE", label: "Resolved Awaiting Closure", getCount: (tickets) => tickets.filter((ticket) => ticket.status === "RESOLVED").length, dot: "#10b981" },
];

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

export default function TechnicianDashboard({ user }) {
  const [tickets, setTickets] = useState([]);
  const [commentsByTicket, setCommentsByTicket] = useState({});
  const [commentDrafts, setCommentDrafts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("URGENT_ATTENTION");
  const [filters, setFilters] = useState(EMPTY_FILTERS);

  const loadTickets = async (activeFilters = filters) => {
    setLoading(true);
    setError("");
    try {
      const data = await ticketApi.list(buildTicketListFilters(activeFilters));
      const all = Array.isArray(data) ? data : [];
      setTickets(all);
      const byTicket = {};
      await Promise.all(
        all.map(async (ticket) => {
          byTicket[ticket.id] = await ticketApi.listComments(ticket.id);
        })
      );
      setCommentsByTicket(byTicket);
    } catch (err) {
      setError(err?.response?.data || "Failed to load assigned tasks.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, []);

  const updateFilter = (key, value) => {
    const next = { ...filters, [key]: value };
    setFilters(next);
    loadTickets(next);
  };

  const resetFilters = () => {
    setFilters(EMPTY_FILTERS);
    setFilter("URGENT_ATTENTION");
    loadTickets(EMPTY_FILTERS);
  };

  const handleStatus = async (ticketId, payload, action = "status") => {
    if (action === "resolution-notes") {
      await ticketApi.updateResolutionNotes(ticketId, payload.resolutionNotes);
    } else {
      await ticketApi.updateStatus(ticketId, payload);
    }
    await loadTickets();
  };

  const filteredTickets = tickets.filter((ticket) => {
    if (filter === "URGENT_ATTENTION") {
      return ticket.status !== "CLOSED"
        && ticket.status !== "REJECTED"
        && (ticket.slaState === "SLA BREACHED" || ["URGENT", "CRITICAL", "HIGH"].includes(String(ticket.priority || "").toUpperCase()));
    }
    if (filter === "ASSIGNED_TO_ME") return ticket.status === "OPEN" || ticket.status === "IN_PROGRESS";
    if (filter === "RESOLVED_AWAITING_CLOSURE") return ticket.status === "RESOLVED";
    return true;
  });

  const activeFilter = FILTERS.find((entry) => entry.key === filter);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600&family=Geist+Mono:wght@400;500&display=swap');

        .td-inner {
          width: 100%;
          display: grid;
          gap: 16px;
          font-family: 'Geist', system-ui, sans-serif;
        }

        .td-pageHeader {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
        }

        .td-pageHeader .resourcePageTitle {
          margin: 0 0 6px;
          font-size: 1.35rem;
          font-weight: 700;
          color: #0f172a;
        }

        .td-pageHeader .resourcePageSubtitle {
          margin: 0;
          font-size: 14px;
          color: #64748b;
          line-height: 1.4;
        }

        .td-roleBadge {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #3b82f6;
          background: rgba(59, 130, 246, 0.12);
          padding: 6px 10px;
          border-radius: 999px;
          flex-shrink: 0;
        }

        .td-filter-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1px;
          background: #e2e8f0;
          border: 1px solid #e2e8f0;
          border-radius: 14px 14px 0 0;
          overflow: hidden;
        }

        .td-filter-stat {
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 4px;
          padding: 16px 20px;
          background: #fff;
          cursor: pointer;
          transition: background 0.12s;
          position: relative;
          border: none;
          text-align: left;
          font-family: inherit;
        }

        .td-filter-stat:hover { background: #f8fafc; }
        .td-filter-stat.active { background: #f8fafc; }
        .td-filter-stat.active::after {
          content: '';
          position: absolute;
          bottom: 0; left: 0; right: 0;
          height: 2px;
          background: #1e293b;
          border-radius: 2px 2px 0 0;
        }

        .td-filter-stat-label {
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: #94a3b8;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .td-filter-stat.active .td-filter-stat-label { color: #475569; }

        .td-filter-stat-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .td-filter-stat-value {
          font-family: 'Geist Mono', monospace;
          font-size: 26px;
          font-weight: 500;
          color: #0f172a;
          line-height: 1;
        }

        .td-filter-stat-sub {
          font-size: 11px;
          color: #cbd5e1;
        }

        .td-filter-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 20px;
          background: #fff;
          border: 1px solid #e2e8f0;
          border-top: none;
          border-radius: 0 0 14px 14px;
          gap: 12px;
          flex-wrap: wrap;
        }

        .td-filter-crumb {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: #94a3b8;
        }

        .td-filter-crumb-sep { color: #cbd5e1; }
        .td-filter-crumb-active { color: #334155; font-weight: 500; }

        .td-table-card {
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          overflow: hidden;
        }

        .td-table-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 20px;
          border-bottom: 1px solid #f1f5f9;
          gap: 10px;
          flex-wrap: wrap;
        }

        .td-table-title {
          font-size: 13px;
          font-weight: 600;
          color: #334155;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .td-count-badge {
          background: #f1f5f9;
          color: #64748b;
          font-size: 11px;
          font-weight: 600;
          padding: 2px 8px;
          border-radius: 20px;
          font-family: 'Geist Mono', monospace;
        }

        .td-state {
          padding: 32px 20px;
          text-align: center;
          color: #94a3b8;
          font-size: 14px;
        }

        .td-state-icon {
          font-size: 28px;
          margin-bottom: 10px;
          display: block;
          opacity: 0.4;
        }

        .td-error {
          margin: 0 20px 16px;
          padding: 12px 16px;
          border-radius: 10px;
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #b91c1c;
          font-size: 13px;
        }

        .td-spinner {
          display: inline-block;
          width: 16px;
          height: 16px;
          border: 2px solid #e2e8f0;
          border-top-color: #1e293b;
          border-radius: 50%;
          animation: td-spin 0.7s linear infinite;
        }

        @keyframes td-spin { to { transform: rotate(360deg); } }

        :root[data-theme="dark"] .td-pageHeader .resourcePageTitle {
          color: rgba(226, 232, 240, 0.96);
        }

        :root[data-theme="dark"] .td-pageHeader .resourcePageSubtitle {
          color: rgba(148, 163, 184, 0.9);
        }

        :root[data-theme="dark"] .td-filter-stats {
          background: rgba(148, 163, 184, 0.16);
          border-color: rgba(148, 163, 184, 0.18);
        }

        :root[data-theme="dark"] .td-filter-stat {
          background: rgba(15, 23, 42, 0.86);
          color: rgba(226, 232, 240, 0.92);
        }

        :root[data-theme="dark"] .td-filter-stat:hover,
        :root[data-theme="dark"] .td-filter-stat.active {
          background: rgba(12, 20, 36, 0.92);
        }

        :root[data-theme="dark"] .td-filter-stat.active::after {
          background: #60a5fa;
        }

        :root[data-theme="dark"] .td-filter-stat-label {
          color: rgba(148, 163, 184, 0.9);
        }

        :root[data-theme="dark"] .td-filter-stat.active .td-filter-stat-label {
          color: rgba(226, 232, 240, 0.92);
        }

        :root[data-theme="dark"] .td-filter-stat-value {
          color: rgba(226, 232, 240, 0.96);
        }

        :root[data-theme="dark"] .td-filter-stat-sub {
          color: rgba(148, 163, 184, 0.7);
        }

        :root[data-theme="dark"] .td-filter-toolbar {
          background: rgba(15, 23, 42, 0.86);
          border-color: rgba(148, 163, 184, 0.18);
        }

        :root[data-theme="dark"] .td-filter-crumb {
          color: rgba(148, 163, 184, 0.9);
        }

        :root[data-theme="dark"] .td-filter-crumb-sep {
          color: rgba(148, 163, 184, 0.6);
        }

        :root[data-theme="dark"] .td-filter-crumb-active {
          color: rgba(226, 232, 240, 0.92);
        }

        :root[data-theme="dark"] .td-table-card {
          background: rgba(15, 23, 42, 0.82);
          border-color: rgba(148, 163, 184, 0.18);
        }

        :root[data-theme="dark"] .td-table-header {
          border-bottom-color: rgba(148, 163, 184, 0.16);
        }

        :root[data-theme="dark"] .td-table-title {
          color: rgba(226, 232, 240, 0.92);
        }

        :root[data-theme="dark"] .td-count-badge {
          background: rgba(148, 163, 184, 0.16);
          color: rgba(148, 163, 184, 0.92);
        }

        :root[data-theme="dark"] .td-state {
          color: rgba(148, 163, 184, 0.9);
        }

        :root[data-theme="dark"] .td-error {
          background: rgba(127, 29, 29, 0.35);
          border-color: rgba(248, 113, 113, 0.28);
          color: rgba(254, 202, 202, 0.92);
        }

        :root[data-theme="dark"] .td-spinner {
          border-color: rgba(148, 163, 184, 0.22);
          border-top-color: #60a5fa;
        }
      `}</style>

      <div className="td-inner">
        <section className="card resourcePageHeader notificationsHeader td-pageHeader">
          <div>
            <h1 className="resourcePageTitle">Technician Dashboard</h1>
            <p className="resourcePageSubtitle">Assigned tasks connected to your account.</p>
          </div>
          <span className="td-roleBadge">{user?.role || "TECHNICIAN"}</span>
        </section>

        <div>
          <div className="td-filter-stats">
            {FILTERS.map((entry) => {
              const count = entry.getCount(tickets);
              const isActive = filter === entry.key;
              return (
                <button key={entry.key} type="button" className={`td-filter-stat${isActive ? " active" : ""}`} onClick={() => setFilter(entry.key)}>
                  <span className="td-filter-stat-label">
                    {entry.dot ? <span className="td-filter-stat-dot" style={{ background: entry.dot }} /> : null}
                    {entry.label}
                  </span>
                  <span className="td-filter-stat-value">{count}</span>
                  {entry.key === "URGENT_ATTENTION" ? <span className="td-filter-stat-sub">priority queue</span> : null}
                </button>
              );
            })}
          </div>
          <div className="td-filter-toolbar">
            <div className="td-filter-crumb">
              <span>Tickets</span>
              <span className="td-filter-crumb-sep">/</span>
              <span className="td-filter-crumb-active">{activeFilter?.label}</span>
            </div>
            <span style={{ fontSize: 12, color: "#94a3b8" }}>
              {filteredTickets.length} of {tickets.length} shown
            </span>
          </div>
        </div>

        <TicketFiltersPanel filters={filters} onChange={updateFilter} onReset={resetFilters} />

        <div className="td-table-card">
          <div className="td-table-header">
            <span className="td-table-title">
              My Tickets
              {!loading ? <span className="td-count-badge">{filteredTickets.length}</span> : null}
            </span>
            {loading ? <span className="td-spinner" /> : null}
          </div>

          {error ? <div className="td-error">{String(error)}</div> : null}

          {!loading && !error && tickets.length === 0 ? (
            <div className="td-state">
              <span className="td-state-icon">-</span>
              No assigned tickets right now.
            </div>
          ) : !loading && !error && filteredTickets.length === 0 ? (
            <div className="td-state">
              <span className="td-state-icon">-</span>
              No tickets in this category.
            </div>
          ) : (
            <TicketTable
              tickets={filteredTickets}
              isAdmin={false}
              isTechnician
              users={[]}
              commentsByTicket={commentsByTicket}
              commentDrafts={commentDrafts}
              user={user}
              onAssign={async () => {}}
              onReject={async () => {}}
              onStatus={handleStatus}
              onCommentDraft={(ticketId, value) => setCommentDrafts((prev) => ({ ...prev, [ticketId]: value }))}
              onCommentPost={async (ticketId) => {
                await ticketApi.addComment(ticketId, commentDrafts[ticketId] || "");
                setCommentDrafts((prev) => ({ ...prev, [ticketId]: "" }));
                await loadTickets();
              }}
              onCommentEdit={async (comment) => {
                const next = await promptPopup({
                  title: "Edit comment",
                  inputValue: comment.content || "",
                  inputPlaceholder: "Update your comment",
                  confirmButtonText: "Save changes",
                  cancelButtonText: "Cancel",
                });
                if (next !== null) {
                  await ticketApi.updateComment(comment.id, next);
                  await loadTickets();
                }
              }}
              onCommentDelete={async (commentId) => {
                const confirmed = await confirmPopup({
                  title: "Delete this comment?",
                  text: "This action cannot be undone.",
                  confirmButtonText: "Yes, delete",
                  cancelButtonText: "Cancel",
                  icon: "warning",
                });
                if (confirmed) {
                  await ticketApi.deleteComment(commentId);
                  await loadTickets();
                }
              }}
              onDeleteResolvedTicket={async (ticketId) => {
                const confirmed = await confirmPopup({
                  title: "Delete this ticket?",
                  text: "Only resolved tickets can be removed. This cannot be undone.",
                  confirmButtonText: "Yes, delete ticket",
                  cancelButtonText: "Cancel",
                  icon: "warning",
                });
                if (confirmed) {
                  try {
                    await ticketApi.deleteResolvedTicket(ticketId);
                    await loadTickets();
                  } catch (e) {
                    showErrorPopup("Could not delete", String(e?.response?.data || e?.message || "Request failed"));
                  }
                }
              }}
            />
          )}
        </div>
      </div>
    </>
  );
}

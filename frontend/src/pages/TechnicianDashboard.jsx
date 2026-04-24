import { useEffect, useState } from "react";
import { ticketService } from "../services/ticketService";
import TicketTable from "../components/tickets/TicketTable";
import { confirmPopup, promptPopup, showErrorPopup } from "../utils/popup";
import "../components/resource/resource.css";
import "./notifications.css";

const FILTERS = [
  {
    key: "ALL",
    label: "Total assigned",
    getCount: (tickets) => tickets.length,
    dot: null,
  },
  {
    key: "IN_PROGRESS",
    label: "In progress",
    getCount: (tickets) => tickets.filter((t) => t.status === "IN_PROGRESS").length,
    dot: "#3b82f6",
  },
  {
    key: "RESOLVED",
    label: "Resolved",
    getCount: (tickets) => tickets.filter((t) => t.status === "RESOLVED").length,
    dot: "#10b981",
  },
];

export default function TechnicianDashboard({ user }) {
  const [tickets, setTickets] = useState([]);
  const [commentsByTicket, setCommentsByTicket] = useState({});
  const [commentDrafts, setCommentDrafts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("ALL");

  const loadTickets = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await ticketService.list();
      const all = Array.isArray(data) ? data : [];
      setTickets(all);
      const byTicket = {};
      await Promise.all(
        all.map(async (t) => {
          byTicket[t.id] = await ticketService.listComments(t.id);
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

  const handleStatus = async (ticketId, payload) => {
    await ticketService.updateStatus(ticketId, payload);
    await loadTickets();
  };

  const filteredTickets = tickets.filter((ticket) => {
    if (filter === "ALL") return true;
    if (filter === "IN_PROGRESS") return ticket.status === "IN_PROGRESS";
    if (filter === "RESOLVED") return ticket.status === "RESOLVED";
    return true;
  });

  const activeFilter = FILTERS.find((f) => f.key === filter);

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

        /* ── Three filter tabs (total / in progress / resolved) ── */
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

        .td-filter-crumb-active {
          color: #334155;
          font-weight: 500;
        }

        /* ── Table card ── */
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

        .td-table-body {
          padding: 16px 20px;
        }

        /* ── States ── */
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
              {FILTERS.map((f) => {
                const count = f.getCount(tickets);
                const isActive = filter === f.key;
                return (
                  <button
                    key={f.key}
                    type="button"
                    className={`td-filter-stat${isActive ? " active" : ""}`}
                    onClick={() => setFilter(f.key)}
                  >
                    <span className="td-filter-stat-label">
                      {f.dot && (
                        <span className="td-filter-stat-dot" style={{ background: f.dot }} />
                      )}
                      {f.label}
                    </span>
                    <span className="td-filter-stat-value">{count}</span>
                    {f.key === "ALL" && (
                      <span className="td-filter-stat-sub">all tickets</span>
                    )}
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

          {/* ── Table card ── */}
          <div className="td-table-card">
            <div className="td-table-header">
              <span className="td-table-title">
                My Tickets
                {!loading && (
                  <span className="td-count-badge">{filteredTickets.length}</span>
                )}
              </span>
              {loading && <span className="td-spinner" />}
            </div>

            {error && (
              <div className="td-error">{String(error)}</div>
            )}

            {!loading && !error && tickets.length === 0 ? (
              <div className="td-state">
                <span className="td-state-icon">📋</span>
                No assigned tickets right now.
              </div>
            ) : !loading && !error && filteredTickets.length === 0 ? (
              <div className="td-state">
                <span className="td-state-icon">📋</span>
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
                onCommentDraft={(ticketId, value) =>
                  setCommentDrafts((p) => ({ ...p, [ticketId]: value }))
                }
                onCommentPost={async (ticketId) => {
                  await ticketService.addComment(
                    ticketId,
                    commentDrafts[ticketId] || ""
                  );
                  setCommentDrafts((p) => ({ ...p, [ticketId]: "" }));
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
                    await ticketService.updateComment(comment.id, next);
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
                    await ticketService.deleteComment(commentId);
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
                      await ticketService.deleteResolvedTicket(ticketId);
                      await loadTickets();
                    } catch (e) {
                      showErrorPopup(
                        "Could not delete",
                        String(e?.response?.data || e?.message || "Request failed")
                      );
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
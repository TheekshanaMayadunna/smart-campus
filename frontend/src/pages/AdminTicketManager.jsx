import { useEffect, useState } from "react";
import { ticketService } from "../services/ticketService";
import { adminUserService } from "../services/adminUserService";
import TicketTable from "../components/tickets/TicketTable";
import { confirmPopup, promptPopup, showErrorPopup } from "../utils/popup";

const FILTERS = [
  {
    key: "ALL",
    label: "All",
    getCount: (tickets) => tickets.length,
    dot: null,
  },
  {
    key: "UNASSIGNED",
    label: "Unassigned",
    getCount: (tickets) => tickets.filter((t) => !t.assignedTechnicianId).length,
    dot: "#f59e0b",
  },
  {
    key: "IN_PROGRESS",
    label: "In Progress",
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

export default function AdminTicketManager({ user }) {
  const [tickets, setTickets] = useState([]);
  const [users, setUsers] = useState([]);
  const [commentsByTicket, setCommentsByTicket] = useState({});
  const [commentDrafts, setCommentDrafts] = useState({});
  const [filter, setFilter] = useState("ALL");

  const load = async () => {
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
  };

  useEffect(() => {
    load();
    adminUserService.list().then(setUsers).catch(() => setUsers([]));
  }, []);

  const filteredTickets = tickets.filter((ticket) => {
    if (filter === "ALL") return true;
    if (filter === "UNASSIGNED") return !ticket.assignedTechnicianId;
    if (filter === "IN_PROGRESS") return ticket.status === "IN_PROGRESS";
    if (filter === "RESOLVED") return ticket.status === "RESOLVED";
    return true;
  });

  const activeFilter = FILTERS.find((f) => f.key === filter);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600&family=Geist+Mono:wght@400;500&display=swap');

        .atm-wrap {
          font-family: 'Geist', system-ui, sans-serif;
          display: grid;
          gap: 0;
        }

        .atm-stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1px;
          background: #e2e8f0;
          border: 1px solid #e2e8f0;
          border-radius: 14px 14px 0 0;
          overflow: hidden;
        }

        .atm-stat {
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

        .atm-stat:hover { background: #f8fafc; }

        .atm-stat.active { background: #f8fafc; }

        .atm-stat.active::after {
          content: '';
          position: absolute;
          bottom: 0; left: 0; right: 0;
          height: 2px;
          background: #1e293b;
          border-radius: 2px 2px 0 0;
        }

        .atm-stat-label {
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: #94a3b8;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .atm-stat.active .atm-stat-label { color: #475569; }

        .atm-stat-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .atm-stat-value {
          font-family: 'Geist Mono', monospace;
          font-size: 26px;
          font-weight: 500;
          color: #0f172a;
          line-height: 1;
        }

        .atm-stat-sub {
          font-size: 11px;
          color: #cbd5e1;
        }

        .atm-toolbar {
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

        .atm-crumb {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: #94a3b8;
        }

        .atm-crumb-sep { color: #cbd5e1; }

        .atm-crumb-active {
          color: #334155;
          font-weight: 500;
        }

        .atm-table-wrap {
          margin-top: 16px;
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          overflow: hidden;
          background: #fff;
        }
      `}</style>

      <div className="atm-wrap">
        {/* Stat strip — doubles as filter tabs */}
        <div className="atm-stats">
          {FILTERS.map((f) => {
            const count = f.getCount(tickets);
            const isActive = filter === f.key;
            return (
              <button
                key={f.key}
                type="button"
                className={`atm-stat${isActive ? " active" : ""}`}
                onClick={() => setFilter(f.key)}
              >
                <span className="atm-stat-label">
                  {f.dot && (
                    <span className="atm-stat-dot" style={{ background: f.dot }} />
                  )}
                  {f.label}
                </span>
                <span className="atm-stat-value">{count}</span>
                {f.key === "ALL" && (
                  <span className="atm-stat-sub">total tickets</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Sub-toolbar */}
        <div className="atm-toolbar">
          <div className="atm-crumb">
            <span>Tickets</span>
            <span className="atm-crumb-sep">/</span>
            <span className="atm-crumb-active">{activeFilter?.label}</span>
          </div>
          <span style={{ fontSize: 12, color: "#94a3b8" }}>
            {filteredTickets.length} of {tickets.length} shown
          </span>
        </div>

        {/* Table */}
        <div className="atm-table-wrap">
          <TicketTable
            tickets={filteredTickets}
            isAdmin
            isTechnician={false}
            users={users}
            commentsByTicket={commentsByTicket}
            commentDrafts={commentDrafts}
            user={user}
            onAssign={async (ticketId, technicianId) => {
              await ticketService.assign(ticketId, technicianId);
              await load();
            }}
            onReject={async (ticketId, reason) => {
              await ticketService.updateStatus(ticketId, {
                status: "REJECTED",
                rejectionReason: reason,
              });
              await load();
            }}
            onStatus={async () => {}}
            onCommentDraft={(ticketId, value) =>
              setCommentDrafts((p) => ({ ...p, [ticketId]: value }))
            }
            onCommentPost={async (ticketId) => {
              await ticketService.addComment(ticketId, commentDrafts[ticketId] || "");
              setCommentDrafts((p) => ({ ...p, [ticketId]: "" }));
              await load();
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
                await load();
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
                await load();
              }
            }}
            onAdminDownloadResolvedPdf={async (ticketId) => {
              try {
                await ticketService.downloadResolvedTicketPdf(ticketId);
              } catch (e) {
                showErrorPopup("Could not download PDF", String(e?.message || e?.response?.data || "Request failed"));
              }
            }}
            onDeleteResolvedTicket={async (ticketId) => {
              const confirmed = await confirmPopup({
                title: "Delete this ticket?",
                text: "Only resolved or closed tickets can be removed. This cannot be undone.",
                confirmButtonText: "Yes, delete ticket",
                cancelButtonText: "Cancel",
                icon: "warning",
              });
              if (confirmed) {
                try {
                  await ticketService.deleteResolvedTicket(ticketId);
                  await load();
                } catch (e) {
                  showErrorPopup("Could not delete", String(e?.response?.data || e?.message || "Request failed"));
                }
              }
            }}
          />
        </div>
      </div>
    </>
  );
}
import { useEffect, useState } from "react";
import { ticketApi } from "../../api/MaintenanceAndTickets/ticketApi";
import { adminUserService } from "../../services/adminUserService";
import TicketTable from "../../components/tickets/TicketTable";
import TicketFiltersPanel, { buildTicketListFilters } from "./TicketFiltersPanel";
import { confirmPopup, promptPopup, showErrorPopup } from "../../utils/popup";

const FILTERS = [
  {
    key: "ALL_TICKETS",
    label: "All Tickets",
    getCount: (tickets) => tickets.length,
    dot: "#64748b",
  },
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
  {
    key: "AWAITING_TECHNICIAN",
    label: "Awaiting Technician",
    getCount: (tickets) => tickets.filter((ticket) => !ticket.assignedTechnicianId && ticket.status === "OPEN").length,
    dot: "#f59e0b",
  },
  {
    key: "ASSIGNED_QUEUE",
    label: "Assigned Queue",
    getCount: (tickets) => tickets.filter((ticket) => ticket.status === "IN_PROGRESS").length,
    dot: "#3b82f6",
  },
  {
    key: "RESOLVED_AWAITING_CLOSURE",
    label: "Resolved Awaiting Closure",
    getCount: (tickets) => tickets.filter((ticket) => ticket.status === "RESOLVED").length,
    dot: "#10b981",
  },
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

export default function AdminTicketManager({ user }) {
  const [tickets, setTickets] = useState([]);
  const [users, setUsers] = useState([]);
  const [commentsByTicket, setCommentsByTicket] = useState({});
  const [commentDrafts, setCommentDrafts] = useState({});
  const [filter, setFilter] = useState("ALL_TICKETS");
  const [filters, setFilters] = useState(EMPTY_FILTERS);

  const load = async (activeFilters = filters) => {
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
  };

  useEffect(() => {
    load();
    adminUserService.list().then(setUsers).catch(() => setUsers([]));
  }, []);

  const updateFilter = (key, value) => {
    const next = { ...filters, [key]: value };
    setFilters(next);
    load(next);
  };

  const resetFilters = () => {
    setFilters(EMPTY_FILTERS);
    setFilter("ALL_TICKETS");
    load(EMPTY_FILTERS);
  };

  const filteredTickets = tickets.filter((ticket) => {
    if (filter === "ALL_TICKETS") return true;
    if (filter === "URGENT_ATTENTION") {
      return ticket.status !== "CLOSED"
        && ticket.status !== "REJECTED"
        && (ticket.slaState === "SLA BREACHED" || ["URGENT", "CRITICAL", "HIGH"].includes(String(ticket.priority || "").toUpperCase()));
    }
    if (filter === "AWAITING_TECHNICIAN") return !ticket.assignedTechnicianId && ticket.status === "OPEN";
    if (filter === "ASSIGNED_QUEUE") return ticket.status === "IN_PROGRESS";
    if (filter === "RESOLVED_AWAITING_CLOSURE") return ticket.status === "RESOLVED";
    return true;
  });

  const activeFilter = FILTERS.find((entry) => entry.key === filter);

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
        .atm-crumb-active { color: #334155; font-weight: 500; }

        .atm-table-wrap {
          margin-top: 16px;
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          overflow: hidden;
          background: #fff;
        }

        :root[data-theme="dark"] .atm-stats {
          background: rgba(148, 163, 184, 0.16);
          border-color: rgba(148, 163, 184, 0.18);
        }

        :root[data-theme="dark"] .atm-stat {
          background: rgba(15, 23, 42, 0.86);
          color: rgba(226, 232, 240, 0.92);
        }

        :root[data-theme="dark"] .atm-stat:hover,
        :root[data-theme="dark"] .atm-stat.active {
          background: rgba(12, 20, 36, 0.92);
        }

        :root[data-theme="dark"] .atm-stat.active::after {
          background: #60a5fa;
        }

        :root[data-theme="dark"] .atm-stat-label {
          color: rgba(148, 163, 184, 0.9);
        }

        :root[data-theme="dark"] .atm-stat.active .atm-stat-label {
          color: rgba(226, 232, 240, 0.92);
        }

        :root[data-theme="dark"] .atm-stat-value {
          color: rgba(226, 232, 240, 0.96);
        }

        :root[data-theme="dark"] .atm-stat-sub {
          color: rgba(148, 163, 184, 0.7);
        }

        :root[data-theme="dark"] .atm-toolbar {
          background: rgba(15, 23, 42, 0.86);
          border-color: rgba(148, 163, 184, 0.18);
        }

        :root[data-theme="dark"] .atm-crumb {
          color: rgba(148, 163, 184, 0.9);
        }

        :root[data-theme="dark"] .atm-crumb-sep {
          color: rgba(148, 163, 184, 0.6);
        }

        :root[data-theme="dark"] .atm-crumb-active {
          color: rgba(226, 232, 240, 0.92);
        }

        :root[data-theme="dark"] .atm-table-wrap {
          background: rgba(15, 23, 42, 0.82);
          border-color: rgba(148, 163, 184, 0.18);
        }
      `}</style>

      <div className="atm-wrap">
        <div className="atm-stats">
          {FILTERS.map((entry) => {
            const count = entry.getCount(tickets);
            const isActive = filter === entry.key;
            return (
              <button key={entry.key} type="button" className={`atm-stat${isActive ? " active" : ""}`} onClick={() => setFilter(entry.key)}>
                <span className="atm-stat-label">
                  {entry.dot ? <span className="atm-stat-dot" style={{ background: entry.dot }} /> : null}
                  {entry.label}
                </span>
                <span className="atm-stat-value">{count}</span>
                {entry.key === "URGENT_ATTENTION" ? <span className="atm-stat-sub">priority queue</span> : null}
              </button>
            );
          })}
        </div>

        <div className="atm-toolbar">
          <div className="atm-crumb">
            <span>Tickets</span>
            <span className="atm-crumb-sep">/</span>
            <span className="atm-crumb-active">{activeFilter?.label}</span>
          </div>
          <span style={{ fontSize: 12, color: "var(--muted)" }}>
            {filteredTickets.length} of {tickets.length} shown
          </span>
        </div>

        <TicketFiltersPanel
          filters={filters}
          onChange={updateFilter}
          onReset={resetFilters}
          technicianOptions={users.filter((candidate) => {
            const role = String(candidate?.role || "")
              .trim()
              .toUpperCase()
              .replace(/^ROLE_/, "");
            return (role === "TECHNICIAN" || role === "STAFF") && candidate?.active !== false;
          })}
          showAssignedTechnician
        />

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
              await ticketApi.assign(ticketId, technicianId);
              await load();
            }}
            onReject={async (ticketId, reason) => {
              await ticketApi.updateStatus(ticketId, { status: "REJECTED", rejectionReason: reason });
              await load();
            }}
            onStatus={async (ticketId, payload, action = "status") => {
              if (action === "resolution-notes") {
                await ticketApi.updateResolutionNotes(ticketId, payload.resolutionNotes);
              } else {
                await ticketApi.updateStatus(ticketId, payload);
              }
              await load();
            }}
            onCommentDraft={(ticketId, value) => setCommentDrafts((prev) => ({ ...prev, [ticketId]: value }))}
            onCommentPost={async (ticketId) => {
              await ticketApi.addComment(ticketId, commentDrafts[ticketId] || "");
              setCommentDrafts((prev) => ({ ...prev, [ticketId]: "" }));
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
                await ticketApi.updateComment(comment.id, next);
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
                await ticketApi.deleteComment(commentId);
                await load();
              }
            }}
            onAdminDownloadResolvedPdf={async (ticketId) => {
              try {
                await ticketApi.downloadResolvedTicketPdf(ticketId);
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
                  await ticketApi.deleteResolvedTicket(ticketId);
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

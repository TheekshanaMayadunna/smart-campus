import { useEffect, useState } from "react";
import ResourceLayout from "../components/resource/ResourceLayout";
import { ticketService } from "../services/ticketService";
import { resourceService } from "../services/resourceService";
import TechnicianDashboard from "./TechnicianDashboard";
import AdminTicketManager from "./AdminTicketManager";
import TicketForm from "../components/tickets/TicketForm";
import TicketTable from "../components/tickets/TicketTable";
import { confirmPopup, promptPopup } from "../utils/popup";

export default function TicketsPage({ onLogout, user }) {
  const [tickets, setTickets] = useState([]);
  const [commentsByTicket, setCommentsByTicket] = useState({});
  const [commentDrafts, setCommentDrafts] = useState({});
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const isAdmin = user?.role === "ADMIN";
  const isTechnician = user?.role === "TECHNICIAN";
  if (user?.role === "TECHNICIAN") {
    return (
      <ResourceLayout onLogout={onLogout} user={user}>
        <TechnicianDashboard user={user} />
      </ResourceLayout>
    );
  }
  if (isAdmin) {
    return (
      <ResourceLayout onLogout={onLogout} user={user}>
        <div className="card"><h2 style={{ marginTop: 0 }}>Admin Ticket Manager</h2></div>
        <div className="card" style={{ marginTop: 16 }}><AdminTicketManager user={user} /></div>
      </ResourceLayout>
    );
  }

  const loadTickets = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await ticketService.list();
      const all = Array.isArray(data) ? data : [];
      setTickets(all);
      const allComments = {};
      await Promise.all(
        all.map(async (t) => {
          const comments = await ticketService.listComments(t.id);
          allComments[t.id] = Array.isArray(comments) ? comments : [];
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
    resourceService.list().then((data) => setResources(Array.isArray(data) ? data : [])).catch(() => setResources([]));
  }, []);

  const createTicket = async (form) => {
    setError("");
    try {
      await ticketService.create(form);
      await loadTickets();
    } catch (err) {
      setError(err?.response?.data || "Failed to create ticket.");
    }
  };

  const addComment = async (ticketId) => {
    const content = commentDrafts[ticketId];
    if (!content || !content.trim()) return;
    await ticketService.addComment(ticketId, content.trim());
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
    await ticketService.updateComment(comment.id, next);
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
    await ticketService.deleteComment(commentId);
    await loadTickets();
  };

  return (
    <ResourceLayout onLogout={onLogout} user={user}>
      <div style={{ display: "grid", gap: 16 }}>
        <div className="card">
          <h2 style={{ marginTop: 0 }}>Incident Ticketing</h2>
          {error ? <div style={{ color: "#b71c1c", marginBottom: 8 }}>{String(error)}</div> : null}
          <TicketForm onCreate={createTicket} resources={resources} />
        </div>

        <div className="card">
          <h3 style={{ marginTop: 0 }}>Tickets</h3>
          {loading ? <p>Loading...</p> : null}
          {!loading && tickets.length === 0 ? <p>No tickets found.</p> : null}
          <TicketTable
            tickets={tickets}
            isAdmin={false}
            isTechnician={isTechnician}
            users={[]}
            commentsByTicket={commentsByTicket}
            commentDrafts={commentDrafts}
            user={user}
            onAssign={async () => {}}
            onReject={async () => {}}
            onStatus={async () => {}}
            onCommentDraft={(ticketId, value) => setCommentDrafts((p) => ({ ...p, [ticketId]: value }))}
            onCommentPost={addComment}
            onCommentEdit={updateComment}
            onCommentDelete={deleteComment}
          />
        </div>
      </div>
    </ResourceLayout>
  );
}

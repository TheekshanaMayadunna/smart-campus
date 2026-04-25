import { useState } from "react";

export default function TechnicianActionPanel({ ticket, onStatusChange }) {
  const [notes, setNotes] = useState(ticket.resolutionNotes || "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const markInProgress = async () => {
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      await onStatusChange(ticket.id, { status: "IN_PROGRESS" });
    } catch (err) {
      setError(err?.response?.data || "Failed to update status.");
    } finally {
      setBusy(false);
    }
  };

  const markResolved = async () => {
    if (!notes.trim()) {
      setError("Resolution notes are required.");
      return;
    }
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      await onStatusChange(ticket.id, { status: "RESOLVED", resolutionNotes: notes.trim() });
      setSuccess("Ticket resolved with resolution notes.");
    } catch (err) {
      setError(err?.response?.data || "Failed to resolve ticket.");
    } finally {
      setBusy(false);
    }
  };

  const saveResolutionNotes = async () => {
    if (!notes.trim()) {
      setError("Resolution notes are required.");
      return;
    }
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      await onStatusChange(ticket.id, { resolutionNotes: notes.trim() }, "resolution-notes");
      setSuccess("Resolution notes saved.");
    } catch (err) {
      setError(err?.response?.data || "Failed to save resolution notes.");
    } finally {
      setBusy(false);
    }
  };

  const canEditNotes = ticket.status === "IN_PROGRESS" || ticket.status === "RESOLVED";

  return (
    <div style={{ display: "grid", gap: 8 }}>
      {ticket.status === "OPEN" ? (
        <button className="btnMini" type="button" onClick={markInProgress} disabled={busy}>
          {busy ? "Updating..." : "Start Work (IN_PROGRESS)"}
        </button>
      ) : null}

      {canEditNotes ? (
        <div style={{ display: "grid", gap: 8 }}>
          <textarea
            className="input"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Write resolution notes"
          />
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button className="btnMini" type="button" onClick={saveResolutionNotes} disabled={busy}>
              {busy ? "Updating..." : "Save Resolution Notes"}
            </button>
            {ticket.status === "IN_PROGRESS" ? (
              <button className="btnMini" type="button" onClick={markResolved} disabled={busy}>
                {busy ? "Updating..." : "Mark Resolved"}
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      {error ? <div style={{ color: "#b71c1c" }}>{String(error)}</div> : null}
      {success ? <div style={{ color: "#166534" }}>{success}</div> : null}
    </div>
  );
}

import { useState } from "react";

export default function TechnicianActionPanel({ ticket, onStatusChange }) {
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const markInProgress = async () => {
    setBusy(true);
    setError("");
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
    try {
      await onStatusChange(ticket.id, { status: "RESOLVED", resolutionNotes: notes });
      setNotes("");
    } catch (err) {
      setError(err?.response?.data || "Failed to resolve ticket.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ display: "grid", gap: 8 }}>
      {ticket.status === "OPEN" ? (
        <button className="btnMini" type="button" onClick={markInProgress} disabled={busy}>
          {busy ? "Updating..." : "Start Work (IN_PROGRESS)"}
        </button>
      ) : null}

      {ticket.status === "IN_PROGRESS" ? (
        <div style={{ display: "grid", gap: 8 }}>
          <textarea
            className="input"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Write resolution notes (required)"
          />
          <button className="btnMini" type="button" onClick={markResolved} disabled={busy}>
            {busy ? "Updating..." : "Mark Resolved"}
          </button>
        </div>
      ) : null}

      {error ? <div style={{ color: "#b71c1c" }}>{String(error)}</div> : null}
    </div>
  );
}

import { useEffect, useMemo, useState } from "react";
import { promptPopup } from "../../utils/popup";

function normalizeRole(role) {
  return String(role || "")
    .trim()
    .toUpperCase()
    .replace(/^ROLE_/, "");
}

function getInitials(name) {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);
  if (parts.length === 0) return "NA";
  return parts.map((part) => part[0].toUpperCase()).join("");
}

export default function AdminAssignmentTool({ ticket, users, onAssign, onReject }) {
  const [technicianId, setTechnicianId] = useState(ticket.assignedTechnicianId || "");
  const technicians = useMemo(
    () =>
      Array.isArray(users)
        ? users.filter((u) => {
            const role = normalizeRole(u?.role);
            return (role === "TECHNICIAN" || role === "STAFF") && u?.active !== false;
          })
        : [],
    [users]
  );

  useEffect(() => {
    setTechnicianId(ticket.assignedTechnicianId || "");
  }, [ticket.assignedTechnicianId]);

  const selectedTechnician = technicians.find((candidate) => String(candidate.id) === String(technicianId));
  const currentTechnician = technicians.find((candidate) => String(candidate.id) === String(ticket.assignedTechnicianId));
  const isAssigned = Boolean(ticket.assignedTechnicianId);
  const isSameAssignee = isAssigned && String(ticket.assignedTechnicianId) === String(technicianId);

  const handleAssign = async () => {
    if (!technicianId) return;
    await onAssign(ticket.id, Number(technicianId));
  };

  const handleReject = async () => {
    const reason = await promptPopup({
      title: "Reason for rejection",
      inputPlaceholder: "Enter rejection reason",
      confirmButtonText: "Reject ticket",
      cancelButtonText: "Cancel",
    });
    if (!reason || !reason.trim()) return;
    await onReject(ticket.id, reason.trim());
  };

  if (["RESOLVED", "REJECTED", "CLOSED"].includes(String(ticket.status || "").toUpperCase())) return null;

  return (
    <div
      style={{
        marginTop: 14,
        border: "1px solid rgba(148, 163, 184, 0.18)",
        borderRadius: 18,
        background: "linear-gradient(180deg, rgba(248, 250, 252, 0.96), rgba(255, 255, 255, 0.92))",
        padding: 14,
        display: "grid",
        gap: 12,
      }}
    >
      <style>{`
        .adminAssign-head {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
        }

        .adminAssign-eyebrow {
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #64748b;
          margin-bottom: 4px;
        }

        .adminAssign-title {
          font-size: 15px;
          font-weight: 800;
          color: #0f172a;
          margin: 0;
        }

        .adminAssign-help {
          font-size: 12px;
          color: #64748b;
          line-height: 1.45;
          margin: 4px 0 0;
        }

        .adminAssign-statusPill {
          padding: 7px 11px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          background: rgba(59, 130, 246, 0.12);
          color: #1d4ed8;
          border: 1px solid rgba(59, 130, 246, 0.16);
        }

        .adminAssign-statusPill.unassigned {
          background: rgba(245, 158, 11, 0.14);
          color: #92400e;
          border-color: rgba(245, 158, 11, 0.18);
        }

        .adminAssign-current {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 12px;
          align-items: center;
          padding: 12px;
          border-radius: 16px;
          border: 1px solid rgba(148, 163, 184, 0.16);
          background: rgba(255, 255, 255, 0.84);
        }

        .adminAssign-avatar {
          width: 42px;
          height: 42px;
          border-radius: 14px;
          display: grid;
          place-items: center;
          font-size: 13px;
          font-weight: 800;
          color: #0f766e;
          background: linear-gradient(135deg, rgba(20, 184, 166, 0.16), rgba(14, 165, 233, 0.2));
          border: 1px solid rgba(20, 184, 166, 0.18);
        }

        .adminAssign-name {
          font-size: 14px;
          font-weight: 700;
          color: #0f172a;
        }

        .adminAssign-sub {
          font-size: 12px;
          color: #64748b;
          margin-top: 2px;
          line-height: 1.4;
          word-break: break-word;
        }

        .adminAssign-grid {
          display: grid;
          grid-template-columns: minmax(220px, 1fr) auto;
          gap: 10px;
          align-items: end;
        }

        .adminAssign-label {
          display: block;
          font-size: 12px;
          font-weight: 700;
          color: #334155;
          margin-bottom: 6px;
        }

        .adminAssign-select {
          width: 100%;
          min-height: 42px;
          border-radius: 12px;
        }

        .adminAssign-actions {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          align-items: center;
        }

        .adminAssign-primary {
          min-height: 42px;
          padding: 0 16px;
          border-radius: 12px;
          font-weight: 800;
        }

        .adminAssign-secondary {
          min-height: 42px;
          padding: 0 14px;
          border-radius: 12px;
          font-weight: 700;
        }

        .adminAssign-note {
          font-size: 12px;
          color: #64748b;
          line-height: 1.5;
        }

        .adminAssign-preview {
          padding: 10px 12px;
          border-radius: 14px;
          border: 1px dashed rgba(14, 165, 233, 0.28);
          background: rgba(240, 249, 255, 0.9);
          color: #0f172a;
          font-size: 12px;
          line-height: 1.5;
        }

        @media (max-width: 760px) {
          .adminAssign-grid {
            grid-template-columns: 1fr;
          }
        }

        :root[data-theme="dark"] .adminAssign-title,
        :root[data-theme="dark"] .adminAssign-name,
        :root[data-theme="dark"] .adminAssign-preview {
          color: rgba(226, 232, 240, 0.96);
        }

        :root[data-theme="dark"] .adminAssign-help,
        :root[data-theme="dark"] .adminAssign-sub,
        :root[data-theme="dark"] .adminAssign-note,
        :root[data-theme="dark"] .adminAssign-eyebrow {
          color: rgba(148, 163, 184, 0.9);
        }

        :root[data-theme="dark"] .adminAssign-current {
          background: rgba(15, 23, 42, 0.72);
          border-color: rgba(148, 163, 184, 0.14);
        }

        :root[data-theme="dark"] .adminAssign-preview {
          background: rgba(12, 74, 110, 0.22);
          border-color: rgba(56, 189, 248, 0.24);
        }
      `}</style>

      <div className="adminAssign-head">
        <div>
          <div className="adminAssign-eyebrow">Assignment Control</div>
          <p className="adminAssign-title">{isAssigned ? "Reassign this ticket" : "Assign a technician"}</p>
          <p className="adminAssign-help">
            Choose who should handle this ticket next. Assignment does not change the ticket status automatically.
          </p>
        </div>
        <span className={`adminAssign-statusPill${isAssigned ? "" : " unassigned"}`}>
          {isAssigned ? "Assigned" : "Awaiting assignment"}
        </span>
      </div>

      <div className="adminAssign-current">
        <div className="adminAssign-avatar">{getInitials(currentTechnician?.name || "Unassigned")}</div>
        <div>
          <div className="adminAssign-name">{currentTechnician?.name || "No technician assigned yet"}</div>
          <div className="adminAssign-sub">
            {currentTechnician ? currentTechnician.email : "Pick an active technician from the list below to move this ticket into someone's queue."}
          </div>
        </div>
      </div>

      <div className="adminAssign-grid">
        <div>
          <label className="adminAssign-label" htmlFor={`assign-tech-${ticket.id}`}>
            Technician
          </label>
          <select
            id={`assign-tech-${ticket.id}`}
            className="input adminAssign-select"
            value={technicianId}
            onChange={(e) => setTechnicianId(e.target.value)}
          >
            <option value="">Select active technician</option>
            {technicians.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.email})
              </option>
            ))}
          </select>
        </div>

        <div className="adminAssign-actions">
          <button
            type="button"
            className="btnMini adminAssign-primary"
            onClick={handleAssign}
            disabled={!technicianId || isSameAssignee}
            title={isSameAssignee ? "This technician is already assigned" : ""}
          >
            {isAssigned ? "Save reassignment" : "Assign technician"}
          </button>
          <button type="button" className="btnMini danger adminAssign-secondary" onClick={handleReject}>
            Reject ticket
          </button>
        </div>
      </div>

      {selectedTechnician ? (
        <div className="adminAssign-preview">
          <strong>Selected technician:</strong> {selectedTechnician.name}
          {"  "}
          <span style={{ color: "var(--muted)" }}>({selectedTechnician.email})</span>
          {isSameAssignee ? " is already assigned to this ticket." : " will become the active assignee after you confirm."}
        </div>
      ) : null}

      <div className="adminAssign-note">
        The technician will still move the ticket to <strong>IN_PROGRESS</strong> when work actually begins.
      </div>
    </div>
  );
}

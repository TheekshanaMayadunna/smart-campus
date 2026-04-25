const INPUT_STYLE = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid var(--border)",
  fontSize: 13,
  color: "var(--text)",
  background: "var(--panel)",
};

const LABEL_STYLE = {
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  color: "var(--muted)",
  marginBottom: 6,
  display: "block",
};

export function buildTicketListFilters(filters) {
  const next = {};
  Object.entries(filters || {}).forEach(([key, value]) => {
    if (value === null || value === undefined) return;
    if (typeof value === "string" && !value.trim()) return;
    next[key] = value;
  });
  return next;
}

export default function TicketFiltersPanel({
  filters,
  onChange,
  onReset,
  technicianOptions = [],
  showAssignedTechnician = false,
}) {
  return (
    <div
      style={{
        display: "grid",
        gap: 12,
        padding: 16,
        border: "1px solid var(--border)",
        borderRadius: 14,
        background: "var(--panel-soft)",
        marginBottom: 16,
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 12,
        }}
      >
        <div>
          <label style={LABEL_STYLE}>Status</label>
          <select style={INPUT_STYLE} value={filters.status} onChange={(e) => onChange("status", e.target.value)}>
            <option value="">All statuses</option>
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>

        <div>
          <label style={LABEL_STYLE}>Priority</label>
          <select style={INPUT_STYLE} value={filters.priority} onChange={(e) => onChange("priority", e.target.value)}>
            <option value="">All priorities</option>
            <option value="URGENT">Urgent</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>

        <div>
          <label style={LABEL_STYLE}>Category</label>
          <input
            style={INPUT_STYLE}
            value={filters.category}
            onChange={(e) => onChange("category", e.target.value)}
            placeholder="Filter by category"
          />
        </div>

        {showAssignedTechnician ? (
          <div>
            <label style={LABEL_STYLE}>Assigned Technician</label>
            <select
              style={INPUT_STYLE}
              value={filters.assignedTechnicianId}
              onChange={(e) => onChange("assignedTechnicianId", e.target.value)}
            >
              <option value="">All technicians</option>
              {technicianOptions.map((candidate) => (
                <option key={candidate.id} value={candidate.id}>
                  {candidate.name || candidate.email || `User ${candidate.id}`}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        <div>
          <label style={LABEL_STYLE}>Created From</label>
          <input style={INPUT_STYLE} type="date" value={filters.createdFrom} onChange={(e) => onChange("createdFrom", e.target.value)} />
        </div>

        <div>
          <label style={LABEL_STYLE}>Created To</label>
          <input style={INPUT_STYLE} type="date" value={filters.createdTo} onChange={(e) => onChange("createdTo", e.target.value)} />
        </div>

        <div>
          <label style={LABEL_STYLE}>Resource / Location</label>
          <input
            style={INPUT_STYLE}
            value={filters.resourceOrLocation}
            onChange={(e) => onChange("resourceOrLocation", e.target.value)}
            placeholder="Search resource or location"
          />
        </div>

        <div>
          <label style={LABEL_STYLE}>Keyword</label>
          <input
            style={INPUT_STYLE}
            value={filters.keyword}
            onChange={(e) => onChange("keyword", e.target.value)}
            placeholder="Ticket code, description, contact"
          />
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ fontSize: 12, color: "var(--muted)" }}>
          Queue order: unresolved first, SLA breach first, then priority and oldest unresolved.
        </div>
        <button
          type="button"
          onClick={onReset}
          style={{
            padding: "9px 14px",
            borderRadius: 10,
            border: "1px solid var(--border)",
            background: "var(--panel)",
            color: "var(--text)",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Reset filters
        </button>
      </div>
    </div>
  );
}

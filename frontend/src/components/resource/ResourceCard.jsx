const TYPE_CONFIG = {
  LAB: {
    color: "#16a34a",
    bg: "#f0fdf4",
    icon: "🔬",
    label: "Lab"
  },
  LECTURE_HALL: {
    color: "#2563eb",
    bg: "#eff6ff",
    icon: "🏛️",
    label: "Lecture Hall"
  },
  MEETING_ROOM: {
    color: "#d97706",
    bg: "#fffbeb",
    icon: "🤝",
    label: "Meeting Room"
  },
  EQUIPMENT: {
    color: "#7c3aed",
    bg: "#f5f3ff",
    icon: "📷",
    label: "Equipment"
  }
};

export default function ResourceCard({ resource, onClick }) {
  const config = TYPE_CONFIG[resource.type] || {
    color: "#6b7280",
    bg: "#f9fafb",
    icon: "📦",
    label: resource.type
  };

  const getStatus = (r) => {
    if (r.status === "INACTIVE") return { text: "INACTIVE", class: "bad" };
    if (r.status === "OUT_OF_SERVICE") return { text: "OUT", class: "bad" };
    if (r.availabilityWindows === "MAINTENANCE") return { text: "MAINTENANCE", class: "warn" };
    return { text: "READY", class: "ok" };
  };

  const status = getStatus(resource);

  return (
    <div
      onClick={onClick}
      style={{
        background: config.bg,
        borderLeft: `5px solid ${config.color}`,
        borderRadius: "12px",
        padding: "16px",
        cursor: "pointer",
        boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
        transition: "transform 0.15s, box-shadow 0.15s",
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = "translateY(-3px)";
        e.currentTarget.style.boxShadow = "0 6px 16px rgba(0,0,0,0.12)";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.07)";
      }}
    >
      <div style={{ fontSize: "28px", marginBottom: "8px" }}>{config.icon}</div>

      <h4 style={{ margin: "0 0 4px", color: config.color, fontWeight: "700" }}>
        {resource.name}
      </h4>

      <p style={{ margin: "0 0 8px", fontSize: "13px", color: "#6b7280" }}>
        {config.label}
      </p>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "8px" }}>
        <span style={{ fontSize: "13px", color: "#374151" }}>
          👥 {resource.capacity ?? "—"}
        </span>
        <span className={`pill ${status.class}`}>
          {status.text}
        </span>
      </div>

      {resource.location && (
        <p style={{ margin: "8px 0 0", fontSize: "12px", color: "#9ca3af" }}>
          📍 {resource.location}
        </p>
      )}
    </div>
  );
}
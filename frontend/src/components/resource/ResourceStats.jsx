function formatValue(value) {
  if (typeof value === "number") {
    return value.toLocaleString();
  }
  return value || "0";
}

export default function ResourceStats({ items = [], analytics = {} }) {
  const total = analytics.totalResources ?? items.length;
  const active = analytics.activeResources ?? items.filter((r) => r.status === "ACTIVE").length;
  const outOfService =
    analytics.outOfServiceResources ?? items.filter((r) => r.status === "OUT_OF_SERVICE").length;
  const inactive = items.filter((r) => r.status === "INACTIVE").length;
  const totalCapacity = items.reduce((sum, r) => sum + (Number(r.capacity) || 0), 0);
  const usageByType = Array.isArray(analytics.usageByType) ? analytics.usageByType : [];
  const totalBookings = usageByType.reduce((sum, item) => sum + (Number(item.value) || 0), 0);

  const cards = [
    {
      label: "Total Resources",
      value: total,
      accent: "linear-gradient(135deg, #4f46e5, #7c3aed)",
      note: "All active inventory in the platform",
    },
    {
      label: "Ready To Book",
      value: active,
      accent: "linear-gradient(135deg, #0ea5e9, #06b6d4)",
      note: "Currently available for operational use",
    },
    {
      label: "Out Of Service",
      value: outOfService,
      accent: "linear-gradient(135deg, #ef4444, #f97316)",
      note: "Needs maintenance or immediate follow-up",
    },
    {
      label: "Inactive",
      value: inactive,
      accent: "linear-gradient(135deg, #64748b, #94a3b8)",
      note: "Hidden from current scheduling activity",
    },
    {
      label: "Total Capacity",
      value: totalCapacity,
      accent: "linear-gradient(135deg, #14b8a6, #22c55e)",
      note: "Combined seating and supported occupancy",
    },
    {
      label: "Tracked Bookings",
      value: totalBookings,
      accent: "linear-gradient(135deg, #ec4899, #f59e0b)",
      note: "Historical booking load across resource types",
    },
  ];

  return (
    <div className="statsRow analyticsStatsRow">
      {cards.map((card) => (
        <div key={card.label} className="statCard analyticsStatCard">
          <div className="statGlow" style={{ background: card.accent }} />
          <div className="statLabel">{card.label}</div>
          <div className="statValue">{formatValue(card.value)}</div>
          <div className="statNote">{card.note}</div>
        </div>
      ))}
    </div>
  );
}

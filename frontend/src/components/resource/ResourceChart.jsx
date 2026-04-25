import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const TYPE_LABELS = {
  LAB: "Lab",
  LECTURE_HALL: "Lecture Hall",
  MEETING_ROOM: "Meeting Room",
  PROJECTOR: "Projector",
  CAMERA: "Camera",
  EQUIPMENT: "Equipment",
};

const TYPE_COLORS = ["#7c3aed", "#3b82f6", "#06b6d4", "#22c55e", "#f59e0b", "#ec4899", "#ef4444", "#8b5cf6"];
const STATUS_COLORS = {
  ACTIVE: "#22c55e",
  OUT_OF_SERVICE: "#f97316",
  INACTIVE: "#94a3b8",
};
const LOCATION_COLORS = ["#06b6d4", "#3b82f6", "#6366f1", "#8b5cf6", "#ec4899"];

function buildTypeCount(items) {
  const grouped = items.reduce((acc, item) => {
    const key = item?.type || "UNKNOWN";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(grouped).map(([name, value]) => ({
    name,
    label: TYPE_LABELS[name] || name,
    value,
  }));
}

function buildStatusData(items) {
  return ["ACTIVE", "OUT_OF_SERVICE", "INACTIVE"].map((status) => ({
    name: status.replaceAll("_", " "),
    value: items.filter((item) => item.status === status).length,
    fill: STATUS_COLORS[status],
  }));
}

function buildCapacityByType(items) {
  const grouped = items.reduce((acc, item) => {
    const key = item?.type || "UNKNOWN";
    acc[key] = (acc[key] || 0) + (Number(item.capacity) || 0);
    return acc;
  }, {});

  return Object.entries(grouped).map(([name, value]) => ({
    name: TYPE_LABELS[name] || name,
    value,
  }));
}

function buildTopLocations(items) {
  const grouped = items.reduce((acc, item) => {
    const key = item?.location || "Unassigned";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(grouped)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, value]) => ({ name, value }));
}

function buildUsageData(analytics) {
  const usage = Array.isArray(analytics?.usageByType) ? analytics.usageByType : [];
  return usage.map((entry) => ({
    name: TYPE_LABELS[entry.label] || entry.label,
    value: Number(entry.value) || 0,
  }));
}

function ChartPanel({ title, subtitle, children }) {
  return (
    <div className="analyticsPanel">
      <div className="analyticsPanelHeader">
        <h3>{title}</h3>
        <p>{subtitle}</p>
      </div>
      <div className="analyticsPanelBody">{children}</div>
    </div>
  );
}

export default function ResourceChart({ items = [], analytics = {} }) {
  const typeData = buildTypeCount(items);
  const statusData = buildStatusData(items);
  const capacityByType = buildCapacityByType(items);
  const locationData = buildTopLocations(items);
  const usageData = buildUsageData(analytics);

  const highlightChips = [
    {
      label: "Most booked room",
      value: analytics?.mostBookedRoom || "N/A",
      accent: "#7c3aed",
    },
    {
      label: "Most used equipment",
      value: analytics?.mostUsedEquipment || "N/A",
      accent: "#06b6d4",
    },
    {
      label: "Top location",
      value: analytics?.mostCommonLocation || "N/A",
      accent: "#f59e0b",
    },
  ];

  return (
    <div className="card analyticsBoard">
      <div className="analyticsBoardHeader">
        <div>
          <h3>Resource Analytics</h3>
          <p>Color-rich operational insight across inventory, utilization, and capacity.</p>
        </div>
        <div className="analyticsHighlights">
          {highlightChips.map((chip) => (
            <div key={chip.label} className="analyticsHighlight">
              <span className="analyticsHighlightDot" style={{ background: chip.accent }} />
              <div>
                <strong>{chip.value}</strong>
                <div>{chip.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="analyticsChartGrid">
        <ChartPanel title="Resource Mix" subtitle="Distribution across all available resource types">
          <ResponsiveContainer width="100%" height={245}>
            <PieChart>
              <Pie
                data={typeData}
                dataKey="value"
                nameKey="label"
                cx="50%"
                cy="50%"
                innerRadius={48}
                outerRadius={84}
                paddingAngle={4}
                label={({ label, value }) => `${label}: ${value}`}
              >
                {typeData.map((entry, index) => (
                  <Cell key={entry.name} fill={TYPE_COLORS[index % TYPE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartPanel>

        <ChartPanel title="Resource Status" subtitle="Quick visual balance of active and blocked inventory">
          <ResponsiveContainer width="100%" height={245}>
            <BarChart data={statusData} barCategoryGap={28}>
              <CartesianGrid strokeDasharray="4 4" stroke="rgba(148, 163, 184, 0.25)" />
              <XAxis dataKey="name" tickLine={false} axisLine={false} />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
              <Tooltip />
              <Bar dataKey="value" radius={[12, 12, 0, 0]}>
                {statusData.map((entry) => (
                  <Cell key={entry.name} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartPanel>

        <ChartPanel title="Capacity By Type" subtitle="How much seating and support each category contributes">
          <ResponsiveContainer width="100%" height={245}>
            <BarChart data={capacityByType} layout="vertical" margin={{ left: 18, right: 12 }}>
              <CartesianGrid strokeDasharray="4 4" stroke="rgba(148, 163, 184, 0.2)" />
              <XAxis type="number" tickLine={false} axisLine={false} />
              <YAxis dataKey="name" type="category" width={92} tickLine={false} axisLine={false} />
              <Tooltip />
              <Bar dataKey="value" radius={[0, 12, 12, 0]}>
                {capacityByType.map((entry, index) => (
                  <Cell key={entry.name} fill={TYPE_COLORS[(index + 2) % TYPE_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartPanel>

        <ChartPanel title="Booking Pressure" subtitle="Booking activity by type from tracked analytics">
          <ResponsiveContainer width="100%" height={245}>
            <BarChart data={usageData.length > 0 ? usageData : typeData} barCategoryGap={18}>
              <CartesianGrid strokeDasharray="4 4" stroke="rgba(148, 163, 184, 0.2)" />
              <XAxis dataKey="name" tickLine={false} axisLine={false} interval={0} angle={-12} textAnchor="end" height={58} />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
              <Tooltip />
              <Bar dataKey="value" radius={[12, 12, 0, 0]}>
                {(usageData.length > 0 ? usageData : typeData).map((entry, index) => (
                  <Cell key={entry.name} fill={TYPE_COLORS[(index + 4) % TYPE_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartPanel>

        <ChartPanel title="Top Locations" subtitle="Where the highest concentration of resources sits">
          <ResponsiveContainer width="100%" height={245}>
            <BarChart data={locationData} layout="vertical" margin={{ left: 36, right: 12 }}>
              <CartesianGrid strokeDasharray="4 4" stroke="rgba(148, 163, 184, 0.2)" />
              <XAxis type="number" tickLine={false} axisLine={false} allowDecimals={false} />
              <YAxis dataKey="name" type="category" width={136} tickLine={false} axisLine={false} />
              <Tooltip />
              <Bar dataKey="value" radius={[0, 12, 12, 0]}>
                {locationData.map((entry, index) => (
                  <Cell key={entry.name} fill={LOCATION_COLORS[index % LOCATION_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartPanel>
      </div>
    </div>
  );
}

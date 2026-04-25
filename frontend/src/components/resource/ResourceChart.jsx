import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts";

export default function ResourceChart({ items }) {
  const data = [
    { name: "LAB", value: items.filter((r) => r.type === "LAB").length },
    { name: "LECTURE_HALL", value: items.filter((r) => r.type === "LECTURE_HALL").length },
    { name: "MEETING_ROOM", value: items.filter((r) => r.type === "MEETING_ROOM").length },
    { name: "EQUIPMENT", value: items.filter((r) => r.type === "EQUIPMENT").length },
  ];

  const colors = ["#2e8b57", "#1e88e5", "#f39c12", "#9b59b6"];

  return (
    <div className="card chartCard">
      <h3 style={{ marginBottom: 10 }}>Resource Types</h3>

      <div className="chartWrap">
        <PieChart width={760} height={280}>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx={220}
            cy={135}
            outerRadius={110}
            label
          >
            {data.map((entry, index) => (
              <Cell key={index} fill={colors[index]} />
            ))}
          </Pie>

          <Tooltip
            contentStyle={{
              background: 'var(--panel)',
              borderColor: 'var(--border)',
              borderRadius: '12px',
              color: 'var(--text)'
            }}
            itemStyle={{ color: 'var(--text)' }}
          />

          <Legend
            layout="vertical"
            verticalAlign="middle"
            align="right"
            iconType="circle"
            formatter={(value) => <span style={{ color: 'var(--text)' }}>{value}</span>}
            wrapperStyle={{
              right: 40,
              top: "50%",
              transform: "translateY(-50%)",
              lineHeight: "28px",
              fontSize: "16px",
              fontWeight: 600,
            }}
          />
        </PieChart>
      </div>
    </div>
  );
}
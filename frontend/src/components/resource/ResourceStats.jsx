export default function ResourceStats({ items }) {
  const total = items.length;
  const active = items.filter((r) => r.status === "ACTIVE").length;
  const out = items.filter((r) => r.status === "OUT_OF_SERVICE").length;
  const capacity = items.reduce((sum, r) => sum + (r.capacity || 0), 0);

  return (
    <div className="statsRow">
      <div className="statCard">
        <div className="statLabel">Total Resources</div>
        <div className="statValue">{total}</div>
      </div>

      <div className="statCard">
        <div className="statLabel">Active</div>
        <div className="statValue">{active}</div>
      </div>

      <div className="statCard">
        <div className="statLabel">Out Of Service</div>
        <div className="statValue">{out}</div>
      </div>

      <div className="statCard">
        <div className="statLabel">Total Capacity</div>
        <div className="statValue">{capacity}</div>
      </div>
    </div>
  );
}
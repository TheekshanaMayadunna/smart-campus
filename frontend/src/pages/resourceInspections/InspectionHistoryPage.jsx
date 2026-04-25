import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ResourceLayout from "../../components/resource/ResourceLayout";
import { resourceApi } from "../../api/resources/resourceApi";
import { resourceAssetApi } from "../../api/resourceInspections/resourceAssetApi";
import { resourceInspectionApi } from "../../api/resourceInspections/resourceInspectionApi";
import "./resourceInspections.css";

const CONDITIONS = ["NEW", "GOOD", "FAIR", "DAMAGED", "RETIRED"];
const STATUSES = ["PENDING", "PASSED", "FAILED", "OVERDUE"];

function todayInput() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export default function InspectionHistoryPage({ onLogout, user, theme = "light", onToggleTheme }) {
  const { id } = useParams();
  const resourceId = useMemo(() => Number(id), [id]);
  const navigate = useNavigate();
  const isAdmin = String(user?.role || "").toUpperCase() === "ADMIN";

  const [resource, setResource] = useState(null);
  const [profile, setProfile] = useState(null);
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    inspectionDate: todayInput(),
    inspectorName: user?.name || "",
    conditionAtInspection: "GOOD",
    inspectionStatus: "PASSED",
    nextInspectionDate: "",
    remarks: "",
    actionRequired: "",
  });

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [res, inspections] = await Promise.all([
        resourceApi.getById(resourceId),
        resourceInspectionApi.listByResourceId(resourceId),
      ]);
      setResource(res);
      setRows(Array.isArray(inspections) ? inspections : []);

      try {
        const p = await resourceAssetApi.getByResourceId(resourceId);
        setProfile(p);
      } catch {
        setProfile(null);
      }
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || "Failed to load inspection history");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!Number.isFinite(resourceId)) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resourceId]);

  const handleChange = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const payload = {
        inspectionDate: form.inspectionDate,
        inspectorName: form.inspectorName || null,
        conditionAtInspection: form.conditionAtInspection,
        inspectionStatus: form.inspectionStatus,
        remarks: form.remarks || null,
        actionRequired: form.actionRequired || null,
        nextInspectionDate: form.nextInspectionDate || null,
      };
      await resourceInspectionApi.create(resourceId, payload);
      setForm((prev) => ({ ...prev, remarks: "", actionRequired: "" }));
      await load();
    } catch (e2) {
      setError(e2?.response?.data?.message || e2?.message || "Failed to add inspection");
    }
  };

  const onDelete = async (inspectionId) => {
    if (!isAdmin) return;
    const ok = window.confirm("Delete this inspection record?");
    if (!ok) return;
    setError("");
    try {
      await resourceInspectionApi.deleteById(inspectionId);
      await load();
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || "Delete failed");
    }
  };

  if (loading) {
    return (
      <ResourceLayout onLogout={onLogout} user={user} theme={theme} onToggleTheme={onToggleTheme}>
        <div className="ri-page">
          <div className="ri-card">Loading...</div>
        </div>
      </ResourceLayout>
    );
  }

  return (
    <ResourceLayout onLogout={onLogout} user={user} theme={theme} onToggleTheme={onToggleTheme}>
      <div className="ri-page">
        <div className="ri-card">
          <div className="ri-actions" style={{ marginTop: 0 }}>
            <button className="ri-btn back" type="button" onClick={() => navigate(`/resources/${resourceId}`)}>
              Back
            </button>
            <button className="ri-btn profile" type="button" onClick={() => navigate(`/resources/${resourceId}/asset-profile`)}>
              Asset Profile
            </button>
            {isAdmin ? (
              <button className="ri-btn overdue" type="button" onClick={() => navigate("/resource-inspections/overdue")}>
                Overdue Dashboard
              </button>
            ) : null}
          </div>

          <h2 className="ri-title">
            Inspection History {resource?.name ? `- ${resource.name}` : ""} (Resource #{resourceId})
          </h2>

          {profile ? (
            <div style={{ marginBottom: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
              <span className="ri-badge">Status: {profile.inspectionStatus || "—"}</span>
              <span className="ri-badge">Condition: {profile.currentCondition || "—"}</span>
              <span className="ri-badge">Next: {profile.nextInspectionDate || "—"}</span>
              {profile.qrCodeValue ? <span className="ri-badge">QR: {profile.qrCodeValue}</span> : null}
            </div>
          ) : (
            <div style={{ marginBottom: 12 }}>
              <span className="ri-badge">No asset profile found. Create one first.</span>
            </div>
          )}

          <h3 className="ri-subtitle">Add Inspection</h3>
          {isAdmin ? (
            <form onSubmit={onSubmit}>
              <div className="ri-grid">
                <div className="ri-field">
                  <label>Inspection Date *</label>
                  <input className="ri-input" type="date" value={form.inspectionDate} onChange={handleChange("inspectionDate")} required />
                </div>
                <div className="ri-field">
                  <label>Inspector Name *</label>
                  <input className="ri-input" value={form.inspectorName} onChange={handleChange("inspectorName")} required />
                </div>
                <div className="ri-field">
                  <label>Condition *</label>
                  <select className="ri-select" value={form.conditionAtInspection} onChange={handleChange("conditionAtInspection")} required>
                    {CONDITIONS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="ri-field">
                  <label>Status *</label>
                  <select className="ri-select" value={form.inspectionStatus} onChange={handleChange("inspectionStatus")} required>
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="ri-field">
                  <label>Next Inspection Date</label>
                  <input className="ri-input" type="date" value={form.nextInspectionDate} onChange={handleChange("nextInspectionDate")} />
                </div>
              </div>

              <div className="ri-grid" style={{ marginTop: 12 }}>
                <div className="ri-field">
                  <label>Remarks</label>
                  <textarea className="ri-textarea" value={form.remarks} onChange={handleChange("remarks")} />
                </div>
                <div className="ri-field">
                  <label>Action Required</label>
                  <textarea className="ri-textarea" value={form.actionRequired} onChange={handleChange("actionRequired")} />
                </div>
              </div>

              <div className="ri-actions">
                <button className="ri-btn edit" type="submit" disabled={!profile}>
                  Add Inspection
                </button>
                <button className="ri-btn refresh" type="button" onClick={load}>
                  Refresh
                </button>
              </div>
            </form>
          ) : (
            <div className="ri-badge">View only (Admins can add inspections)</div>
          )}

          <h3 className="ri-subtitle">History</h3>
          <table className="ri-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Inspector</th>
                <th>Status</th>
                <th>Condition</th>
                <th>Remarks</th>
                <th>Action</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ opacity: 0.7 }}>
                    No inspections found.
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.id}>
                    <td>{r.inspectionDate}</td>
                    <td>{r.inspectorName || "—"}</td>
                    <td>{r.inspectionStatus}</td>
                    <td>{r.conditionAtInspection}</td>
                    <td style={{ maxWidth: 280, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {r.remarks || "—"}
                    </td>
                    <td style={{ maxWidth: 240, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {r.actionRequired || "—"}
                    </td>
                    <td>
                      {isAdmin ? (
                        <button className="ri-btn danger" type="button" onClick={() => onDelete(r.id)}>
                          Delete
                        </button>
                      ) : (
                        <span style={{ opacity: 0.6 }}>—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {error ? <div className="ri-error">{error}</div> : null}
        </div>
      </div>
    </ResourceLayout>
  );
}

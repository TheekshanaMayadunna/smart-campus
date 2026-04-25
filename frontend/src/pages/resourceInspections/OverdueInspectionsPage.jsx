import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ResourceLayout from "../../components/resource/ResourceLayout";
import { resourceInspectionApi } from "../../api/resourceInspections/resourceInspectionApi";
import "./resourceInspections.css";

export default function OverdueInspectionsPage({ onLogout, user, theme = "light", onToggleTheme }) {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await resourceInspectionApi.listOverdue();
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || "Failed to load overdue list");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <ResourceLayout onLogout={onLogout} user={user} theme={theme} onToggleTheme={onToggleTheme}>
      <div className="ri-page">
        <div className="ri-card">
          <div className="ri-actions" style={{ marginTop: 0 }}>
            <button className="ri-btn resources" type="button" onClick={() => navigate("/resources")}>
              Resources
            </button>
            <button className="ri-btn qr" type="button" onClick={() => navigate("/resource-assets/qr")}>
              QR Lookup
            </button>
            <button className="ri-btn refresh" type="button" onClick={load}>
              Refresh
            </button>
          </div>

          <h2 className="ri-title">Overdue Inspections</h2>

          {loading ? (
            <div>Loading...</div>
          ) : (
            <table className="ri-table">
              <thead>
                <tr>
                  <th>Resource</th>
                  <th>Next Inspection</th>
                  <th>Status</th>
                  <th>Condition</th>
                  <th>QR</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ opacity: 0.7 }}>
                      No overdue inspections found.
                    </td>
                  </tr>
                ) : (
                  rows.map((r) => (
                    <tr key={`${r.resourceId}-${r.qrCodeValue}`}>
                      <td>
                        {r.resourceName} <span style={{ opacity: 0.6 }}>(#{r.resourceId})</span>
                      </td>
                      <td>{r.nextInspectionDate}</td>
                      <td>{r.inspectionStatus}</td>
                      <td>{r.currentCondition || "—"}</td>
                      <td style={{ fontFamily: "monospace" }}>{r.qrCodeValue}</td>
                      <td>
                        <button className="ri-btn view" type="button" onClick={() => navigate(`/resources/${r.resourceId}`)}>
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {error ? <div className="ri-error">{error}</div> : null}
        </div>
      </div>
    </ResourceLayout>
  );
}

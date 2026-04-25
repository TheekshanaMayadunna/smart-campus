import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ResourceLayout from "../../components/resource/ResourceLayout";
import { resourceAssetApi } from "../../api/resourceInspections/resourceAssetApi";
import "./resourceInspections.css";

export default function QrLookupPage({ onLogout, user, theme = "light", onToggleTheme }) {
  const navigate = useNavigate();
  const [qr, setQr] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onSearch = async (e) => {
    e.preventDefault();
    setError("");
    setResult(null);
    setLoading(true);
    try {
      const data = await resourceAssetApi.getByQr(qr.trim());
      setResult(data);
    } catch (e2) {
      setError(e2?.response?.data?.message || e2?.message || "No asset found for that QR");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ResourceLayout onLogout={onLogout} user={user} theme={theme} onToggleTheme={onToggleTheme}>
      <div className="ri-page">
        <div className="ri-card">
          <div className="ri-actions" style={{ marginTop: 0 }}>
            <button className="ri-btn resources" type="button" onClick={() => navigate("/resources")}>
              Resources
            </button>
            <button className="ri-btn overdue" type="button" onClick={() => navigate("/resource-inspections/overdue")}>
              Overdue Dashboard
            </button>
          </div>

          <h2 className="ri-title">QR Lookup</h2>

          <form onSubmit={onSearch}>
            <div className="ri-grid">
              <div className="ri-field" style={{ gridColumn: "1 / -1" }}>
                <label>QR Code Value</label>
                <input className="ri-input" value={qr} onChange={(e) => setQr(e.target.value)} placeholder="RA-12-ABCDEF..." />
              </div>
            </div>
            <div className="ri-actions">
              <button className="ri-btn search" type="submit" disabled={!qr.trim() || loading}>
                {loading ? "Searching..." : "Search"}
              </button>
              <button className="ri-btn clear" type="button" onClick={() => { setQr(""); setResult(null); setError(""); }}>
                Clear
              </button>
            </div>
          </form>

          {result ? (
            <div style={{ marginTop: 16 }}>
              <h3 className="ri-subtitle">Asset</h3>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <span className="ri-badge">Resource #{result.resourceId}</span>
                <span className="ri-badge">Asset: {result.assetCode}</span>
                <span className="ri-badge">Status: {result.inspectionStatus || "—"}</span>
                <span className="ri-badge">Condition: {result.currentCondition || "—"}</span>
                <span className="ri-badge">Next: {result.nextInspectionDate || "—"}</span>
                <span className="ri-badge">QR: {result.qrCodeValue}</span>
              </div>

              <div className="ri-actions">
                <button className="ri-btn view" type="button" onClick={() => navigate(`/resources/${result.resourceId}`)}>
                  View Resource
                </button>
                <button className="ri-btn profile" type="button" onClick={() => navigate(`/resources/${result.resourceId}/asset-profile`)}>
                  Asset Profile
                </button>
                <button className="ri-btn history" type="button" onClick={() => navigate(`/resources/${result.resourceId}/inspection-history`)}>
                  Inspection History
                </button>
              </div>
            </div>
          ) : null}

          {error ? <div className="ri-error">{error}</div> : null}
        </div>
      </div>
    </ResourceLayout>
  );
}

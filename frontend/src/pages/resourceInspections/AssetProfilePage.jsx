import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ResourceLayout from "../../components/resource/ResourceLayout";
import { resourceApi } from "../../api/resources/resourceApi";
import { resourceAssetApi } from "../../api/resourceInspections/resourceAssetApi";
import "./resourceInspections.css";

const CONDITIONS = ["NEW", "GOOD", "FAIR", "DAMAGED", "RETIRED"];
const STATUSES = ["PENDING", "PASSED", "FAILED", "OVERDUE"];

function toInputDate(value) {
  return value ? String(value).slice(0, 10) : "";
}

export default function AssetProfilePage({ onLogout, user, theme = "light", onToggleTheme }) {
  const { id } = useParams();
  const resourceId = useMemo(() => Number(id), [id]);
  const navigate = useNavigate();
  const isAdmin = String(user?.role || "").toUpperCase() === "ADMIN";

  const [resource, setResource] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    assetCode: "",
    serialNumber: "",
    manufacturer: "",
    modelNumber: "",
    purchaseDate: "",
    warrantyExpiryDate: "",
    currentCondition: "",
    inspectionStatus: "",
    lastInspectionDate: "",
    nextInspectionDate: "",
    notes: "",
  });

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [res] = await Promise.all([resourceApi.getById(resourceId)]);
      setResource(res);

      try {
        const p = await resourceAssetApi.getByResourceId(resourceId);
        setProfile(p);
        setForm({
          assetCode: p.assetCode || "",
          serialNumber: p.serialNumber || "",
          manufacturer: p.manufacturer || "",
          modelNumber: p.modelNumber || "",
          purchaseDate: toInputDate(p.purchaseDate),
          warrantyExpiryDate: toInputDate(p.warrantyExpiryDate),
          currentCondition: p.currentCondition || "",
          inspectionStatus: p.inspectionStatus || "",
          lastInspectionDate: toInputDate(p.lastInspectionDate),
          nextInspectionDate: toInputDate(p.nextInspectionDate),
          notes: p.notes || "",
        });
      } catch (e) {
        setProfile(null);
      }
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || "Failed to load resource");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!Number.isFinite(resourceId)) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resourceId]);

  const handleChange = (key) => (e) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
  };

  const payload = () => ({
    assetCode: form.assetCode,
    serialNumber: form.serialNumber || null,
    manufacturer: form.manufacturer || null,
    modelNumber: form.modelNumber || null,
    purchaseDate: form.purchaseDate || null,
    warrantyExpiryDate: form.warrantyExpiryDate || null,
    currentCondition: form.currentCondition || null,
    inspectionStatus: form.inspectionStatus || null,
    lastInspectionDate: form.lastInspectionDate || null,
    nextInspectionDate: form.nextInspectionDate || null,
    notes: form.notes || null,
  });

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!isAdmin) {
      setError("Forbidden: Admins only");
      return;
    }
    try {
      if (profile) {
        const updated = await resourceAssetApi.update(resourceId, payload());
        setProfile(updated);
      } else {
        const created = await resourceAssetApi.create(resourceId, payload());
        setProfile(created);
      }
      await load();
    } catch (e2) {
      setError(e2?.response?.data?.message || e2?.message || "Save failed");
    }
  };

  const onDelete = async () => {
    if (!isAdmin || !profile) return;
    const ok = window.confirm("Delete this asset profile?");
    if (!ok) return;
    setError("");
    try {
      await resourceAssetApi.deleteByResourceId(resourceId);
      await load();
    } catch (e2) {
      setError(e2?.response?.data?.message || e2?.message || "Delete failed");
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
            <button
              className="ri-btn history"
              type="button"
              onClick={() => navigate(`/resources/${resourceId}/inspection-history`)}
            >
              Inspection History
            </button>
            {isAdmin ? (
              <button className="ri-btn overdue" type="button" onClick={() => navigate("/resource-inspections/overdue")}>
                Overdue Dashboard
              </button>
            ) : null}
            <button className="ri-btn qr" type="button" onClick={() => navigate("/resource-assets/qr")}>
              QR Lookup
            </button>
          </div>

          <h2 className="ri-title">
            Asset Profile {resource?.name ? `- ${resource.name}` : ""} (Resource #{resourceId})
          </h2>

          {profile?.qrCodeValue ? (
            <div style={{ marginBottom: 10 }}>
              <span className="ri-badge">QR: {profile.qrCodeValue}</span>
            </div>
          ) : null}

          <form onSubmit={onSubmit}>
            <div className="ri-grid">
              <div className="ri-field">
                <label>Asset Code *</label>
                <input className="ri-input" value={form.assetCode} onChange={handleChange("assetCode")} required disabled={!isAdmin} />
              </div>
              <div className="ri-field">
                <label>Serial Number</label>
                <input className="ri-input" value={form.serialNumber} onChange={handleChange("serialNumber")} disabled={!isAdmin} />
              </div>
              <div className="ri-field">
                <label>Manufacturer</label>
                <input className="ri-input" value={form.manufacturer} onChange={handleChange("manufacturer")} disabled={!isAdmin} />
              </div>
              <div className="ri-field">
                <label>Model Number</label>
                <input className="ri-input" value={form.modelNumber} onChange={handleChange("modelNumber")} disabled={!isAdmin} />
              </div>
              <div className="ri-field">
                <label>Purchase Date</label>
                <input className="ri-input" type="date" value={form.purchaseDate} onChange={handleChange("purchaseDate")} disabled={!isAdmin} />
              </div>
              <div className="ri-field">
                <label>Warranty Expiry Date</label>
                <input
                  className="ri-input"
                  type="date"
                  value={form.warrantyExpiryDate}
                  onChange={handleChange("warrantyExpiryDate")}
                  disabled={!isAdmin}
                />
              </div>
              <div className="ri-field">
                <label>Current Condition</label>
                <select className="ri-select" value={form.currentCondition} onChange={handleChange("currentCondition")} disabled={!isAdmin}>
                  <option value="">--</option>
                  {CONDITIONS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div className="ri-field">
                <label>Inspection Status</label>
                <select className="ri-select" value={form.inspectionStatus} onChange={handleChange("inspectionStatus")} disabled={!isAdmin}>
                  <option value="">--</option>
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div className="ri-field">
                <label>Last Inspection Date</label>
                <input
                  className="ri-input"
                  type="date"
                  value={form.lastInspectionDate}
                  onChange={handleChange("lastInspectionDate")}
                  disabled={!isAdmin}
                />
              </div>
              <div className="ri-field">
                <label>Next Inspection Date</label>
                <input
                  className="ri-input"
                  type="date"
                  value={form.nextInspectionDate}
                  onChange={handleChange("nextInspectionDate")}
                  disabled={!isAdmin}
                />
              </div>
            </div>

            <div className="ri-field" style={{ marginTop: 12 }}>
              <label>Notes</label>
              <textarea className="ri-textarea" value={form.notes} onChange={handleChange("notes")} disabled={!isAdmin} />
            </div>

            <div className="ri-actions">
              {isAdmin ? (
                <button className="ri-btn edit" type="submit">
                  {profile ? "Update Profile" : "Create Profile"}
                </button>
              ) : (
                <span className="ri-badge">View only (Admins can edit)</span>
              )}
              <button className="ri-btn refresh" type="button" onClick={load}>
                Refresh
              </button>
              {isAdmin && profile ? (
                <button className="ri-btn danger" type="button" onClick={onDelete}>
                  Delete Profile
                </button>
              ) : null}
            </div>
          </form>

          {error ? <div className="ri-error">{error}</div> : null}
        </div>
      </div>
    </ResourceLayout>
  );
}

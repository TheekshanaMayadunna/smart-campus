import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import ResourceLayout from "../../components/resource/ResourceLayout";
import { resourceApi } from "../../api/resources/resourceApi";
import { resourceAssetApi } from "../../api/resourceInspections/resourceAssetApi";
import { resourceInspectionApi } from "../../api/resourceInspections/resourceInspectionApi";
import { showErrorPopup, showSuccessPopup } from "../../utils/popup";
import { downloadAssetReportPdf } from "../../utils/assetReportPdf";
import "./resources.css";

const initialForm = {
  name: "",
  type: "LAB",
  capacity: 0,
  location: "",
  availabilityStart: "08:00:00",
  availabilityEnd: "17:00:00",
  status: "ACTIVE",
  description: "",
  imageUrl: "",
};

const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const badgeClass = (status) => `status-badge ${String(status || "").toLowerCase()}`;
const typeLabels = {
  LAB: "Lab",
  LECTURE_HALL: "Lecture Hall",
  MEETING_ROOM: "Meeting Room",
  PROJECTOR: "Projector",
  CAMERA: "Camera",
  EQUIPMENT: "Equipment",
};
const statusHints = {
  ACTIVE: "Ready for booking",
  OUT_OF_SERVICE: "Temporarily unavailable",
  INACTIVE: "Hidden from active use",
};

const equipmentTypes = new Set(["PROJECTOR", "CAMERA", "EQUIPMENT"]);

function buildImageUrl(path) {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  return `http://localhost:8085/${String(path).replace(/^\/+/, "")}`;
}

export default function ResourcesPage({ onLogout, user, theme = "light", onToggleTheme }) {
  const navigate = useNavigate();
  const isAdmin = String(user?.role || "").toUpperCase() === "ADMIN";
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [analytics, setAnalytics] = useState(null);
  const [reportingId, setReportingId] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [filters, setFilters] = useState({
    q: "",
    type: "",
    status: "",
    minCapacity: "",
    location: "",
    sortBy: "createdAt",
    sortDir: "desc",
    page: 0,
    size: 10,
  });
  const [pageInfo, setPageInfo] = useState({ totalPages: 0, totalElements: 0 });
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [nonEquipmentDefaults, setNonEquipmentDefaults] = useState({
    capacity: initialForm.capacity,
    location: initialForm.location,
  });
  const previewUrl = useMemo(() => {
    if (!imageFile) return "";
    return URL.createObjectURL(imageFile);
  }, [imageFile]);

  const params = useMemo(() => {
    const p = { ...filters };
    if (!p.type) delete p.type;
    if (!p.status) delete p.status;
    if (!p.q) delete p.q;
    if (!p.location) delete p.location;
    if (!p.minCapacity) delete p.minCapacity;
    return p;
  }, [filters]);

  const load = async () => {
    setLoading(true);
    try {
      const page = await resourceApi.list(params);
      setItems(page.content || []);
      setPageInfo({
        totalPages: page.totalPages || 0,
        totalElements: page.totalElements || 0,
      });
      if (isAdmin) {
        setAnalytics(await resourceApi.analytics());
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [params, isAdmin]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const openCreate = () => {
    setEditingId(null);
    setForm(initialForm);
    setNonEquipmentDefaults({ capacity: initialForm.capacity, location: initialForm.location });
    setImageFile(null);
    setShowForm(true);
  };

  const openEdit = (item) => {
    setEditingId(item.id);
    setForm({
      name: item.name,
      type: item.type,
      capacity: item.capacity,
      location: item.location,
      availabilityStart: item.availabilityStart,
      availabilityEnd: item.availabilityEnd,
      status: item.status,
      description: item.description || "",
      imageUrl: item.imageUrl || "",
    });
    if (!equipmentTypes.has(item.type)) {
      setNonEquipmentDefaults({ capacity: item.capacity, location: item.location });
    } else {
      setNonEquipmentDefaults({ capacity: initialForm.capacity, location: initialForm.location });
    }
    setImageFile(null);
    setShowForm(true);
  };

  const downloadReport = async (resourceId) => {
    if (!isAdmin) return;
    setReportingId(resourceId);
    try {
      const [resource, inspections] = await Promise.all([
        resourceApi.getById(resourceId),
        resourceInspectionApi.listByResourceId(resourceId),
      ]);

      let assetProfile = null;
      try {
        assetProfile = await resourceAssetApi.getByResourceId(resourceId);
      } catch {
        assetProfile = null;
      }

      await downloadAssetReportPdf({
        resource,
        assetProfile,
        inspections: Array.isArray(inspections) ? inspections : [],
      });
    } catch (error) {
      await showErrorPopup(
        "Report failed",
        error?.response?.data?.message || error?.message || "Could not generate the PDF report."
      );
    } finally {
      setReportingId(null);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        capacity: equipmentTypes.has(form.type) ? 1 : Number(form.capacity),
        location: equipmentTypes.has(form.type) ? "N/A" : form.location,
      };
      const saved = editingId
        ? await resourceApi.update(editingId, payload)
        : await resourceApi.create(payload);

      let finalResource = saved;
      if (imageFile) {
        finalResource = await resourceApi.uploadImage(saved.id, imageFile);
      }

      setForm({
        ...initialForm,
        imageUrl: finalResource?.imageUrl || "",
      });
      setImageFile(null);
      setShowForm(false);
      await load();
      await showSuccessPopup(
        editingId ? "Resource updated" : "Resource created",
        imageFile
          ? "The resource details and image were saved successfully."
          : "The resource details were saved successfully."
      );
    } catch (err) {
      const message =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        "Could not save the resource.";
      await showErrorPopup("Save failed", String(message));
    } finally {
      setSubmitting(false);
    }
  };

  const remove = async (id) => {
    await resourceApi.softDelete(id);
    await load();
  };

  return (
    <ResourceLayout onLogout={onLogout} user={user} theme={theme} onToggleTheme={onToggleTheme}>
      <div className={`resources-page ${theme}`}>
        <div className="resources-wrap">
          <header className="resources-pageHeader">
            <div>
              <h1 className="resources-pageTitle">Resources</h1>
              <p className="resources-pageSubtitle">Browse, manage, and inspect campus facilities and assets.</p>
            </div>
          </header>

          <div className="resources-actions">
            {isAdmin ? (
              <button className="resources-btn overdue" onClick={() => navigate("/resource-inspections/overdue")}>
                Overdue Inspections
              </button>
            ) : null}
            <button className="resources-btn qr" onClick={() => navigate("/resource-assets/qr")}>
              QR Lookup
            </button>
            {isAdmin ? <button className="resources-btn primary" onClick={openCreate}>Add Resource</button> : null}
          </div>

          <div className="resources-toolbar">
            <input className="resources-input" placeholder="Search name or description" value={filters.q} onChange={(e) => setFilters((p) => ({ ...p, q: e.target.value, page: 0 }))} />
            <select className="resources-select" value={filters.type} onChange={(e) => setFilters((p) => ({ ...p, type: e.target.value, page: 0 }))}>
              <option value="">All Types</option>
              <option value="LAB">LAB</option>
              <option value="LECTURE_HALL">LECTURE_HALL</option>
              <option value="MEETING_ROOM">MEETING_ROOM</option>
              <option value="PROJECTOR">PROJECTOR</option>
              <option value="CAMERA">CAMERA</option>
              <option value="EQUIPMENT">EQUIPMENT</option>
            </select>
            <input className="resources-input" placeholder="Min Capacity" type="number" min="0" value={filters.minCapacity} onChange={(e) => setFilters((p) => ({ ...p, minCapacity: e.target.value, page: 0 }))} />
            <input className="resources-input" placeholder="Location" value={filters.location} onChange={(e) => setFilters((p) => ({ ...p, location: e.target.value, page: 0 }))} />
            <select className="resources-select" value={filters.status} onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value, page: 0 }))}>
              <option value="">All Status</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="OUT_OF_SERVICE">OUT_OF_SERVICE</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>
          </div>

          {isAdmin && analytics ? (
            <div className="resources-analytics">
              <strong>Usage Analytics</strong>
              <div>Most booked room: {analytics.mostBookedRoom}</div>
              <div>Most used equipment: {analytics.mostUsedEquipment}</div>
              <div>Most common location: {analytics.mostCommonLocation}</div>
            </div>
          ) : null}

          <div className="resources-grid">
            {items.map((r) => (
              <div
                key={r.id}
                className={`resource-card ${r.status !== "ACTIVE" ? "resource-unavailable" : ""}`}
                onClick={() => navigate(`/resources/${r.id}`)}
              >
                <div className="resource-card-media">
                  {r.imageUrl ? (
                    <img className="resource-card-image" src={buildImageUrl(r.imageUrl)} alt={r.name} />
                  ) : (
                    <div className="resource-card-fallback">{typeLabels[r.type] || r.type}</div>
                  )}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                  <strong>{r.name}</strong>
                  <span className={badgeClass(r.status)}>{r.status}</span>
                </div>
                <div>{typeLabels[r.type] || r.type}</div>
                {!equipmentTypes.has(r.type) ? <div>Capacity: {r.capacity}</div> : null}
                {!equipmentTypes.has(r.type) ? <div>Location: {r.location}</div> : null}
                {isAdmin ? (
                  <div className="resources-actions" style={{ marginTop: 8 }}>
                    <button className="resources-btn edit" onClick={(e) => { e.stopPropagation(); openEdit(r); }}>Edit</button>
                    <button className="resources-btn danger" onClick={(e) => { e.stopPropagation(); remove(r.id); }}>Delete</button>
                  </div>
                ) : null}
                <div className="resources-actions" style={{ marginTop: 8 }} onClick={(e) => e.stopPropagation()}>
                  <button className="resources-btn asset" onClick={() => navigate(`/resources/${r.id}/asset-profile`)}>
                    Asset Profile
                  </button>
                  <button className="resources-btn history" onClick={() => navigate(`/resources/${r.id}/inspection-history`)}>
                    Inspection History
                  </button>
                  {isAdmin ? (
                    <button
                      className="resources-btn download"
                      onClick={() => downloadReport(r.id)}
                      disabled={reportingId === r.id}
                      title="Generate a complete asset and inspection report (PDF)"
                    >
                      {reportingId === r.id ? "Preparing..." : "Download Asset Report"}
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>

          <div className="resources-table-wrap">
            <table className="resources-table">
              <thead>
                <tr>
                  <th>Name</th><th>Type</th><th>Capacity</th><th>Location</th><th>Availability</th><th>Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? <tr><td colSpan={6}>Loading...</td></tr> : null}
                {!loading && items.length === 0 ? <tr><td colSpan={6}>No resources found.</td></tr> : null}
                {items.map((r) => (
                  <tr
                    key={`row-${r.id}`}
                    className={r.status !== "ACTIVE" ? "resource-unavailable" : ""}
                    style={{ cursor: "pointer" }}
                    onClick={() => navigate(`/resources/${r.id}`)}
                  >
                    <td>{r.name}</td>
                    <td>{r.type}</td>
                    <td>{equipmentTypes.has(r.type) ? "—" : r.capacity}</td>
                    <td>{equipmentTypes.has(r.type) ? "—" : r.location}</td>
                    <td>{r.availabilityStart} - {r.availabilityEnd}</td>
                    <td><span className={badgeClass(r.status)}>{r.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="resources-pagination">
            <button className="resources-btn" disabled={filters.page <= 0} onClick={() => setFilters((p) => ({ ...p, page: p.page - 1 }))}>Prev</button>
            <div>Page {filters.page + 1} / {Math.max(pageInfo.totalPages, 1)} ({pageInfo.totalElements})</div>
            <button className="resources-btn" disabled={filters.page + 1 >= pageInfo.totalPages} onClick={() => setFilters((p) => ({ ...p, page: p.page + 1 }))}>Next</button>
          </div>
        </div>

        {showForm ? (
          <div className="resources-modal" onClick={(e) => e.target === e.currentTarget && setShowForm(false)}>
            <div className="resources-modal-card">
              <div className="resources-form-header">
                <div>
                  <h3>{editingId ? "Edit Resource" : "Add Resource"}</h3>
                  <p className="resources-form-subtitle">
                    Enter the operational details clearly so bookings, availability, and inventory stay accurate.
                  </p>
                </div>
                <button className="resources-btn" type="button" onClick={() => setShowForm(false)}>Close</button>
              </div>
              <form onSubmit={submit} className="resources-form-grid">
                <label className="resources-field">
                  <span className="resources-field-label">Resource Name</span>
                  <input className="resources-input" required placeholder="Example: Innovation Lab 02" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
                </label>

                <label className="resources-field">
                  <span className="resources-field-label">Resource Type</span>
                  <select
                    className="resources-select"
                    value={form.type}
                    onChange={(e) => {
                      const nextType = e.target.value;
                      setForm((prev) => {
                        const wasEquipment = equipmentTypes.has(prev.type);
                        const isEquipment = equipmentTypes.has(nextType);

                        if (!wasEquipment) {
                          setNonEquipmentDefaults({ capacity: prev.capacity, location: prev.location });
                        }

                        if (isEquipment) {
                          return { ...prev, type: nextType, capacity: 1, location: "N/A" };
                        }

                        if (wasEquipment) {
                          return {
                            ...prev,
                            type: nextType,
                            capacity: nonEquipmentDefaults.capacity,
                            location: nonEquipmentDefaults.location,
                          };
                        }

                        return { ...prev, type: nextType };
                      });
                    }}
                  >
                    <option value="LAB">Lab</option>
                    <option value="LECTURE_HALL">Lecture Hall</option>
                    <option value="MEETING_ROOM">Meeting Room</option>
                    <option value="PROJECTOR">Projector</option>
                    <option value="CAMERA">Camera</option>
                    <option value="EQUIPMENT">Equipment</option>
                  </select>
                </label>

                {!equipmentTypes.has(form.type) ? (
                  <label className="resources-field">
                    <span className="resources-field-label">Capacity</span>
                    <input className="resources-input" type="number" min="0" required placeholder="Example: 40" value={form.capacity} onChange={(e) => setForm((p) => ({ ...p, capacity: e.target.value }))} />
                  </label>
                ) : null}

                {!equipmentTypes.has(form.type) ? (
                  <label className="resources-field">
                    <span className="resources-field-label">Location</span>
                    <input className="resources-input" required placeholder="Example: Engineering Block, Floor 2" value={form.location} onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))} />
                  </label>
                ) : null}

                <label className="resources-field">
                  <span className="resources-field-label">Available From</span>
                  <input className="resources-input" type="time" required value={String(form.availabilityStart).slice(0, 5)} onChange={(e) => setForm((p) => ({ ...p, availabilityStart: `${e.target.value}:00` }))} />
                </label>

                <label className="resources-field">
                  <span className="resources-field-label">Available Until</span>
                  <input className="resources-input" type="time" required value={String(form.availabilityEnd).slice(0, 5)} onChange={(e) => setForm((p) => ({ ...p, availabilityEnd: `${e.target.value}:00` }))} />
                </label>

                <label className="resources-field">
                  <span className="resources-field-label">Status</span>
                  <span className="resources-field-help">{statusHints[form.status]}</span>
                  <select className="resources-select" value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}>
                    <option value="ACTIVE">Active</option>
                    <option value="OUT_OF_SERVICE">Out of Service</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </label>

                <label className="resources-field">
                  <span className="resources-field-label">Resource Image</span>
                  <input className="resources-input" type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} />
                </label>

                <label className="resources-field resources-field-full">
                  <span className="resources-field-label">Description</span>
                  <textarea className="resources-input resources-textarea" placeholder="Example: Includes 30 desktop workstations, ceiling projector, and whiteboard wall." value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
                </label>

                {(imageFile || form.imageUrl) ? (
                  <div className="resources-image-preview resources-field-full">
                    <div className="resources-field-label">Image Preview</div>
                    <img
                      src={imageFile ? previewUrl : buildImageUrl(form.imageUrl)}
                      alt="Resource preview"
                      className="resources-preview-image"
                    />
                    <div className="resources-field-help">
                      {imageFile ? `Selected file: ${imageFile.name}` : "Current saved image"}
                    </div>
                  </div>
                ) : null}

                <div className="resources-actions resources-field-full resources-form-actions">
                  <button className="resources-btn primary" type="submit" disabled={submitting}>
                    {submitting ? "Saving..." : editingId ? "Update Resource" : "Create Resource"}
                  </button>
                  <button className="resources-btn" type="button" onClick={() => setShowForm(false)} disabled={submitting}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        ) : null}
      </div>
    </ResourceLayout>
  );
}

import "./table.css";
import { useState } from "react";
import { resourceService } from "../../services/resourceService";
import AppLoader from "../common/AppLoader.jsx";
import ResourceForm from "./ResourceForm.jsx";
import { confirmPopup, showErrorPopup, showSuccessPopup } from "../../utils/popup";

const TYPE_CONFIG = {
  LAB: { icon: "🔬", label: "Lab", cls: "lab" },
  LECTURE_HALL: { icon: "🎓", label: "Lecture Hall", cls: "hall" },
  MEETING_ROOM: { icon: "🤝", label: "Meeting Room", cls: "meeting" },
  EQUIPMENT: { icon: "🔧", label: "Equipment", cls: "equipment" },
};

const DEFAULT_FORM = {
  name: "",
  type: "LAB",
  capacity: 0,
  location: "",
  status: "ACTIVE",
  availabilityWindows: "AVAILABLE",
};

const getAvailabilityPillClass = (availabilityWindows) => {
  const v = String(availabilityWindows || "").toUpperCase();
  if (v === "AVAILABLE") return "pill ok";
  if (v === "MAINTENANCE") return "pill warn";
  if (v === "UNAVAILABLE") return "pill bad";
  return "pill";
};

function ResourceCard({ resource, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        border: "1px solid var(--border, #ddd)",
        borderRadius: 8,
        padding: 16,
        cursor: "pointer",
        background: "var(--card-bg, #fff)",
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: 4 }}>{resource.name}</div>
      <div style={{ fontSize: 12, color: "#888" }}>{resource.type}</div>
      <div style={{ fontSize: 12 }}>📍 {resource.location}</div>
      <div style={{ fontSize: 12 }}>👥 {resource.capacity}</div>
      <span className={resource.status === "ACTIVE" ? "pill ok" : "pill bad"}>
        {resource.status}
      </span>
    </div>
  );
}

export default function ResourceList({
  items,
  filters,
  setFilters,
  onEdit,
  onDelete,
  onSubmit,
  loading = false,
  canManageResources = false,
}) {
  const colCount = canManageResources ? 8 : 6;

  const [selected, setSelected] = useState([]);
  const [view, setView] = useState("table");
  const [selectedResource, setSelectedResource] = useState(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [editingId, setEditingId] = useState(null);

  const toggleSelect = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const bulkDelete = async () => {
    if (!canManageResources) return;
    const confirmed = await confirmPopup({
      title: "Delete selected resources?",
      text: "This action cannot be undone.",
      confirmButtonText: "Yes, delete",
      cancelButtonText: "Cancel",
      icon: "warning",
    });
    if (!confirmed) return;

    for (let id of selected) {
      await resourceService.remove(id);
    }
    setSelected([]);
    await showSuccessPopup("Resources deleted", "Selected resources were removed successfully.");
    window.location.reload();
  };

  const downloadReport = async () => {
    try {
      const params = {};
      if (filters.q) params.q = filters.q;
      if (filters.type) params.type = filters.type;
      if (filters.status) params.status = filters.status;
      if (filters.minCap) params.minCap = Number(filters.minCap);
      if (filters.location) params.location = filters.location;

      const blob = await resourceService.downloadReportPdf(params);
      const url = window.URL.createObjectURL(new Blob([blob], { type: "application/pdf" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = "resources_report.pdf";
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.log(e);
      await showErrorPopup("Download failed", "PDF download failed.");
    }
  };

  const getTypePill = (type) => {
    const cfg = TYPE_CONFIG[type] || { icon: "📦", label: type, cls: "lab" };
    return (
      <span className={`typePill ${cfg.cls}`}>
        {cfg.icon} {cfg.label}
      </span>
    );
  };

  const handleEditClick = (r) => {
    setForm({
      name: r.name,
      type: r.type,
      capacity: r.capacity,
      location: r.location,
      status: r.status,
      availabilityWindows: r.availabilityWindows,
    });
    setEditingId(r.id);
    setShowFormModal(true);
  };

  const handleCancelEdit = () => {
    setForm(DEFAULT_FORM);
    setEditingId(null);
    setShowFormModal(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSubmit) {
      onSubmit(form, editingId, () => {
        setForm(DEFAULT_FORM);
        setEditingId(null);
        setShowFormModal(false);
      });
    }
  };

  return (
    <div className="card">

      <div className="topRow">
        <input
          className="input"
          placeholder="Search..."
          value={filters.q}
          onChange={(e) => setFilters({ ...filters, q: e.target.value })}
        />

        <button
          className="btnGhost"
          onClick={() => setView("table")}
          style={view === "table" ? { borderColor: "var(--accent)", color: "var(--accent)" } : {}}
        >
          Table
        </button>
        <button
          className="btnGhost"
          onClick={() => setView("grid")}
          style={view === "grid" ? { borderColor: "var(--accent)", color: "var(--accent)" } : {}}
        >
          Grid
        </button>

        <button className="btnGhost" onClick={downloadReport}>⬇ PDF</button>

        {canManageResources && selected.length > 0 && (
          <button className="btnMini danger" onClick={bulkDelete}>
            🗑 Delete ({selected.length})
          </button>
        )}
      </div>

      {/* TABLE VIEW */}
      {view === "table" && (
        <div style={{ overflowX: "auto" }}>
          <table className="table">
            <thead>
              <tr>
                {canManageResources ? <th aria-label="Select row" /> : null}
                <th>Name</th>
                <th>Type</th>
                <th>Capacity</th>
                <th>Location</th>
                <th>Status</th>
                <th>Availability</th>
                {canManageResources ? <th>Actions</th> : null}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={colCount} className="muted">
                    <AppLoader label="Loading resources..." variant="table" />
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={colCount} className="muted">No resources found.</td>
                </tr>
              ) : (
                items.map((r) => (
                  <tr key={r.id}>
                    {canManageResources ? (
                      <td>
                        <input
                          type="checkbox"
                          checked={selected.includes(r.id)}
                          onChange={() => toggleSelect(r.id)}
                        />
                      </td>
                    ) : null}
                    <td>{r.name}</td>
                    <td>{r.type}</td>
                    <td>{r.capacity}</td>
                    <td>{r.location}</td>
                    <td>
                      <span className={r.status === "ACTIVE" ? "pill ok" : "pill bad"}>
                        {r.status}
                      </span>
                    </td>
                    <td>
                      <span className={getAvailabilityPillClass(r.availabilityWindows)}>
                        {r.availabilityWindows}
                      </span>
                    </td>
                    {canManageResources ? (
                      <td>
                        <div className="actions">
                          <button type="button" className="btnMini" onClick={() => handleEditClick(r)}>Edit</button>
                          <button type="button" className="btnMini danger" onClick={() => onDelete(r.id)}>Delete</button>
                        </div>
                      </td>
                    ) : null}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* GRID VIEW */}
      {view === "grid" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 12 }}>
          {items.map((r) => (
            <ResourceCard
              key={r.id}
              resource={r}
              onClick={() => setSelectedResource(r)}
            />
          ))}
        </div>
      )}

      {/* RESOURCE DETAIL MODAL */}
      {selectedResource && (
        <div className="modal">
          <div className="modalContent">
            <div style={{ marginBottom: "12px" }}>
              {getTypePill(selectedResource.type)}
            </div>
            <h3 style={{ margin: "0 0 12px" }}>{selectedResource.name}</h3>
            <p><b>Capacity:</b> 👥 {selectedResource.capacity}</p>
            <p><b>Location:</b> 📍 {selectedResource.location}</p>
            <p><b>Status:</b> {selectedResource.status}</p>
            <p><b>Availability:</b> {selectedResource.availabilityWindows}</p>
            {selectedResource.availabilityWindows !== "AVAILABLE" && (
              <p style={{ color: "red", fontWeight: "600" }}>
                ⚠️ This resource is currently NOT AVAILABLE
              </p>
            )}
            <button className="btnPrimary" onClick={() => setSelectedResource(null)}>
              Close
            </button>
          </div>
        </div>
      )}

      {/* ADD / EDIT FORM MODAL (admins only) */}
      {canManageResources && showFormModal && (
        <div
          className="modal"
          onClick={(e) => { if (e.target === e.currentTarget) handleCancelEdit(); }}
        >
          <div className="modalContent" style={{ maxWidth: 600, width: "90%" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ margin: 0 }}>{editingId ? "Update Resource" : "Add Resource"}</h3>
              <button
                onClick={handleCancelEdit}
                style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#888" }}
              >
                ✕
              </button>
            </div>
            <ResourceForm
              form={form}
              setForm={setForm}
              onSubmit={handleSubmit}
              editingId={editingId}
              onCancelEdit={handleCancelEdit}
            />
          </div>
        </div>
      )}

      {canManageResources ? (
        <button
          type="button"
          onClick={() => {
            setForm(DEFAULT_FORM);
            setEditingId(null);
            setShowFormModal(true);
          }}
          title="Add Resource"
          style={{
            position: "fixed",
            bottom: "32px",
            right: "32px",
            width: "56px",
            height: "56px",
            borderRadius: "50%",
            background: "var(--accent, #6366f1)",
            color: "#fff",
            fontSize: "28px",
            border: "none",
            cursor: "pointer",
            boxShadow: "0 4px 16px rgba(0,0,0,0.18)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            transition: "transform 0.15s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.1)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
        >
          +
        </button>
      ) : null}

    </div>
  );
}
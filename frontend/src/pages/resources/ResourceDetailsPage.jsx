import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ResourceLayout from "../../components/resource/ResourceLayout";
import { resourceApi } from "../../api/resources/resourceApi";
import "./resources.css";

const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const buildImageUrl = (path) =>
  path ? `http://localhost:8085/${String(path).replace(/^\/+/, "")}` : "";

const equipmentTypes = new Set(["PROJECTOR", "CAMERA", "EQUIPMENT"]);

export default function ResourceDetailsPage({ onLogout, user, theme = "light", onToggleTheme }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [resource, setResource] = useState(null);
  const isAdmin = String(user?.role || "").toUpperCase() === "ADMIN";

  useEffect(() => {
    resourceApi.getById(id).then(setResource);
  }, [id]);

  if (!resource) {
    return <ResourceLayout onLogout={onLogout} user={user} theme={theme} onToggleTheme={onToggleTheme}><div>Loading...</div></ResourceLayout>;
  }

  return (
    <ResourceLayout onLogout={onLogout} user={user} theme={theme} onToggleTheme={onToggleTheme}>
      <div className={`resources-page ${theme}`}>
        <div className="resources-wrap">
          <div className="resources-actions">
            <button className="resources-btn back" onClick={() => navigate("/resources")}>Back</button>
            <button className="resources-btn asset" onClick={() => navigate(`/resources/${id}/asset-profile`)}>
              Asset Profile
            </button>
            <button className="resources-btn history" onClick={() => navigate(`/resources/${id}/inspection-history`)}>
              Inspection History
            </button>
            {isAdmin ? (
              <button className="resources-btn overdue" onClick={() => navigate("/resource-inspections/overdue")}>
                Overdue Dashboard
              </button>
            ) : null}
            <button className="resources-btn qr" onClick={() => navigate("/resource-assets/qr")}>
              QR Lookup
            </button>
          </div>
          <div className="resources-modal-card">
            <h2>{resource.name}</h2>
            {resource.imageUrl ? (
              <img
                src={buildImageUrl(resource.imageUrl)}
                alt={resource.name}
                style={{
                  width: "min(100%, 640px)",
                  height: "320px",
                  objectFit: "cover",
                  borderRadius: 12,
                  marginBottom: 16,
                  display: "block",
                }}
              />
            ) : null}
            <div>Type: {resource.type}</div>
            {!equipmentTypes.has(resource.type) ? <div>Location: {resource.location}</div> : null}
            {!equipmentTypes.has(resource.type) ? <div>Capacity: {resource.capacity}</div> : null}
            <div>Status: {resource.status}</div>
            <div>Availability: {resource.availabilityStart} - {resource.availabilityEnd}</div>
            <p>{resource.description || "No description"}</p>
            <h4>Calendar-style Availability</h4>
            <div className="resources-calendar">
              {weekDays.map((day) => (
                <div key={day} className="day-cell">
                  <strong>{day}</strong>
                  <div>{resource.availabilityStart} - {resource.availabilityEnd}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </ResourceLayout>
  );
}

import { useEffect, useState } from "react";
import ResourceLayout from "../components/resource/ResourceLayout.jsx";
import ResourceStats from "../components/resource/ResourceStats.jsx";
import ResourceChart from "../components/resource/ResourceChart.jsx";
import { resourceService } from "../services/resourceService.js";
import { apiClient } from "../api/apiClient.js";
import AppLoader from "../components/common/AppLoader.jsx";

export default function AdminDashboardPage({ onLogout, user }) {
  const [items, setItems] = useState([]);
  const [loadingDashboard, setLoadingDashboard] = useState(true);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [createSuccess, setCreateSuccess] = useState("");
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    password: "",
    role: "USER",
    pictureUrl: "",
  });

  useEffect(() => {
    const load = async () => {
      setLoadingDashboard(true);
      try {
        const data = await resourceService.list({});
        setItems(data);
      } catch (err) {
        console.error("Failed to load dashboard data", err);
      } finally {
        setLoadingDashboard(false);
      }
    };
    load();
  }, []);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setCreating(true);
    setCreateError("");
    setCreateSuccess("");

    try {
      await apiClient.post("/auth/admin/users", newUser);
      setCreateSuccess("User created successfully.");
      setNewUser({
        name: "",
        email: "",
        password: "",
        role: "USER",
        pictureUrl: "",
      });
    } catch (err) {
      const msg =
        err.response?.data ||
        err.message ||
        "Failed to create user. Please try again.";
      setCreateError(msg);
    } finally {
      setCreating(false);
    }
  };

  return (
    <ResourceLayout onLogout={onLogout} user={user}>
      <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: 24 }}>
        <div>
          <h2 style={{ marginBottom: 6 }}>Admin Dashboard</h2>
          <p style={{ margin: 0, color: "var(--muted)" }}>
            Overview of campus resources, user management, and quick access to modules.
          </p>
        </div>

        {loadingDashboard ? (
          <div className="card" style={{ padding: 24, textAlign: "center" }}>
            <AppLoader label="Loading dashboard..." variant="inline" />
          </div>
        ) : (
          <>
            <ResourceStats items={items} />
            <ResourceChart items={items} />
          </>
        )}



        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 18,
            marginTop: 10,
          }}
        >
          <a href="/resources" className="card quickLink">
            <h3 style={{ marginBottom: 4 }}>Manage Resources</h3>
            <p style={{ margin: 0, color: "var(--muted)" }}>
              Add, update, and organize campus facilities and equipment.
            </p>
          </a>

          <a href="/bookings" className="card quickLink">
            <h3 style={{ marginBottom: 4 }}>Bookings</h3>
            <p style={{ margin: 0, color: "var(--muted)" }}>
              View and control room and lab reservations.
            </p>
          </a>

          <a href="/tickets" className="card quickLink">
            <h3 style={{ marginBottom: 4 }}>IT Tickets</h3>
            <p style={{ margin: 0, color: "var(--muted)" }}>
              Track and resolve support requests from staff and students.
            </p>
          </a>

          <a href="/notifications" className="card quickLink">
            <h3 style={{ marginBottom: 4 }}>Notifications</h3>
            <p style={{ margin: 0, color: "var(--muted)" }}>
              Send announcements and alerts across the campus.
            </p>
          </a>

          <a href="/settings" className="card quickLink">
            <h3 style={{ marginBottom: 4 }}>System Settings</h3>
            <p style={{ margin: 0, color: "var(--muted)" }}>
              Configure system preferences and integrations.
            </p>
          </a>
        </div>
      </div>
    </ResourceLayout>
  );
}


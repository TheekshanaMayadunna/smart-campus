import { useEffect, useMemo, useState } from "react";
import ResourceLayout from "../components/resource/ResourceLayout.jsx";
import { adminUserService } from "../services/adminUserService.js";
import AppLoader from "../components/common/AppLoader.jsx";
import { confirmPopup } from "../utils/popup";
import "../components/resource/table.css";

const ROLE_OPTIONS = ["ADMIN", "TECHNICIAN", "STAFF", "LECTURER", "STUDENT", "USER"];

function getErrorMessage(error, fallback) {
  const status = error?.response?.status;
  const data = error?.response?.data;

  if (status === 404 || status === 405) {
    return "Manage users API is unavailable. Restart the backend server and try again.";
  }
  if (status === 403) {
    return "Only ADMIN users can manage system users.";
  }
  if (typeof data === "string") return data;
  if (data?.message) return data.message;
  if (data?.error) return data.error;
  return error?.message || fallback;
}

export default function ManageUsersPage({ onLogout, user }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    role: "USER",
    pictureUrl: "",
    password: "",
  });

  const isEditing = useMemo(() => editingId !== null, [editingId]);

  const resetForm = () => {
    setEditingId(null);
    setForm({
      name: "",
      email: "",
      role: "USER",
      pictureUrl: "",
      password: "",
    });
  };

  const loadUsers = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await adminUserService.list();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load users."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const onChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const startEdit = (u) => {
    setEditingId(u.id);
    setSuccess("");
    setError("");
    setForm({
      name: u.name || "",
      email: u.email || "",
      role: u.role || "USER",
      pictureUrl: u.pictureUrl || "",
      password: "",
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      if (isEditing) {
        await adminUserService.update(editingId, form);
        setSuccess("User updated successfully.");
      } else {
        if (!form.password.trim()) {
          setError("Password is required when creating a new user.");
          setSubmitting(false);
          return;
        }
        await adminUserService.create(form);
        setSuccess("User created successfully.");
      }
      resetForm();
      await loadUsers();
    } catch (err) {
      setError(getErrorMessage(err, "Failed to save user."));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    const confirmed = await confirmPopup({
      title: "Delete this user account?",
      text: "This action cannot be undone.",
      confirmButtonText: "Yes, delete",
      cancelButtonText: "Cancel",
      icon: "warning",
    });
    if (!confirmed) return;

    setError("");
    setSuccess("");
    try {
      await adminUserService.remove(id);
      setSuccess("User deleted successfully.");
      if (editingId === id) resetForm();
      await loadUsers();
    } catch (err) {
      setError(getErrorMessage(err, "Failed to delete user."));
    }
  };

  return (
    <ResourceLayout onLogout={onLogout} user={user}>
      <div style={{ display: "grid", gap: 20 }}>
        <div className="card">
          <h2 style={{ margin: 0 }}>Manage Users</h2>
          <p style={{ marginTop: 8, marginBottom: 0, color: "var(--muted)" }}>
            Create, edit, and remove system users. This section is available only for admins.
          </p>
        </div>

        <div className="card">
          <h3 style={{ marginTop: 0 }}>{isEditing ? "Edit User" : "Create User"}</h3>
          {error ? <div style={{ color: "#b71c1c", marginBottom: 12 }}>{error}</div> : null}
          {success ? <div style={{ color: "#1b5e20", marginBottom: 12 }}>{success}</div> : null}

          <form
            onSubmit={handleSubmit}
            style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}
          >
            <div>
              <label className="label">Name</label>
              <input className="input" type="text" value={form.name} onChange={(e) => onChange("name", e.target.value)} required />
            </div>
            <div>
              <label className="label">Email</label>
              <input className="input" type="email" value={form.email} onChange={(e) => onChange("email", e.target.value)} required />
            </div>
            <div>
              <label className="label">Role</label>
              <select className="input" value={form.role} onChange={(e) => onChange("role", e.target.value)} required>
                {ROLE_OPTIONS.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Picture URL</label>
              <input className="input" type="url" value={form.pictureUrl} onChange={(e) => onChange("pictureUrl", e.target.value)} />
            </div>
            <div>
              <label className="label">
                Password {isEditing ? "(optional, set only to change)" : ""}
              </label>
              <input className="input" type="password" value={form.password} onChange={(e) => onChange("password", e.target.value)} />
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "end" }}>
              <button type="submit" className="btnPrimary" disabled={submitting}>
                {submitting ? "Saving..." : isEditing ? "Update User" : "Create User"}
              </button>
              {isEditing ? (
                <button type="button" className="btnGhost" onClick={resetForm}>
                  Cancel
                </button>
              ) : null}
            </div>
          </form>
        </div>

        <div className="card">
          <div className="topRow">
            <h3 style={{ margin: 0 }}>All Users</h3>
            <span className="pill">{users.length} total</span>
          </div>

          {loading ? (
            <div style={{ padding: 20 }}>
              <AppLoader label="Loading users..." variant="inline" />
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={4}>No users found.</td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u.id}>
                      <td>{u.name}</td>
                      <td>{u.email}</td>
                      <td>{u.role}</td>
                      <td style={{ display: "flex", gap: 8 }}>
                        <button type="button" className="btnMini" onClick={() => startEdit(u)}>
                          Edit
                        </button>
                        <button type="button" className="btnMini danger" onClick={() => handleDelete(u.id)}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </ResourceLayout>
  );
}

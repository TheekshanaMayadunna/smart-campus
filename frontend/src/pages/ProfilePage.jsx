import { useState } from "react";
import ResourceLayout from "../components/resource/ResourceLayout.jsx";
import { profileService } from "../services/profileService.js";
import { promptPopup, showWarningPopup } from "../utils/popup";
import "../components/resource/table.css";

export default function ProfilePage({ onLogout, user, onProfileUpdate }) {
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [studentId, setStudentId] = useState(user?.studentId || "");
  const [pictureUrl, setPictureUrl] = useState(user?.pictureUrl || "");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const isGoogleLogin = Boolean(user?.googleLogin);

  const getErrorMessage = (err) => {
    const payload = err?.response?.data;
    if (typeof payload === "string") return payload;
    if (payload?.message) return String(payload.message);
    if (payload?.error) return String(payload.error);
    return "Failed to update profile.";
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const updatedUser = await profileService.updateProfile({
        name,
        email,
        studentId,
        pictureUrl,
      });
      onProfileUpdate(updatedUser);
      const emailChanged = !isGoogleLogin && String(user?.email || "") !== String(updatedUser?.email || "");
      if (emailChanged) {
        setSuccess("Profile updated. Please sign in again with your new email.");
        setTimeout(() => {
          onLogout?.();
        }, 1200);
      } else {
        setSuccess("Profile updated successfully.");
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const onDeleteAccount = async () => {
    const confirmation = await promptPopup({
      title: "Delete account",
      text: "Type DELETE to permanently delete your account.",
      inputPlaceholder: "Type DELETE",
      confirmButtonText: "Continue",
      cancelButtonText: "Cancel",
    });
    if (confirmation === null) return;

    if (confirmation !== "DELETE") {
      await showWarningPopup("Confirmation mismatch", "Please type DELETE exactly to continue.");
      return;
    }

    setDeleting(true);
    setError("");
    setSuccess("");
    try {
      await profileService.deleteAccount();
      await onLogout?.();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <ResourceLayout onLogout={onLogout} user={user}>
      <div className="card" style={{ maxWidth: 720 }}>
        <h2 style={{ marginTop: 0, marginBottom: 6 }}>Edit Profile</h2>
        <p style={{ marginTop: 0, color: "var(--muted)" }}>
          Update your personal details and profile picture.
        </p>

        {error ? (
          <div style={{ color: "#b42318", marginBottom: 10, fontWeight: 600 }}>{String(error)}</div>
        ) : null}
        {success ? (
          <div style={{ color: "#027a48", marginBottom: 10, fontWeight: 600 }}>{success}</div>
        ) : null}

        <form onSubmit={onSubmit}>
          <div className="grid2">
            <div>
              <label className="label">Full Name</label>
              <input
                className="input"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label">Email</label>
              <input
                className="input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isGoogleLogin}
                required
              />
              {isGoogleLogin ? (
                <small className="muted" style={{ padding: 0 }}>
                  Google login accounts cannot change email.
                </small>
              ) : null}
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label className="label">Student ID</label>
              <input
                className="input"
                type="text"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                placeholder="e.g., ICT/2022/001"
              />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label className="label">Profile Picture URL</label>
              <input
                className="input"
                type="url"
                value={pictureUrl}
                onChange={(e) => setPictureUrl(e.target.value)}
                placeholder="https://example.com/profile.jpg"
              />
            </div>
          </div>

          <div className="row">
            <button className="btnPrimary" type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save Profile"}
            </button>
          </div>
        </form>

        <hr style={{ margin: "18px 0", borderColor: "var(--border)", opacity: 0.7 }} />
        <div>
          <h3 style={{ margin: "0 0 6px", color: "#b42318" }}>Danger Zone</h3>
          <p className="muted" style={{ textAlign: "left", padding: 0, margin: "0 0 10px" }}>
            Permanently delete your profile, account, and related data.
          </p>
          <button className="btnMini danger" type="button" onClick={onDeleteAccount} disabled={deleting}>
            {deleting ? "Deleting..." : "Delete My Account"}
          </button>
        </div>
      </div>
    </ResourceLayout>
  );
}

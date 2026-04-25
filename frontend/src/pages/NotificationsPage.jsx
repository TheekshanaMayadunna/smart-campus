import { useEffect, useState } from "react";
import ResourceLayout from "../components/resource/ResourceLayout";
import { notificationService } from "../services/notificationService";
import "./notifications.css";

export default function NotificationsPage({ onLogout, user }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState("all");
  const [preferences, setPreferences] = useState({
    bookingUpdates: true,
    ticketStatusChanges: true,
    ticketComments: true,
  });
  const [savingPrefs, setSavingPrefs] = useState(false);

  const load = async (showLoader = true) => {
    if (showLoader) setLoading(true);
    setError("");
    try {
      const [data, prefData] = await Promise.all([
        notificationService.list(),
        notificationService.getPreferences(),
      ]);
      setItems(Array.isArray(data) ? data : []);
      setPreferences({
        bookingUpdates: Boolean(prefData?.bookingUpdates),
        ticketStatusChanges: Boolean(prefData?.ticketStatusChanges),
        ticketComments: Boolean(prefData?.ticketComments),
      });
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data || "Failed to load notifications");
      setItems([]);
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onMarkRead = async (id) => {
    try {
      await notificationService.markRead(id);
      setItems((prev) => prev.map((item) => (item.id === id ? { ...item, read: true, isRead: true } : item)));
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data || "Failed to mark notification as read");
    }
  };

  const onMarkAllRead = async () => {
    try {
      await notificationService.markAllRead();
      setItems((prev) => prev.map((item) => ({ ...item, read: true, isRead: true })));
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data || "Failed to mark all as read");
    }
  };

  const unreadCount = items.filter((item) => !(item.isRead ?? item.read)).length;
  const readCount = items.length - unreadCount;

  const visibleItems = items.filter((item) => {
    const isRead = item.isRead ?? item.read;
    if (filter === "unread") return !isRead;
    if (filter === "read") return isRead;
    return true;
  });

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await load(false);
    } finally {
      setRefreshing(false);
    }
  };

  const updatePreference = async (key) => {
    const next = { ...preferences, [key]: !preferences[key] };
    setPreferences(next);
    setSavingPrefs(true);
    try {
      const saved = await notificationService.updatePreferences(next);
      setPreferences({
        bookingUpdates: Boolean(saved?.bookingUpdates),
        ticketStatusChanges: Boolean(saved?.ticketStatusChanges),
        ticketComments: Boolean(saved?.ticketComments),
      });
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data || "Failed to update preferences");
      setPreferences((prev) => ({ ...prev, [key]: !prev[key] }));
    } finally {
      setSavingPrefs(false);
    }
  };

  const preferenceOptions = [
    { key: "bookingUpdates", label: "Booking approval/rejection", hint: "Booking workflow updates" },
    { key: "ticketStatusChanges", label: "Ticket status changes", hint: "When ticket state is updated" },
    { key: "ticketComments", label: "New comments on your tickets", hint: "When someone comments on your ticket" },
  ];

  return (
    <ResourceLayout onLogout={onLogout} user={user}>
      <section className="card resourcePageHeader notificationsHeader">
        <div>
          <h1 className="resourcePageTitle">Notifications</h1>
          <p className="resourcePageSubtitle">
            Keep track of booking decisions, ticket updates, and comments.
          </p>
        </div>
        <span className="roleBadge viewer">{user?.role || "USER"}</span>
      </section>

      <section className="card notificationsPanel">
        <div className="notificationsPrefsCard">
          <h3 className="notificationsSectionTitle">Notification Preferences</h3>
          <div className="notificationsPrefsGrid">
            {preferenceOptions.map((pref) => (
              <label key={pref.key} className="notificationsPrefItem">
                <span className="notificationsPrefTextWrap">
                  <span className="notificationsPrefTitle">{pref.label}</span>
                  <span className="notificationsPrefHint">{pref.hint}</span>
                </span>
                <span className="notificationsSwitch">
                  <input
                    type="checkbox"
                    checked={preferences[pref.key]}
                    onChange={() => updatePreference(pref.key)}
                    disabled={savingPrefs}
                  />
                  <span className="notificationsSwitchSlider" />
                </span>
              </label>
            ))}
          </div>
          <p className="muted notificationsPrefsStatus">
            {savingPrefs ? "Saving preferences..." : "Changes apply immediately."}
          </p>
        </div>

        <div className="notificationsToolbar">
          <div className="notificationsStats">
            <strong className="notificationsUnreadCount">Unread: {unreadCount}</strong>
            <span className="muted notificationsReadCount">Read: {readCount}</span>
          </div>
          <div className="notificationsToolbarActions">
            <button className="btnMini" onClick={onRefresh} disabled={loading || refreshing}>
              {refreshing ? "Refreshing..." : "Refresh"}
            </button>
            <button
              className="btnMini notificationsMarkAllBtn"
              onClick={onMarkAllRead}
              disabled={items.length === 0 || unreadCount === 0}
            >
              Mark all as read
            </button>
          </div>
        </div>

        <div className="notificationsFilters">
          <button
            className={`notificationsFilterBtn ${filter === "all" ? "active" : ""}`}
            onClick={() => setFilter("all")}
            type="button"
          >
            All ({items.length})
          </button>
          <button
            className={`notificationsFilterBtn ${filter === "unread" ? "active" : ""}`}
            onClick={() => setFilter("unread")}
            type="button"
          >
            Unread ({unreadCount})
          </button>
          <button
            className={`notificationsFilterBtn ${filter === "read" ? "active" : ""}`}
            onClick={() => setFilter("read")}
            type="button"
          >
            Read ({readCount})
          </button>
        </div>

        {loading ? <p className="muted">Loading notifications...</p> : null}
        {error ? <p className="muted notificationsError">{String(error)}</p> : null}

        {!loading && !error && visibleItems.length === 0 ? (
          <p className="muted">No notifications yet.</p>
        ) : null}

        <div className="notificationsList">
          {visibleItems.map((item) => {
            const isRead = item.isRead ?? item.read;
            return (
              <article
                key={item.id}
                className={`notificationsItem ${isRead ? "isRead" : "isUnread"}`}
              >
                <div className="notificationsItemTop">
                  <div className="notificationsItemHeading">
                    {!isRead ? <span className="notificationsUnreadDot" /> : null}
                    <strong className="notificationsItemTitle">{item.title}</strong>
                  </div>
                  <span className="muted notificationsItemDate">
                    {item.createdAt ? new Date(item.createdAt).toLocaleString() : ""}
                  </span>
                </div>
                <p className="notificationsItemMessage">{item.message}</p>
                <div className="notificationsItemBottom">
                  <span className="pill">{item.type}</span>
                  {!isRead ? (
                    <button className="btnMini" onClick={() => onMarkRead(item.id)}>
                      Mark as read
                    </button>
                  ) : (
                    <span className="muted">Read</span>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </ResourceLayout>
  );
}

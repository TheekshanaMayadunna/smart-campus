import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import "./resource.css";

import homeIcon from "../../Assests/home.png";
import adminIcon from "../../Assests/admin.png";
import resourcesIcon from "../../Assests/resources.png";
import bookingsIcon from "../../Assests/Bookings.png";
import ticketsIcon from "../../Assests/ticket.png";
import notificationsIcon from "../../Assests/notification.png";
import profileIcon from "../../Assests/profile.svg";
import settingsIcon from "../../Assests/Setting.png";
import BrandLogo from "../common/BrandLogo.jsx";
import { notificationService } from "../../services/notificationService.js";

export default function ResourceLayout({ children, onLogout, user }) {
  const [unreadCount, setUnreadCount] = useState(0);
  const isAdmin = user?.role === "ADMIN";
  const isTechnician = user?.role === "TECHNICIAN";

  useEffect(() => {
    if (!user) return;
    let isMounted = true;

    const loadUnread = async () => {
      try {
        const count = await notificationService.unreadCount();
        if (isMounted) setUnreadCount(Number(count) || 0);
      } catch (error) {
        if (isMounted) setUnreadCount(0);
      }
    };

    loadUnread();
    const interval = setInterval(loadUnread, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [user?.id]);

  return (
    <div className="appShell">
      <aside className="sideNav">
        <BrandLogo className="sideNavBrand" />

        <div className="profile sideProfile">
          <div className="avatar">
            {user?.pictureUrl ? (
              <img
                src={user.pictureUrl}
                alt="profile"
                className="avatarImg"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  e.target.style.display = "none";
                  e.target.nextSibling.style.display = "flex";
                }}
              />
            ) : null}
            <div
              className="avatarPlaceholder"
              style={{ display: user?.pictureUrl ? "none" : "flex" }}
            >
              {user?.name?.charAt(0).toUpperCase() || "U"}
            </div>
          </div>
          <div className="sideProfileText" style={{ minWidth: 0 }}>
            <div className="name">{user?.name || "Campus User"}</div>
            <div className="email">{user?.email || "user@campus.net"}</div>
          </div>
        </div>

        <nav className="sideNavMenu">
          {!isTechnician && (
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                isActive ? "sideNavItem active" : "sideNavItem"
              }
            >
              <img src={homeIcon} alt="" className="sideNavIcon" />
              <span className="sideNavLabel">Home</span>
            </NavLink>
          )}
          {isAdmin && (
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                isActive ? "sideNavItem active" : "sideNavItem"
              }
            >
              <img src={adminIcon} alt="" className="sideNavIcon" />
              <span className="sideNavLabel">Admin Dashboard</span>
            </NavLink>
          )}
          {!isTechnician && (
            <NavLink
              to="/resources"
              className={({ isActive }) =>
                isActive ? "sideNavItem active" : "sideNavItem"
              }
            >
              <img src={resourcesIcon} alt="" className="sideNavIcon" />
              <span className="sideNavLabel">Resources</span>
            </NavLink>
          )}
          {!isTechnician && (
            <NavLink
              to="/bookings"
              className={({ isActive }) =>
                isActive ? "sideNavItem active" : "sideNavItem"
              }
            >
              <img src={bookingsIcon} alt="" className="sideNavIcon" />
              <span className="sideNavLabel">Bookings</span>
            </NavLink>
          )}
          <NavLink
            to="/tickets"
            className={({ isActive }) =>
              isActive ? "sideNavItem active" : "sideNavItem"
            }
          >
            <img src={ticketsIcon} alt="" className="sideNavIcon" />
            <span className="sideNavLabel">Tickets</span>
          </NavLink>
          <NavLink
            to="/notifications"
            className={({ isActive }) =>
              isActive ? "sideNavItem active" : "sideNavItem"
            }
          >
            <span className="sideNavIconWrap">
              <img src={notificationsIcon} alt="" className="sideNavIcon" />
              {unreadCount > 0 ? (
                <span className="notifyBadge">{unreadCount > 99 ? "99+" : unreadCount}</span>
              ) : null}
            </span>
            <span className="sideNavLabel">Notifications</span>
          </NavLink>
          {!isTechnician && (
            <NavLink
              to="/profile"
              className={({ isActive }) =>
                isActive ? "sideNavItem active" : "sideNavItem"
              }
            >
              <img src={profileIcon} alt="" className="sideNavIcon" />
              <span className="sideNavLabel">Profile</span>
            </NavLink>
          )}
          {isAdmin && (
            <NavLink
              to="/manage-users"
              className={({ isActive }) =>
                isActive ? "sideNavItem active" : "sideNavItem"
              }
            >
              <img src={profileIcon} alt="" className="sideNavIcon" />
              <span className="sideNavLabel">Manage Users</span>
            </NavLink>
          )}
          {isAdmin && (
            <NavLink
              to="/settings"
              className={({ isActive }) =>
                isActive ? "sideNavItem active" : "sideNavItem"
              }
            >
              <img src={settingsIcon} alt="" className="sideNavIcon" />
              <span className="sideNavLabel">Settings</span>
            </NavLink>
          )}
        </nav>

        <div className="logout sideLogoutWrap">
          <button onClick={onLogout} className="sideLogout">
            <span className="sideLogoutIcon">⏏</span>
            <span className="sideNavLabel">Logout</span>
          </button>
        </div>
      </aside>

      <main className="content">
        <div className="contentInner">{children}</div>
      </main>
    </div>
  );
}
import { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { Trees, Zap } from "lucide-react";
import BrandLogo from "../components/common/BrandLogo.jsx";
import homeIcon from "../Assests/home.png";
import adminIcon from "../Assests/admin.png";
import resourcesIcon from "../Assests/resources.png";
import bookingsIcon from "../Assests/Bookings.png";
import ticketsIcon from "../Assests/ticket.png";
import notificationsIcon from "../Assests/notification.png";
import profileIcon from "../Assests/profile.svg";
import settingsIcon from "../Assests/Setting.png";
import "./landing.css";
import { notificationService } from "../services/notificationService.js";

export default function LandingPage({ user, onLogout }) {
  const isAuthenticated = Boolean(user);
  const canManageResources = (user?.role || "").toUpperCase() === "ADMIN";
  const [unreadCount, setUnreadCount] = useState(0);
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;
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
  }, [isAuthenticated, user?.id]);

  const handleNavItemClick = () => {
    if (typeof window !== "undefined" && window.innerWidth <= 900) {
      setNavOpen(false);
    }
  };

  return (
    <div className="landingPage">
      <aside
        className={`${isAuthenticated ? "landingSideNav landingSideNavAuth" : "landingSideNav"} ${
          navOpen ? "navOpen" : ""
        }`}
      >
        <Link to="/" className="landingBrand" aria-label="Campus Velora home">
          <BrandLogo className="landingBrandLogo" />
        </Link>
        <button
          type="button"
          className="landingMenuToggle"
          onClick={() => setNavOpen((prev) => !prev)}
          aria-expanded={navOpen}
          aria-label="Toggle navigation menu"
        >
          {navOpen ? "Close Menu" : "Menu"}
        </button>

        {isAuthenticated ? (
          <div className="landingProfile">
            <div className="landingAvatar">
              {user?.pictureUrl ? (
                <img
                  src={user.pictureUrl}
                  alt="profile"
                  className="landingAvatarImg"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    e.target.style.display = "none";
                    e.target.nextSibling.style.display = "flex";
                  }}
                />
              ) : null}
              <div
                className="landingAvatarPlaceholder"
                style={{ display: user?.pictureUrl ? "none" : "flex" }}
              >
                {user?.name?.charAt(0).toUpperCase() || "U"}
              </div>
            </div>

            <div className="landingProfileText">
              <div className="landingProfileName">{user?.name || "Campus User"}</div>
              <div className="landingProfileEmail">{user?.email || "user@campus.net"}</div>
            </div>
          </div>
        ) : null}

        <nav className="landingNav" aria-label="Landing navigation">
          {isAuthenticated ? (
            <>
              <NavLink
                to="/"
                end
                className={({ isActive }) =>
                  isActive ? "landingNavLink active" : "landingNavLink"
                }
                onClick={handleNavItemClick}
              >
                <img src={homeIcon} alt="" className="landingNavIcon" />
                <span className="landingNavLabel">Home</span>
              </NavLink>
              {user?.role === "ADMIN" && (
                <NavLink
                  to="/admin"
                  className={({ isActive }) =>
                    isActive ? "landingNavLink active" : "landingNavLink"
                  }
                  onClick={handleNavItemClick}
                >
                  <img src={adminIcon} alt="" className="landingNavIcon" />
                  <span className="landingNavLabel">Admin Dashboard</span>
                </NavLink>
              )}
              <NavLink
                to="/resources"
                className={({ isActive }) =>
                  isActive ? "landingNavLink active" : "landingNavLink"
                }
                onClick={handleNavItemClick}
              >
                <img src={resourcesIcon} alt="" className="landingNavIcon" />
                <span className="landingNavLabel">Resources</span>
              </NavLink>
              <NavLink
                to="/bookings"
                className={({ isActive }) =>
                  isActive ? "landingNavLink active" : "landingNavLink"
                }
                onClick={handleNavItemClick}
              >
                <img src={bookingsIcon} alt="" className="landingNavIcon" />
                <span className="landingNavLabel">Bookings</span>
              </NavLink>
              <NavLink
                to="/tickets"
                className={({ isActive }) =>
                  isActive ? "landingNavLink active" : "landingNavLink"
                }
                onClick={handleNavItemClick}
              >
                <img src={ticketsIcon} alt="" className="landingNavIcon" />
                <span className="landingNavLabel">Tickets</span>
              </NavLink>
              <NavLink
                to="/notifications"
                className={({ isActive }) =>
                  isActive ? "landingNavLink active" : "landingNavLink"
                }
                onClick={handleNavItemClick}
              >
                <span className="landingNavIconWrap">
                  <img src={notificationsIcon} alt="" className="landingNavIcon" />
                  {unreadCount > 0 ? (
                    <span className="landingNotifyBadge">{unreadCount > 99 ? "99+" : unreadCount}</span>
                  ) : null}
                </span>
                <span className="landingNavLabel">Notifications</span>
              </NavLink>
              <NavLink
                to="/profile"
                className={({ isActive }) =>
                  isActive ? "landingNavLink active" : "landingNavLink"
                }
                onClick={handleNavItemClick}
              >
                <img src={profileIcon} alt="" className="landingNavIcon" />
                <span className="landingNavLabel">Profile</span>
              </NavLink>
              {user?.role === "ADMIN" && (
                <NavLink
                  to="/manage-users"
                  className={({ isActive }) =>
                    isActive ? "landingNavLink active" : "landingNavLink"
                  }
                  onClick={handleNavItemClick}
                >
                  <img src={profileIcon} alt="" className="landingNavIcon" />
                  <span className="landingNavLabel">Manage Users</span>
                </NavLink>
              )}
              {user?.role === "ADMIN" && (
                <NavLink
                  to="/settings"
                  className={({ isActive }) =>
                    isActive ? "landingNavLink active" : "landingNavLink"
                  }
                  onClick={handleNavItemClick}
                >
                  <img src={settingsIcon} alt="" className="landingNavIcon" />
                  <span className="landingNavLabel">Settings</span>
                </NavLink>
              )}
            </>
          ) : (
            <>
              <NavLink
                to="/"
                end
                className={({ isActive }) => (isActive ? "landingNavLink active" : "landingNavLink")}
                onClick={handleNavItemClick}
              >
                Home
              </NavLink>
              <NavLink
                to="/about"
                className={({ isActive }) => (isActive ? "landingNavLink active" : "landingNavLink")}
                onClick={handleNavItemClick}
              >
                About Us
              </NavLink>
              <NavLink
                to="/features"
                className={({ isActive }) => (isActive ? "landingNavLink active" : "landingNavLink")}
                onClick={handleNavItemClick}
              >
                Features
              </NavLink>
              <NavLink
                to="/contact"
                className={({ isActive }) => (isActive ? "landingNavLink active" : "landingNavLink")}
                onClick={handleNavItemClick}
              >
                Contact
              </NavLink>
            </>
          )}
        </nav>

        <div className="landingAuthActions">
          {isAuthenticated ? (
            <button type="button" onClick={onLogout} className="landingBtn landingBtnPrimary">
              Logout
            </button>
          ) : (
            <>
              <Link to="/login" className="landingBtn landingBtnGhost">
                Login
              </Link>
              <Link to="/signup" className="landingBtn landingBtnPrimary">
                Sign Up
              </Link>
            </>
          )}
        </div>
      </aside>

      <main className="landingContent">
        <div className="landingContainer">
          <section id="home" className="landingHeroSection">
            <div className="landingHeroContent">
              <h1>
                Build a Greener Campus <span>Smarter</span>
              </h1>
              <p>
                One place to handle resources, bookings, tickets, notifications, and more for
                students, lecturers, and administrators with sustainability-first operations.
              </p>
              <div className="landingHeroActions">
                {isAuthenticated ? (
                  <>
                    <Link to="/resources" className="landingBtn landingBtnPrimary">
                      {canManageResources ? "Manage Resources" : "View Resources"}
                    </Link>
                    <Link to="/bookings" className="landingBtn landingBtnGhost">
                      View Bookings
                    </Link>
                  </>
                ) : (
                  <>
                    <Link to="/signup" className="landingBtn landingBtnPrimary">
                      Get Started
                    </Link>
                    <Link to="/login" className="landingBtn landingBtnGhost">
                      I already have an account
                    </Link>
                  </>
                )}
              </div>
            </div>
            {isAuthenticated ? (
              <div className="landingStatGrid">
                <article className="landingStatCard">
                  <div className="landingStatIcon">
                    <Trees size={18} />
                  </div>
                  <h3>Green Spaces</h3>
                  <p>86% efficient occupancy optimization across campus facilities.</p>
                </article>
                <article className="landingStatCard">
                  <div className="landingStatIcon">
                    <Zap size={18} />
                  </div>
                  <h3>Energy Smart</h3>
                  <p>Low-power scheduling and digital-first workflows reduce waste.</p>
                </article>
              </div>
            ) : null}
            {!isAuthenticated ? (
              <div className="landingQuickGrid">
                <Link to="/about" className="landingQuickCard">
                  <h3>About Platform</h3>
                  <p>Learn the story and mission behind Campus Velora.</p>
                </Link>
                <Link to="/features" className="landingQuickCard">
                  <h3>Feature Tour</h3>
                  <p>Explore modules for resources, bookings, tickets, and notifications.</p>
                </Link>
                <Link to="/contact" className="landingQuickCard">
                  <h3>Contact Support</h3>
                  <p>Find support channels and office hours for quick assistance.</p>
                </Link>
              </div>
            ) : null}
          </section>

          <section id="about" className="landingSection">
            <h2>About Us</h2>
            <p>
              Campus Velora is built to simplify university operations and improve
              communication between all campus users.
            </p>
          </section>

          <section id="features" className="landingSection landingSectionMuted">
            <div className="landingFeatureGrid">
              <article className="landingFeatureCard">
                <h3>Resource Tracking</h3>
                <p>Track and manage equipment, rooms, and learning resources in one dashboard.</p>
              </article>
              <article className="landingFeatureCard">
                <h3>Booking Workflows</h3>
                <p>Handle booking requests with clear status updates and better visibility.</p>
              </article>
              <article className="landingFeatureCard">
                <h3>Support Tickets</h3>
                <p>Resolve issues faster with centralized ticket management for campus users.</p>
              </article>
            </div>
          </section>

          <footer id="contact" className="landingFooter">
            <h2>Contact</h2>
            <p>Need help? Reach out to the university IT support team for assistance.</p>
          </footer>
        </div>
      </main>
    </div>
  );
}

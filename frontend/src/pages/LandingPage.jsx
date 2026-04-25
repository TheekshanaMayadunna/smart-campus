import { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { Bell, BookOpen, Building2, GraduationCap, LogOut, Mail, MapPin, Moon, PanelLeftClose, PanelLeftOpen, Phone, ShieldCheck, Sparkles, Sun, Ticket, Trees, Zap } from "lucide-react";
import BrandLogo from "../components/common/BrandLogo.jsx";
import CampusFooter from "../components/common/CampusFooter.jsx";
import studentsImage from "../Assests/students.jpg";
import heroCampusImage from "../Assests/hero-campus.jpg";
import logoOneImage from "../Assests/logo 1.jpg";
import logoTwoImage from "../Assests/logo 2.jpg";
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
import { resourceApi } from "../api/resources/resourceApi.js";
import { campusDetails } from "../config/campusDetails.js";

const campusStats = [
  { value: "120+", label: "Smart Learning Spaces" },
  { value: "24/7", label: "Digital Access Workflows" },
  { value: "18k+", label: "Students & Staff Supported" },
  { value: "99.9%", label: "Operational Uptime" },
];

const facilities = [
  {
    title: "Collaborative Learning Lounges",
    text: "Flexible study zones with modern seating, display systems, and always-on connectivity.",
    image:
      "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Advanced Computer Laboratories",
    text: "High-capacity labs built for software, design, analytics, and research-heavy coursework.",
    image:
      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Immersive Presentation Rooms",
    text: "Presentation-ready spaces for meetings, project defense sessions, and academic showcases.",
    image:
      "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1200&q=80",
  },
];

const featureCards = [
  {
    icon: Building2,
    title: "Resource Management",
    text: "Track rooms, equipment, and facilities with clear availability, images, and operational status.",
  },
  {
    icon: CalendarIcon,
    title: "Booking Workflow",
    text: "Submit requests, detect conflicts, approve quickly, and keep a full audit trail of usage.",
  },
  {
    icon: Ticket,
    title: "Support & Maintenance",
    text: "Handle campus incidents with technician routing, ticket comments, and resolution visibility.",
  },
  {
    icon: Bell,
    title: "Smart Notifications",
    text: "Keep every stakeholder informed about bookings, tickets, approvals, and urgent updates.",
  },
];

const galleryImages = [
  studentsImage,
  "https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80",
  logoOneImage,
  logoTwoImage,
];

const NAV_MODE_STORAGE_KEY = "sum_nav_mode";

function buildImageUrl(path) {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  return `http://localhost:8085/${String(path).replace(/^\/+/, "")}`;
}

function CalendarIcon(props) {
  return <BookOpen {...props} />;
}

export default function LandingPage({ user, onLogout, theme = "light", onToggleTheme }) {
  const isAuthenticated = Boolean(user);
  const canManageResources = (user?.role || "").toUpperCase() === "ADMIN";
  const [unreadCount, setUnreadCount] = useState(0);
  const [navOpen, setNavOpen] = useState(false);
  const [navMode, setNavMode] = useState(() => localStorage.getItem(NAV_MODE_STORAGE_KEY) || "top");
  const [featuredResources, setFeaturedResources] = useState([]);

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

  useEffect(() => {
    localStorage.setItem(NAV_MODE_STORAGE_KEY, navMode);
  }, [navMode]);

  useEffect(() => {
    let isMounted = true;
    const loadResources = async () => {
      try {
        const page = await resourceApi.list({ size: 6, sortBy: "createdAt", sortDir: "desc" });
        if (isMounted) {
          setFeaturedResources(Array.isArray(page?.content) ? page.content.slice(0, 6) : []);
        }
      } catch (error) {
        if (isMounted) setFeaturedResources([]);
      }
    };

    loadResources();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleNavItemClick = () => {
    if (typeof window !== "undefined" && window.innerWidth <= 900) {
      setNavOpen(false);
    }
  };

  const renderTopNavLinks = () =>
    isAuthenticated ? (
      <>
        <NavLink to="/" end className={({ isActive }) => (isActive ? "landingTopNavLink active" : "landingTopNavLink")} onClick={handleNavItemClick}>
          Home
        </NavLink>
        {user?.role === "ADMIN" ? (
          <NavLink to="/admin" className={({ isActive }) => (isActive ? "landingTopNavLink active" : "landingTopNavLink")} onClick={handleNavItemClick}>
            Admin Dashboard
          </NavLink>
        ) : null}
        <NavLink to="/resources" className={({ isActive }) => (isActive ? "landingTopNavLink active" : "landingTopNavLink")} onClick={handleNavItemClick}>
          Resources
        </NavLink>
        <NavLink to="/bookings" className={({ isActive }) => (isActive ? "landingTopNavLink active" : "landingTopNavLink")} onClick={handleNavItemClick}>
          Bookings
        </NavLink>
        <NavLink to="/tickets" className={({ isActive }) => (isActive ? "landingTopNavLink active" : "landingTopNavLink")} onClick={handleNavItemClick}>
          Tickets
        </NavLink>
        <NavLink to="/notifications" className={({ isActive }) => (isActive ? "landingTopNavLink active" : "landingTopNavLink")} onClick={handleNavItemClick}>
          <span>Notifications</span>
          {unreadCount > 0 ? (
            <span className="landingTopNavBadge">{unreadCount > 99 ? "99+" : unreadCount}</span>
          ) : null}
        </NavLink>
        <NavLink to="/profile" className={({ isActive }) => (isActive ? "landingTopNavLink active" : "landingTopNavLink")} onClick={handleNavItemClick}>
          Profile
        </NavLink>
        {user?.role === "ADMIN" ? (
          <NavLink to="/manage-users" className={({ isActive }) => (isActive ? "landingTopNavLink active" : "landingTopNavLink")} onClick={handleNavItemClick}>
            Manage Users
          </NavLink>
        ) : null}
        {user?.role === "ADMIN" ? (
          <NavLink to="/settings" className={({ isActive }) => (isActive ? "landingTopNavLink active" : "landingTopNavLink")} onClick={handleNavItemClick}>
            Settings
          </NavLink>
        ) : null}
      </>
    ) : (
      <>
        <a href="#home" className="landingTopNavLink" onClick={handleNavItemClick}>
          Home
        </a>
        <a href="#about" className="landingTopNavLink" onClick={handleNavItemClick}>
          About Us
        </a>
        <a href="#facilities" className="landingTopNavLink" onClick={handleNavItemClick}>
          Facilities
        </a>
        <a href="#resources-showcase" className="landingTopNavLink" onClick={handleNavItemClick}>
          Resources
        </a>
        <a href="#contact" className="landingTopNavLink" onClick={handleNavItemClick}>
          Contact
        </a>
      </>
    );

  const renderNavLinks = () =>
    isAuthenticated ? (
      <>
        <NavLink to="/" end className={({ isActive }) => (isActive ? "landingNavLink active" : "landingNavLink")} onClick={handleNavItemClick}>
          <img src={homeIcon} alt="" className="landingNavIcon" />
          <span className="landingNavLabel">Home</span>
        </NavLink>
        {user?.role === "ADMIN" ? (
          <NavLink to="/admin" className={({ isActive }) => (isActive ? "landingNavLink active" : "landingNavLink")} onClick={handleNavItemClick}>
            <img src={adminIcon} alt="" className="landingNavIcon" />
            <span className="landingNavLabel">Admin Dashboard</span>
          </NavLink>
        ) : null}
        <NavLink to="/resources" className={({ isActive }) => (isActive ? "landingNavLink active" : "landingNavLink")} onClick={handleNavItemClick}>
          <img src={resourcesIcon} alt="" className="landingNavIcon" />
          <span className="landingNavLabel">Resources</span>
        </NavLink>
        <NavLink to="/bookings" className={({ isActive }) => (isActive ? "landingNavLink active" : "landingNavLink")} onClick={handleNavItemClick}>
          <img src={bookingsIcon} alt="" className="landingNavIcon" />
          <span className="landingNavLabel">Bookings</span>
        </NavLink>
        <NavLink to="/tickets" className={({ isActive }) => (isActive ? "landingNavLink active" : "landingNavLink")} onClick={handleNavItemClick}>
          <img src={ticketsIcon} alt="" className="landingNavIcon" />
          <span className="landingNavLabel">Tickets</span>
        </NavLink>
        <NavLink to="/notifications" className={({ isActive }) => (isActive ? "landingNavLink active" : "landingNavLink")} onClick={handleNavItemClick}>
          <span className="landingNavIconWrap">
            <img src={notificationsIcon} alt="" className="landingNavIcon" />
            {unreadCount > 0 ? (
              <span className="landingNotifyBadge">{unreadCount > 99 ? "99+" : unreadCount}</span>
            ) : null}
          </span>
          <span className="landingNavLabel">Notifications</span>
        </NavLink>
        <NavLink to="/profile" className={({ isActive }) => (isActive ? "landingNavLink active" : "landingNavLink")} onClick={handleNavItemClick}>
          <img src={profileIcon} alt="" className="landingNavIcon" />
          <span className="landingNavLabel">Profile</span>
        </NavLink>
        {user?.role === "ADMIN" ? (
          <NavLink to="/manage-users" className={({ isActive }) => (isActive ? "landingNavLink active" : "landingNavLink")} onClick={handleNavItemClick}>
            <img src={profileIcon} alt="" className="landingNavIcon" />
            <span className="landingNavLabel">Manage Users</span>
          </NavLink>
        ) : null}
        {user?.role === "ADMIN" ? (
          <NavLink to="/settings" className={({ isActive }) => (isActive ? "landingNavLink active" : "landingNavLink")} onClick={handleNavItemClick}>
            <img src={settingsIcon} alt="" className="landingNavIcon" />
            <span className="landingNavLabel">Settings</span>
          </NavLink>
        ) : null}
      </>
    ) : (
      <>
        <a href="#home" className="landingNavLink" onClick={handleNavItemClick}>Home</a>
        <a href="#about" className="landingNavLink" onClick={handleNavItemClick}>About Us</a>
        <a href="#facilities" className="landingNavLink" onClick={handleNavItemClick}>Facilities</a>
        <a href="#resources-showcase" className="landingNavLink" onClick={handleNavItemClick}>Resources</a>
        <a href="#contact" className="landingNavLink" onClick={handleNavItemClick}>Contact</a>
      </>
    );

  return (
    <div className={`landingPage ${navMode === "side" ? "landingPageSide" : "landingPageTop"}`}>
      <header className="landingTopBar">
        <Link to="/" className="landingWordmark" aria-label="Campus Velora home">
          Campus Velora
        </Link>
        <nav className="landingTopNav" aria-label="Top navigation">
          {renderTopNavLinks()}
        </nav>
        <div className="landingTopActions">
          <button
            type="button"
            onClick={() => setNavMode((current) => (current === "side" ? "top" : "side"))}
            className="landingIconBtn"
            aria-label={navMode === "side" ? "Switch to top navigation" : "Switch to sidebar navigation"}
            title={navMode === "side" ? "Top navigation" : "Sidebar navigation"}
          >
            {navMode === "side" ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
          </button>
          <button
            type="button"
            onClick={onToggleTheme}
            className="landingIconBtn"
            aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
            title={theme === "dark" ? "Light theme" : "Dark theme"}
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          {isAuthenticated ? (
            <button type="button" onClick={onLogout} className="landingBtn landingBtnPrimary landingLogoutBtn">
              <LogOut size={16} />
              <span>Logout</span>
            </button>
          ) : (
            <>
              <Link to="/login" className="landingBtn landingBtnGhost">Login</Link>
              <Link to="/signup" className="landingBtn landingBtnPrimary">Sign Up</Link>
            </>
          )}
        </div>
      </header>

      {navMode === "side" ? (
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

        <nav className="landingNav" aria-label="Landing navigation">{renderNavLinks()}</nav>

        <div className="landingAuthActions">
          <button
            type="button"
            onClick={() => setNavMode("top")}
            className="landingIconBtn"
            aria-label="Switch to top navigation"
            title="Top navigation"
          >
            <PanelLeftClose size={18} />
          </button>
          <button
            type="button"
            onClick={onToggleTheme}
            className="landingIconBtn"
            aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
            title={theme === "dark" ? "Light theme" : "Dark theme"}
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          {isAuthenticated ? (
            <button type="button" onClick={onLogout} className="landingBtn landingBtnPrimary landingLogoutBtn">
              <LogOut size={16} />
              <span>Logout</span>
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
      ) : null}

      <main className="landingContent">
        <div className="landingContainer">
          <section id="home" className="landingHeroSection landingHeroRich">
            <div className="landingHeroMedia">
              <img
                src={heroCampusImage}
                alt="Modern university campus"
              />
            </div>
            <div className="landingHeroContent">
              <div className="landingEcoBadge">
                <Sparkles size={12} />
                PREMIUM DIGITAL CAMPUS EXPERIENCE
              </div>
              <h1>
                One vibrant platform for a <span>smarter university</span>
              </h1>
              <p>
                Campus Velora brings together facilities, resource booking, maintenance, support, analytics,
                and student services in a polished digital environment built for modern academic life.
              </p>
              <div className="landingHeroActions">
                {isAuthenticated ? (
                  <>
                    <Link to="/resources" className="landingBtn landingBtnPrimary">
                      {canManageResources ? "Manage Resources" : "Explore Resources"}
                    </Link>
                    <Link to="/bookings" className="landingBtn landingBtnGhost">
                      Open Bookings
                    </Link>
                  </>
                ) : (
                  <>
                    <Link to="/signup" className="landingBtn landingBtnPrimary">
                      Get Started
                    </Link>
                    <Link to="/login" className="landingBtn landingBtnGhost">
                      Sign In
                    </Link>
                  </>
                )}
              </div>
            </div>

            
          </section>
          <br></br>
          <br></br>
          <br></br>
          <br></br>
          <section className="landingStatsStrip">
            {campusStats.map((stat) => (
              <article key={stat.label} className="landingStatPill">
                <strong>{stat.value}</strong>
                <span>{stat.label}</span>
              </article>
            ))}
          </section>

          <section id="about" className="landingSection landingStorySection">
            <div className="landingStoryGrid">
              <div className="landingStoryCopy">
                <span className="landingSectionEyebrow">About Us</span>
                <h2>Built for campuses that want operations to feel as polished as their reputation.</h2>
                <p>
                  We designed Campus Velora to remove friction from daily academic operations. Instead of
                  disconnected tools, manual approvals, and missing information, the platform creates one
                  high-visibility workflow for administrators, lecturers, students, and support teams.
                </p>
                <div className="landingStoryList">
                  <div><ShieldCheck size={16} /> Secure approval workflows</div>
                  <div><Trees size={16} /> Sustainable digital-first operations</div>
                  <div><Zap size={16} /> Faster service delivery across departments</div>
                </div>
              </div>
              <div className="landingStoryVisual">
                <img
                  src="https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?auto=format&fit=crop&w=1400&q=80"
                  alt="Students collaborating on campus"
                />
              </div>
            </div>
          </section>

          <section id="facilities" className="landingSection landingSectionMuted">
            <div className="landingSectionHeader landingSectionHeaderCentered">
              <div>
                <span className="landingSectionEyebrow">Facilities We Give</span>
                <h2>Designed around the spaces students and staff use every day.</h2>
              </div>
              <p>
                From formal classrooms to creative collaborative zones, the system makes every facility easier to
                discover, reserve, and maintain.
              </p>
            </div>
            <div className="landingFacilityGrid">
              {facilities.map((facility) => (
                <article key={facility.title} className="landingFacilityCard">
                  <img src={facility.image} alt={facility.title} className="landingFacilityImage" />
                  <div className="landingFacilityBody">
                    <h3>{facility.title}</h3>
                    <p>{facility.text}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section id="resources-showcase" className="landingSection">
            <div className="landingSectionHeader landingSectionHeaderCentered">
              <div>
                <span className="landingSectionEyebrow">Featured Resources</span>
                <h2>See what is available across campus right now.</h2>
              </div>
              <p>
                The homepage now brings real resource inventory into view so users can discover spaces faster.
              </p>
            </div>
            <div className="landingResourceGrid">
              {featuredResources.length === 0 ? (
                <article className="landingResourceCard">
                  <div className="landingResourceFallback">No resources available yet.</div>
                </article>
              ) : (
                featuredResources.map((resource) => (
                  <article key={resource.id} className="landingResourceCard">
                    {resource.imageUrl ? (
                      <img
                        src={buildImageUrl(resource.imageUrl)}
                        alt={resource.name}
                        className="landingResourceImage"
                      />
                    ) : (
                      <div className="landingResourceFallback">{resource.type}</div>
                    )}
                    <div className="landingResourceBody">
                      <div className="landingResourceTop">
                        <h3>{resource.name}</h3>
                        <span className={`landingResourceStatus ${String(resource.status || "").toLowerCase()}`}>
                          {resource.status}
                        </span>
                      </div>
                      <p>{resource.location}</p>
                      <div className="landingResourceMeta">
                        <span>Type: {resource.type}</span>
                        <span>Capacity: {resource.capacity}</span>
                      </div>
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>

          <section className="landingSection">
            <div className="landingSectionHeader landingSectionHeaderCentered">
              <div>
                <span className="landingSectionEyebrow">Core Modules</span>
                <h2>Everything important in one clear system.</h2>
              </div>
              <p>
                The product combines resource visibility, approvals, ticket handling, notifications, and reporting
                without making the workflow feel heavy.
              </p>
            </div>
            <div className="landingFeatureGrid landingFeatureGridWide">
              {featureCards.map((card) => {
                const Icon = card.icon;
                return (
                  <article key={card.title} className="landingFeatureCard">
                    <div className="landingFeatureIcon">
                      <Icon size={18} />
                    </div>
                    <h3>{card.title}</h3>
                    <p>{card.text}</p>
                  </article>
                );
              })}
            </div>
          </section>

          <section className="landingSection landingGallerySection">
            <div className="landingSectionHeader landingSectionHeaderCentered">
              <div>
                <span className="landingSectionEyebrow">Campus Gallery</span>
                <h2>A more visual, more engaging university web experience.</h2>
              </div>
              <p>
                We use imagery to make the platform feel real, premium, and connected to the campus environment.
              </p>
            </div>
            <div className="landingGalleryGrid">
              {galleryImages.map((src, index) => (
                <img key={src} src={src} alt={`Campus life ${index + 1}`} className="landingGalleryImage" />
              ))}
            </div>
          </section>

          <section className="landingSection landingSectionMuted landingQuickActionBand">
            <div className="landingQuickActionText">
              <span className="landingSectionEyebrow">Why People Stay With It</span>
              <h2>Because it feels modern, useful, and easy to trust.</h2>
              <p>
                Students get faster booking responses. Admins get cleaner visibility. Support teams get structured
                workflows. Leadership gets measurable analytics.
              </p>
            </div>
            <div className="landingQuickActionCards">
              <article className="landingQuickActionCard">
                <GraduationCap size={18} />
                <strong>Student-friendly workflows</strong>
                <span>Clear forms, status badges, and easy history tracking.</span>
              </article>
              <article className="landingQuickActionCard">
                <Building2 size={18} />
                <strong>Admin-ready controls</strong>
                <span>Strong oversight for facilities, users, analytics, and approvals.</span>
              </article>
              <article className="landingQuickActionCard">
                <Sparkles size={18} />
                <strong>Presentation-quality UI</strong>
                <span>A more eye-catching design for demonstrations and academic review.</span>
              </article>
            </div>
          </section>

          <footer id="contact" className="landingFooter landingContactFooter">
            <div className="landingSectionHeader">
              <div>
                <span className="landingSectionEyebrow">Contact Us</span>
                <h2>Need help from the campus operations team?</h2>
              </div>
              <p>
                Reach out for onboarding, booking support, maintenance follow-up, or institutional deployment.
              </p>
            </div>
            <div className="landingContactGrid">
              <article className="landingContactCard">
                <Mail size={18} />
                <strong>Email</strong>
                <span>{campusDetails.email}</span>
              </article>
              <article className="landingContactCard">
                <Phone size={18} />
                <strong>Phone</strong>
                <span>{campusDetails.phone}</span>
              </article>
              <article className="landingContactCard">
                <MapPin size={18} />
                <strong>Office</strong>
                <span>{campusDetails.addressLines.join(", ")}</span>
              </article>
            </div>
            <CampusFooter variant="landing" />
          </footer>
        </div>
      </main>
    </div>
  );
}

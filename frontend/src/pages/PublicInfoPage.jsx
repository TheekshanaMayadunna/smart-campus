import { Link, NavLink } from "react-router-dom";
import BrandLogo from "../components/common/BrandLogo.jsx";
import "./landing.css";
import "./public-info.css";

const PAGE_DATA = {
  about: {
    title: "About Campus Velora",
    subtitle: "A connected digital campus experience",
    lead:
      "Campus Velora is a unified platform that simplifies how students, lecturers, and campus staff interact with resources, bookings, and support services.",
    cards: [
      {
        title: "Mission",
        text: "Reduce operational friction across departments with one connected workflow.",
      },
      {
        title: "Vision",
        text: "Create a responsive, transparent, and student-friendly digital campus.",
      },
      {
        title: "Impact",
        text: "Faster approvals, cleaner communication, and fewer manual admin tasks.",
      },
    ],
  },
  features: {
    title: "Platform Features",
    subtitle: "Designed for everyday campus workflows",
    lead:
      "From resource planning to issue tracking, each module is built to improve visibility and speed up decision making.",
    cards: [
      {
        title: "Resource Center",
        text: "Browse and manage rooms, labs, and assets with clear availability.",
      },
      {
        title: "Booking Workflows",
        text: "Submit requests, get status updates, and keep approvals transparent.",
      },
      {
        title: "Ticket Resolution",
        text: "Track incidents from report to closure with actionable comments.",
      },
      {
        title: "Live Notifications",
        text: "Stay informed about status changes, approvals, and support updates.",
      },
    ],
  },
  contact: {
    title: "Contact & Support",
    subtitle: "We are here to help your campus",
    lead:
      "Need assistance with your account, bookings, or tickets? Reach out to the university IT support team and we will guide you.",
    cards: [
      {
        title: "Support Email",
        text: "support@campusvelora.edu",
      },
      {
        title: "Support Hotline",
        text: "+94 11 234 5678",
      },
      {
        title: "Office Hours",
        text: "Monday to Friday, 8:30 AM to 5:00 PM",
      },
    ],
  },
};

export default function PublicInfoPage({ pageKey = "about" }) {
  const page = PAGE_DATA[pageKey] || PAGE_DATA.about;

  return (
    <div className="landingPage publicInfoPage">
      <aside className="landingSideNav">
        <Link to="/" className="landingBrand" aria-label="Campus Velora home">
          <BrandLogo className="landingBrandLogo" />
        </Link>

        <nav className="landingNav" aria-label="Public navigation">
          <NavLink
            to="/"
            end
            className={({ isActive }) => (isActive ? "landingNavLink active" : "landingNavLink")}
          >
            Home
          </NavLink>
          <NavLink
            to="/about"
            className={({ isActive }) => (isActive ? "landingNavLink active" : "landingNavLink")}
          >
            About Us
          </NavLink>
          <NavLink
            to="/features"
            className={({ isActive }) => (isActive ? "landingNavLink active" : "landingNavLink")}
          >
            Features
          </NavLink>
          <NavLink
            to="/contact"
            className={({ isActive }) => (isActive ? "landingNavLink active" : "landingNavLink")}
          >
            Contact
          </NavLink>
        </nav>

        <div className="landingAuthActions">
          <Link to="/login" className="landingBtn landingBtnGhost">
            Login
          </Link>
          <Link to="/signup" className="landingBtn landingBtnPrimary">
            Sign Up
          </Link>
        </div>
      </aside>

      <main className="landingContent publicInfoMain">
        <section className="publicInfoHero">
          <span className="publicInfoBadge">{page.subtitle}</span>
          <h1>{page.title}</h1>
          <p>{page.lead}</p>
        </section>

        <section className="publicInfoGrid">
          {page.cards.map((card) => (
            <article key={card.title} className="publicInfoCard">
              <h3>{card.title}</h3>
              <p>{card.text}</p>
            </article>
          ))}
        </section>
      </main>
    </div>
  );
}

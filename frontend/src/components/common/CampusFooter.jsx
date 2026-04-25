import "./campusFooter.css";

import BrandLogo from "./BrandLogo.jsx";
import { campusDetails } from "../../config/campusDetails.js";
import { Link } from "react-router-dom";

export default function CampusFooter({
  className = "",
  variant = "default",
  showQuickLinks = true,
  linkMode,
}) {
  const year = new Date().getFullYear();
  const footerClassName = ["campusFooter", `campusFooter--${variant}`, className]
    .filter(Boolean)
    .join(" ");
  const resolvedLinkMode = linkMode || (variant === "landing" ? "hash" : "router");

  return (
    <div className={footerClassName} aria-label="Campus footer">
      <div className="campusFooterInner">
        <div className="campusFooterBrand">
          <BrandLogo className="campusFooterLogo" />
          <div className="campusFooterBrandText">
            <strong>{campusDetails.name}</strong>
            <span>{campusDetails.tagline}</span>
          </div>
        </div>

        <div className="campusFooterCols">
          <div className="campusFooterCol">
            <h3>Campus Details</h3>
            <ul>
              {campusDetails.addressLines.map((line) => (
                <li key={line}>{line}</li>
              ))}
              <li>{campusDetails.phone}</li>
              <li>{campusDetails.email}</li>
            </ul>
          </div>

          {showQuickLinks ? (
            <div className="campusFooterCol">
              <h3>Quick Links</h3>
              <ul>
                {resolvedLinkMode === "hash" ? (
                  <>
                    <li>
                      <a href="#home">Home</a>
                    </li>
                    <li>
                      <a href="#about">About</a>
                    </li>
                    <li>
                      <a href="#facilities">Facilities</a>
                    </li>
                    <li>
                      <a href="#resources-showcase">Resources</a>
                    </li>
                    <li>
                      <a href="#contact">Contact</a>
                    </li>
                  </>
                ) : (
                  <>
                    <li>
                      <Link to="/">Home</Link>
                    </li>
                    <li>
                      <Link to="/resources">Resources</Link>
                    </li>
                    <li>
                      <Link to="/bookings">Bookings</Link>
                    </li>
                    <li>
                      <Link to="/tickets">Tickets</Link>
                    </li>
                    <li>
                      <Link to="/profile">Profile</Link>
                    </li>
                  </>
                )}
              </ul>
            </div>
          ) : null}
        </div>
      </div>

      <div className="campusFooterBottom">
        <span>
          © {year} {campusDetails.name}. All rights reserved.
        </span>
      </div>
    </div>
  );
}

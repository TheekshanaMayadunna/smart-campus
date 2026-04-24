import React from "react";
import {
  Bell,
  Leaf,
  Bolt,
  CloudCog,
  Gauge,
  Search,
  Settings,
  Sparkles,
  Users,
} from "lucide-react";
import ResourceLayout from "../components/resource/ResourceLayout.jsx";
import "./HomePage.css";

export default function HomePage({ onLogout, user, onNavigate }) {
  return (
    <ResourceLayout onLogout={onLogout} user={user}>
      <div className="homePage">
        <div className="homeTopBar">
          <div className="homeTabs">
            <button className="homeTab active">Dashboard</button>
            <button className="homeTab">Events</button>
            <button className="homeTab">Campus Map</button>
          </div>

          <div className="homeActions">
            <label className="homeSearch">
              <Search size={16} />
              <input type="text" placeholder="Search facilities..." />
            </label>
            <button className="iconBtn" aria-label="Notifications">
              <Bell size={17} />
            </button>
            <button className="iconBtn" aria-label="Settings">
              <Settings size={17} />
            </button>
            <div className="homeAvatar">{user?.name?.charAt(0).toUpperCase() || "U"}</div>
          </div>
        </div>

        <section className="heroCard">
          <div className="heroTag">
            <Leaf size={12} />
            ECO-SMART CAMPUS OS
          </div>
          <h1>
            Build a Greener Campus <span>Smarter</span>
          </h1>
          <p>
            Blend academic excellence with sustainability-first technology. Centralize
            bookings, resources, and student life in one low-friction digital ecosystem.
          </p>
          <div className="heroButtons">
            <button onClick={() => onNavigate?.("Resources")} className="primaryBtn">
              View Resources
            </button>
            <button onClick={() => onNavigate?.("Bookings")} className="ghostBtn">
              View Bookings
            </button>
          </div>

          <div className="occupancyCard">
            <div className="occupancyHeader">
              <span>Green Library Hub</span>
              <span className="liveDot">Live</span>
            </div>
            <div className="occupancyBody">
              <div>
                <div className="occupancyValue">84%</div>
                <div className="occupancyLabel">Occupancy Rate</div>
              </div>
              <Gauge className="occupancyIcon" />
            </div>
            <div className="occupancyFoot">Energy-efficient mode active now</div>
          </div>
        </section>

        <section className="quickCards">
          <article className="quickCard">
            <div className="quickIcon blue">
              <Bolt size={16} />
            </div>
            <h3>Quick Access</h3>
            <p>Instantly book study rooms, labs, or creative spaces with a single tap.</p>
          </article>
          <article className="quickCard">
            <div className="quickIcon teal">
              <CloudCog size={16} />
            </div>
            <h3>Resource Sync</h3>
            <p>All course materials and loans synced digitally to reduce paper waste.</p>
          </article>
          <article className="quickCard">
            <div className="quickIcon purple">
              <Sparkles size={16} />
            </div>
            <h3>Smart Campus</h3>
            <p>IoT updates optimize facility usage, energy consumption, and campus flow.</p>
          </article>
        </section>

        <section className="visionSection">
          <div className="visionText">
            <span className="visionLabel">OUR VISION</span>
            <h2>Redefining the Academic Experience Through Tech</h2>
            <p>
              Campus Velora is more than just an administrative tool; it is a digital
              transformation partner for modern and climate-conscious institutions.
            </p>
            <ul>
              <li>
                <Users size={15} /> Trusted by 50+ institutions
              </li>
              <li>
                <Sparkles size={15} /> Innovation first
              </li>
            </ul>
          </div>

          <div className="visionTiles">
            <div className="tile soft">
              <div className="tileNumber">99.9%</div>
              <div className="tileText">Platform Uptime</div>
            </div>
            <div className="tile gradient">25k+ Active Daily Users</div>
            <div className="tile dark">Future-Ready Learning Spaces</div>
          </div>
        </section>
      </div>
    </ResourceLayout>
  );
}

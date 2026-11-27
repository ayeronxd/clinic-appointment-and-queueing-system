import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import {
  FiTv, FiCalendar, FiPlusSquare, FiClock, FiCheckSquare,
  FiFileText, FiUsers, FiSettings, FiLogOut, FiMenu, FiX,
  FiUser, FiGrid, FiUserPlus,
} from "react-icons/fi";

/**
 * Sidebar Component
 * Fixed left-hand navigation — collapses to overlay on mobile.
 * Rendered only when user is logged in. Auth pages skip this.
 */
export default function Sidebar() {
  const { user, profile, role, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (path) => location.pathname === path;

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  const initials = profile?.full_name
    ? profile.full_name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
    : "?";

  function NavLink({ to, icon: Icon, label }) {
    return (
      <Link
        to={to}
        className={`sidebar-link ${isActive(to) ? "active" : ""}`}
        onClick={() => setMobileOpen(false)}
      >
        <span className="sidebar-link-icon"><Icon /></span>
        {label}
      </Link>
    );
  }

  return (
    <>
      {/* Mobile overlay backdrop */}
      {mobileOpen && (
        <div className="sidebar-overlay" onClick={() => setMobileOpen(false)} />
      )}

      {/* Mobile top bar */}
      <div className="app-topbar">
        <button className="topbar-menu-btn" onClick={() => setMobileOpen(true)}>
          <FiMenu />
        </button>
        <span className="topbar-title">ClinicCare CAQS</span>
      </div>

      {/* Sidebar */}
      <aside className={`app-sidebar ${mobileOpen ? "mobile-open" : ""}`}>
        {/* Brand */}
        <Link to="/" className="sidebar-brand" onClick={() => setMobileOpen(false)}>
          <div className="sidebar-brand-icon">✚</div>
          <div>
            <div className="sidebar-brand-text">ClinicCare</div>
            <div className="sidebar-brand-sub">CAQS</div>
          </div>
        </Link>

        {/* Navigation */}
        <nav className="sidebar-nav">
          {/* Always visible */}
          <div className="sidebar-section-label">General</div>
          <NavLink to="/queue" icon={FiTv} label="Live Queue" />

          {/* Patient links */}
          {user && role === "patient" && (
            <>
              <div className="sidebar-section-label">Patient</div>
              <NavLink to="/dashboard" icon={FiCalendar} label="My Appointments" />
              <NavLink to="/book" icon={FiPlusSquare} label="Book Appointment" />
            </>
          )}

          {/* Staff links */}
          {user && (role === "staff" || role === "admin") && (
            <>
              <div className="sidebar-section-label">Clinic Desk</div>
              <NavLink to="/staff/today" icon={FiGrid} label="Today's Roster" />
              <NavLink to="/staff/check-in" icon={FiCheckSquare} label="Check-in" />
              <NavLink to="/staff/walk-in" icon={FiUserPlus} label="Walk-in" />
              <NavLink to="/staff/queue-control" icon={FiClock} label="Queue Control" />
              <NavLink to="/staff/reports" icon={FiFileText} label="Daily Report" />
            </>
          )}

          {/* Admin links */}
          {user && role === "admin" && (
            <>
              <div className="sidebar-section-label">Administration</div>
              <NavLink to="/admin/doctors" icon={FiUser} label="Doctors & Schedules" />
              <NavLink to="/admin/staff" icon={FiUsers} label="Staff Accounts" />
            </>
          )}
        </nav>

        {/* Footer — user info + logout */}
        <div className="sidebar-footer">
          <div className="sidebar-user" onClick={handleLogout} title="Click to sign out">
            <div className="sidebar-avatar">{initials}</div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{profile?.full_name || user?.email}</div>
              <div className="sidebar-user-role">{role} · Sign out</div>
            </div>
            <FiLogOut style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.9rem", flexShrink: 0 }} />
          </div>
        </div>
      </aside>
    </>
  );
}

import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import ClinicModeToggle from "./ClinicModeToggle";
import MobileDrawer from "./MobileDrawer";
import {
  FiTv, FiCalendar, FiPlusSquare, FiGrid, FiCheckSquare,
  FiUserPlus, FiClock, FiFileText, FiUsers, FiUser, FiLogOut, FiMenu
} from "react-icons/fi";

export default function Navbar({ onOpenDrawer }) {
  const { user, profile, role, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [internalDrawer, setInternalDrawer] = useState(false);

  const isActive = (path) => location.pathname === path;
  const handleOpenDrawer = onOpenDrawer || (() => setInternalDrawer(true));

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  const initials = profile?.full_name
    ? profile.full_name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
    : "U";

  function NavLink({ to, icon: Icon, label }) {
    return (
      <Link to={to} className={`nav-link ${isActive(to) ? "active" : ""}`}>
        <Icon style={{ fontSize: "1rem" }} />
        <span>{label}</span>
      </Link>
    );
  }

  return (
    <>
      <header className="app-navbar">
        <div className="navbar-container">
          {/* Brand */}
          <Link to="/" className="nav-brand">
            <div className="nav-brand-icon">✚</div>
            <div>
              <div className="nav-brand-name">ClinicCare</div>
              <span className="nav-brand-sub">Queue & Appointments</span>
            </div>
          </Link>

          {/* Desktop Navigation Links (Hidden on Mobile) */}
          <nav className="nav-links desktop-only-nav">
            <NavLink to="/queue" icon={FiTv} label="Live Queue" />

            {user && role === "patient" && (
              <>
                <div className="nav-divider" />
                <NavLink to="/dashboard" icon={FiCalendar} label="Appointments" />
                <NavLink to="/book" icon={FiPlusSquare} label="Book Visit" />
              </>
            )}

            {user && (role === "staff" || role === "admin") && (
              <>
                <div className="nav-divider" />
                <NavLink to="/staff/today" icon={FiGrid} label="Roster" />
                <NavLink to="/staff/check-in" icon={FiCheckSquare} label="Check-in" />
                <NavLink to="/staff/walk-in" icon={FiUserPlus} label="Walk-in" />
                <NavLink to="/staff/queue-control" icon={FiClock} label="Queue" />
                <NavLink to="/staff/reports" icon={FiFileText} label="Reports" />
              </>
            )}

            {user && role === "admin" && (
              <>
                <div className="nav-divider" />
                <NavLink to="/admin/doctors" icon={FiUser} label="Doctors" />
                <NavLink to="/admin/staff" icon={FiUsers} label="Staff" />
              </>
            )}
          </nav>

          {/* User profile & Mobile Menu Trigger */}
          {user && (
            <div className="nav-user">
              {(role === "staff" || role === "admin") && (
                <div className="desktop-only-user">
                  <ClinicModeToggle variant="navbar" />
                </div>
              )}

              {/* Desktop User Info */}
              <div className="nav-user-badge desktop-only-user">
                <div className="nav-avatar">{initials}</div>
                <div className="nav-user-details">
                  <span className="nav-user-name">{profile?.full_name?.split(" ")[0] || "User"}</span>
                  <span className="nav-user-role">{role}</span>
                </div>
              </div>

              <button className="nav-logout-btn desktop-only-user" onClick={handleLogout} title="Sign out">
                <FiLogOut />
                <span>Sign out</span>
              </button>

              {/* Mobile Menu Button (< 768px) */}
              <button
                type="button"
                className="mobile-menu-trigger"
                onClick={handleOpenDrawer}
                aria-label="Open navigation menu"
              >
                <FiMenu style={{ fontSize: "1.2rem" }} />
                <span>Menu</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Fallback Mobile Navigation Drawer if not handled by parent */}
      {!onOpenDrawer && (
        <MobileDrawer isOpen={internalDrawer} onClose={() => setInternalDrawer(false)} />
      )}
    </>
  );
}

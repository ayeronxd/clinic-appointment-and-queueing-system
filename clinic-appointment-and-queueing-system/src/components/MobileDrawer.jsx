import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import ClinicModeToggle from "./ClinicModeToggle";
import {
  FiX, FiTv, FiCalendar, FiPlusSquare, FiGrid, FiCheckSquare,
  FiUserPlus, FiClock, FiFileText, FiUsers, FiUser, FiLogOut, FiShield
} from "react-icons/fi";

export default function MobileDrawer({ isOpen, onClose }) {
  const { user, profile, role, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  if (!isOpen) return null;

  const isActive = (path) => location.pathname === path;

  async function handleLogout() {
    onClose();
    await logout();
    navigate("/login");
  }

  function DrawerLink({ to, icon: Icon, label }) {
    const active = isActive(to);
    return (
      <Link
        to={to}
        onClick={onClose}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          padding: "13px 16px",
          borderRadius: 10,
          background: active ? "var(--accent-soft)" : "transparent",
          color: active ? "var(--accent)" : "var(--text-primary)",
          fontWeight: active ? 700 : 500,
          fontSize: "0.92rem",
          minHeight: 46,
          transition: "all 0.15s ease",
          textDecoration: "none",
        }}
      >
        <Icon style={{ fontSize: "1.15rem", flexShrink: 0 }} />
        <span>{label}</span>
      </Link>
    );
  }

  const initials = profile?.full_name
    ? profile.full_name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
    : "U";

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999 }}>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(10, 37, 64, 0.65)",
          backdropFilter: "blur(3px)",
        }}
      />

      {/* Drawer Panel */}
      <div
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          bottom: 0,
          width: "min(320px, 85vw)",
          background: "#ffffff",
          display: "flex",
          flexDirection: "column",
          boxShadow: "-8px 0 30px rgba(0, 0, 0, 0.25)",
          zIndex: 1,
          overflowY: "auto",
        }}
      >
        {/* Drawer Header */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "18px 20px",
          borderBottom: "1px solid var(--border)",
          background: "var(--navy)",
          color: "#ffffff",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 30, height: 30, borderRadius: 8,
              background: "rgba(255,255,255,0.15)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontWeight: 800, fontSize: "0.95rem"
            }}>✚</div>
            <span style={{ fontWeight: 800, fontSize: "1.05rem" }}>ClinicCare</span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close menu"
            style={{
              background: "rgba(255,255,255,0.1)",
              border: "none",
              color: "#ffffff",
              width: 36,
              height: 36,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.2rem",
              cursor: "pointer",
            }}
          >
            <FiX />
          </button>
        </div>

        {/* User Card */}
        {user && (
          <div style={{
            padding: "16px 20px",
            background: "#f8fafc",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}>
            <div style={{
              width: 42, height: 42, borderRadius: "50%",
              background: "var(--navy)", color: "#ffffff",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontWeight: 700, fontSize: "0.9rem", flexShrink: 0
            }}>
              {initials}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, color: "var(--navy)", fontSize: "0.92rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {profile?.full_name || "User"}
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "capitalize" }}>
                {role} • {user.email}
              </div>
            </div>
          </div>
        )}

        {/* Clinic Status Control (for Staff / Admin) */}
        {(role === "staff" || role === "admin") && (
          <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border-xs)" }}>
            <div style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 8 }}>
              Clinic Gate Control
            </div>
            <ClinicModeToggle variant="bar" />
          </div>
        )}

        {/* Nav Links List */}
        <div style={{ padding: "12px 14px", flex: 1, display: "flex", flexDirection: "column", gap: 3 }}>
          <div style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)", padding: "8px 12px" }}>
            Navigation
          </div>

          <DrawerLink to="/queue" icon={FiTv} label="Live Queue Display" />

          {user && role === "patient" && (
            <>
              <DrawerLink to="/dashboard" icon={FiCalendar} label="My Appointments" />
              <DrawerLink to="/book" icon={FiPlusSquare} label="Book Consultation" />
            </>
          )}

          {user && (role === "staff" || role === "admin") && (
            <>
              <DrawerLink to="/staff/today" icon={FiGrid} label="Today's Roster" />
              <DrawerLink to="/staff/check-in" icon={FiCheckSquare} label="Check-in Station" />
              <DrawerLink to="/staff/walk-in" icon={FiUserPlus} label="Walk-in Registration" />
              <DrawerLink to="/staff/queue-control" icon={FiClock} label="Queue Control Station" />
              <DrawerLink to="/staff/reports" icon={FiFileText} label="Daily Clinic Reports" />
            </>
          )}

          {user && role === "admin" && (
            <>
              <div style={{ height: 1, background: "var(--border-xs)", margin: "8px 0" }} />
              <div style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)", padding: "4px 12px" }}>
                Administration
              </div>
              <DrawerLink to="/admin/doctors" icon={FiUser} label="Doctors & Slots" />
              <DrawerLink to="/admin/staff" icon={FiUsers} label="Staff Accounts" />
            </>
          )}
        </div>

        {/* Drawer Footer with Sign Out */}
        {user && (
          <div style={{ padding: 16, borderTop: "1px solid var(--border)" }}>
            <button
              onClick={handleLogout}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                padding: "12px",
                borderRadius: 10,
                border: "1px solid #fecaca",
                background: "#fef2f2",
                color: "var(--red)",
                fontWeight: 700,
                fontSize: "0.9rem",
                cursor: "pointer",
                minHeight: 46,
              }}
            >
              <FiLogOut />
              <span>Sign Out</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

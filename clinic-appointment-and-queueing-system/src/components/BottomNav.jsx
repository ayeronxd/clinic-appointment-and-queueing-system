import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";
import {
  FiTv, FiCalendar, FiPlusSquare, FiClock,
  FiCheckSquare, FiUserPlus, FiUsers, FiUser, FiMenu
} from "react-icons/fi";

/**
 * BottomNav Component
 * Provides thumb-friendly navigation bar on mobile devices (< 768px).
 * Adapts items dynamically based on user role (Patient, Staff, Admin, Guest).
 */
export default function BottomNav({ onOpenMenu }) {
  const { user, role } = useAuth();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="mobile-bottom-nav" aria-label="Mobile Bottom Navigation">
      {/* 1. Live Queue Monitor (Shared across all roles) */}
      <Link
        to="/queue"
        className={`bottom-nav-item ${isActive("/queue") ? "active" : ""}`}
      >
        <FiTv />
        <span>Queue</span>
      </Link>

      {/* 2. Patient Specific Navigation */}
      {user && role === "patient" && (
        <>
          <Link
            to="/dashboard"
            className={`bottom-nav-item ${isActive("/dashboard") ? "active" : ""}`}
          >
            <FiCalendar />
            <span>Visits</span>
          </Link>
          <Link
            to="/book"
            className={`bottom-nav-item ${isActive("/book") ? "active" : ""}`}
          >
            <FiPlusSquare />
            <span>Book</span>
          </Link>
        </>
      )}

      {/* 3. Staff Specific Navigation */}
      {user && role === "staff" && (
        <>
          <Link
            to="/staff/queue-control"
            className={`bottom-nav-item ${isActive("/staff/queue-control") ? "active" : ""}`}
          >
            <FiClock />
            <span>Desk</span>
          </Link>
          <Link
            to="/staff/check-in"
            className={`bottom-nav-item ${isActive("/staff/check-in") ? "active" : ""}`}
          >
            <FiCheckSquare />
            <span>Check-in</span>
          </Link>
          <Link
            to="/staff/walk-in"
            className={`bottom-nav-item ${isActive("/staff/walk-in") ? "active" : ""}`}
          >
            <FiUserPlus />
            <span>Walk-in</span>
          </Link>
        </>
      )}

      {/* 4. Admin Specific Navigation */}
      {user && role === "admin" && (
        <>
          <Link
            to="/staff/queue-control"
            className={`bottom-nav-item ${isActive("/staff/queue-control") ? "active" : ""}`}
          >
            <FiClock />
            <span>Desk</span>
          </Link>
          <Link
            to="/staff/check-in"
            className={`bottom-nav-item ${isActive("/staff/check-in") ? "active" : ""}`}
          >
            <FiCheckSquare />
            <span>Check-in</span>
          </Link>
          <Link
            to="/admin/doctors"
            className={`bottom-nav-item ${isActive("/admin/doctors") ? "active" : ""}`}
          >
            <FiUser />
            <span>Doctors</span>
          </Link>
        </>
      )}

      {/* 5. Unauthenticated Guest Navigation */}
      {!user && (
        <>
          <Link
            to="/book"
            className={`bottom-nav-item ${isActive("/book") ? "active" : ""}`}
          >
            <FiPlusSquare />
            <span>Book</span>
          </Link>
          <Link
            to="/login"
            className={`bottom-nav-item ${isActive("/login") ? "active" : ""}`}
          >
            <FiUser />
            <span>Sign In</span>
          </Link>
        </>
      )}

      {/* 6. More / Drawer Trigger (When Logged In) */}
      {user && (
        <button
          type="button"
          className="bottom-nav-item bottom-nav-btn"
          onClick={onOpenMenu}
          aria-label="Open full menu"
        >
          <FiMenu />
          <span>Menu</span>
        </button>
      )}
    </nav>
  );
}

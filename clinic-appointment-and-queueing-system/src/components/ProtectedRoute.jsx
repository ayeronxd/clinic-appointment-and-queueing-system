import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";
import LoadingSpinner from "./LoadingSpinner";

/**
 * ProtectedRoute Component
 * Guards routes based on authentication and allowed user roles.
 */
export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, role, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingSpinner message="Checking access..." />;
  }

  // Not logged in -> redirect to login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Role restriction check
  if (allowedRoles && !allowedRoles.includes(role)) {
    // If patient tries to access staff/admin, redirect to patient dashboard
    if (role === "patient") {
      return <Navigate to="/dashboard" replace />;
    }
    // If staff tries to access admin-only, redirect to staff today
    if (role === "staff") {
      return <Navigate to="/staff/today" replace />;
    }
    return <Navigate to="/" replace />;
  }

  return children;
}

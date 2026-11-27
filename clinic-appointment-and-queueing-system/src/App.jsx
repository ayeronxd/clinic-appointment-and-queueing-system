import React, { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./components/AuthContext";
import Navbar from "./components/Navbar";
import BottomNav from "./components/BottomNav";
import MobileDrawer from "./components/MobileDrawer";
import ProtectedRoute from "./components/ProtectedRoute";

// Patient Pages
import Login from "./pages/patient/Login";
import Register from "./pages/patient/Register";
import ForgotPassword from "./pages/patient/ForgotPassword";
import PatientDashboard from "./pages/patient/Dashboard";
import BookAppointment from "./pages/patient/BookAppointment";
import AppointmentDetails from "./pages/patient/AppointmentDetails";
import LiveQueue from "./pages/patient/LiveQueue";

// Staff Pages
import TodaysAppointments from "./pages/staff/TodaysAppointments";
import WalkInRegistration from "./pages/staff/WalkInRegistration";
import CheckIn from "./pages/staff/CheckIn";
import QueueControl from "./pages/staff/QueueControl";
import DailyReport from "./pages/staff/DailyReport";

// Admin Pages
import StaffAccounts from "./pages/admin/StaffAccounts";
import DoctorsAndSchedules from "./pages/admin/DoctorsAndSchedules";

// Pages that have their own full-page layout (no navbar)
const AUTH_PATHS = ["/login", "/register", "/forgot-password"];

function HomeRedirect() {
  const { user, role, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (role === "admin") return <Navigate to="/admin/doctors" replace />;
  if (role === "staff") return <Navigate to="/staff/today" replace />;
  return <Navigate to="/dashboard" replace />;
}

function AppShell() {
  const location = useLocation();
  const { user } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const isAuthPage = AUTH_PATHS.includes(location.pathname);

  if (isAuthPage) {
    return (
      <Routes>
        <Route path="/login"           element={<Login />} />
        <Route path="/register"        element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="*"                element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <div className="app-layout">
      {user && <Navbar onOpenDrawer={() => setDrawerOpen(true)} />}

      <div className="page-content">
        <Routes>
          <Route path="/" element={<HomeRedirect />} />
          <Route path="/queue" element={<LiveQueue />} />

          {/* Patient */}
          <Route path="/dashboard" element={
            <ProtectedRoute allowedRoles={["patient"]}><PatientDashboard /></ProtectedRoute>
          } />
          <Route path="/book" element={
            <ProtectedRoute allowedRoles={["patient"]}><BookAppointment /></ProtectedRoute>
          } />
          <Route path="/appointment/:id" element={
            <ProtectedRoute allowedRoles={["patient", "staff", "admin"]}><AppointmentDetails /></ProtectedRoute>
          } />

          {/* Staff */}
          <Route path="/staff/today" element={
            <ProtectedRoute allowedRoles={["staff", "admin"]}><TodaysAppointments /></ProtectedRoute>
          } />
          <Route path="/staff/walk-in" element={
            <ProtectedRoute allowedRoles={["staff", "admin"]}><WalkInRegistration /></ProtectedRoute>
          } />
          <Route path="/staff/check-in" element={
            <ProtectedRoute allowedRoles={["staff", "admin"]}><CheckIn /></ProtectedRoute>
          } />
          <Route path="/staff/queue-control" element={
            <ProtectedRoute allowedRoles={["staff", "admin"]}><QueueControl /></ProtectedRoute>
          } />
          <Route path="/staff/reports" element={
            <ProtectedRoute allowedRoles={["staff", "admin"]}><DailyReport /></ProtectedRoute>
          } />

          {/* Admin */}
          <Route path="/admin/staff" element={
            <ProtectedRoute allowedRoles={["admin"]}><StaffAccounts /></ProtectedRoute>
          } />
          <Route path="/admin/doctors" element={
            <ProtectedRoute allowedRoles={["admin"]}><DoctorsAndSchedules /></ProtectedRoute>
          } />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>

      {/* Mobile-first Persistent Bottom Navigation Bar */}
      <BottomNav onOpenMenu={() => setDrawerOpen(true)} />

      {/* Slide-out Mobile Navigation Drawer */}
      <MobileDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppShell />
      </BrowserRouter>
    </AuthProvider>
  );
}

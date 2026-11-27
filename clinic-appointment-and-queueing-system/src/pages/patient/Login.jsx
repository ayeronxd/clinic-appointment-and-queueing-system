import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signIn, getProfile, formatAuthError } from "../../data/auth";
import { useAuth } from "../../components/AuthContext";
import AuthHero from "../../components/AuthHero";
import { getClinicOperatingStatus } from "../../data/schedules";
import { getOperatingMode } from "../../data/clinicSettings";
import {
  FiEye, FiEyeOff, FiMail, FiLock, FiTv, FiArrowRight, FiCheck
} from "react-icons/fi";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const [fieldErrors, setFieldErrors] = useState({});
  const [errorMsg, setErrorMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const navigate = useNavigate();
  const { refreshProfile } = useAuth();
  const clinicStatus = getClinicOperatingStatus(new Date(), getOperatingMode());

  useEffect(() => {
    const savedEmail = localStorage.getItem("caqs_remember_email");
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  function validate() {
    const errors = {};
    const emailTrimmed = email.trim();

    if (!emailTrimmed) {
      errors.email = "Email address is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed)) {
      errors.email = "Please enter a valid email address.";
    }

    if (!password) {
      errors.password = "Password is required.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMsg("");

    if (!validate()) return;
    setSubmitting(true);

    const { data, error } = await signIn({
      email: email.trim(),
      password,
    });

    if (error) {
      setErrorMsg(formatAuthError(error));
      setSubmitting(false);
      return;
    }

    if (rememberMe) {
      localStorage.setItem("caqs_remember_email", email.trim());
    } else {
      localStorage.removeItem("caqs_remember_email");
    }

    if (data?.user) {
      await refreshProfile(data.user);
      const { data: prof } = await getProfile(data.user.id);
      const role = prof?.role || "patient";
      if (role === "admin") navigate("/admin/doctors");
      else if (role === "staff") navigate("/staff/today");
      else navigate("/dashboard");
    }
  }

  return (
    <div className="auth-page">
      {/* Left Clinical Brand Hero (Desktop) */}
      <AuthHero
        headline="Smart Healthcare Queuing & Triage"
        description="Schedule appointments, obtain digital QR arrival passes, and track live consultation sequences in real time."
      />

      {/* Right Form Container */}
      <div className="auth-right">
        <div className="auth-card">
          {/* Mobile Brand Header (< 768px) */}
          <div className="auth-mobile-header">
            <div className="auth-mobile-brand">
              <div className="auth-mobile-icon">✚</div>
              <div>
                <div className="auth-mobile-title">ClinicCare</div>
                <div className="auth-mobile-sub">Queue & Appointments</div>
              </div>
            </div>
            <div className="auth-mobile-status">
              <span
                className="auth-clinic-dot"
                style={{
                  background: clinicStatus.isOpen ? "#10b981" : "#ef4444",
                  boxShadow: clinicStatus.isOpen ? "0 0 6px rgba(16,185,129,0.7)" : "none",
                }}
              />
              <span>{clinicStatus.isOpen ? "Open" : "Closed"}</span>
            </div>
          </div>

          <div className="auth-card-header">
            <h2 className="auth-title">Sign In</h2>
            <p className="auth-sub">Enter your credentials to access your healthcare portal</p>
          </div>

          {errorMsg && (
            <div className="alert alert-error" style={{ marginBottom: 18 }}>
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            {/* Email Field with Leading Icon */}
            <div className="form-group">
              <label htmlFor="login-email" className="form-label">
                Email address
              </label>
              <div className="auth-input-wrapper">
                <FiMail className="auth-input-lead-icon" />
                <input
                  id="login-email"
                  className={`form-control auth-input ${fieldErrors.email ? "is-invalid" : ""}`}
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (fieldErrors.email) setFieldErrors({ ...fieldErrors, email: "" });
                  }}
                />
              </div>
              {fieldErrors.email && (
                <div className="form-feedback error">{fieldErrors.email}</div>
              )}
            </div>

            {/* Password Field with Leading Icon and Trailing Toggle */}
            <div className="form-group">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <label htmlFor="login-password" className="form-label" style={{ margin: 0 }}>
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="auth-link"
                  style={{ fontSize: "0.82rem" }}
                >
                  Forgot password?
                </Link>
              </div>
              <div className="auth-input-wrapper">
                <FiLock className="auth-input-lead-icon" />
                <input
                  id="login-password"
                  className={`form-control auth-input ${fieldErrors.password ? "is-invalid" : ""}`}
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (fieldErrors.password) setFieldErrors({ ...fieldErrors, password: "" });
                  }}
                />
                <button
                  type="button"
                  className="auth-input-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
              {fieldErrors.password && (
                <div className="form-feedback error">{fieldErrors.password}</div>
              )}
            </div>

            {/* Remember Me Checkbox */}
            <div className="form-check" style={{ marginBottom: 20 }}>
              <input
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <label className="form-check-label" htmlFor="rememberMe">
                Remember my email on this device
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="btn btn-primary w-100 auth-submit-btn"
              disabled={submitting}
            >
              {submitting ? "Verifying credentials…" : "Sign In to Portal"}
            </button>
          </form>

          {/* Registration Prompt */}
          <div className="auth-card-footer">
            <span>New patient? </span>
            <Link to="/register" className="auth-link-bold">
              Create an account
            </Link>
          </div>

          {/* Fast Public Queue Peek Link */}
          <div className="auth-public-link">
            <Link to="/queue" className="auth-peek-btn">
              <FiTv style={{ fontSize: "1.1rem" }} />
              <span>Looking for today's queue? <strong>Live Monitor</strong></span>
              <FiArrowRight style={{ marginLeft: "auto" }} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

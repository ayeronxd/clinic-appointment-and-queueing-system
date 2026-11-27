import React, { useState } from "react";
import { Link } from "react-router-dom";
import { resetPasswordForEmail, formatAuthError } from "../../data/auth";
import AuthHero from "../../components/AuthHero";
import { getClinicOperatingStatus } from "../../data/schedules";
import { getOperatingMode } from "../../data/clinicSettings";
import { FiArrowLeft, FiMail, FiCheckCircle } from "react-icons/fi";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ text: "", type: "" });
  const clinicStatus = getClinicOperatingStatus(new Date(), getOperatingMode());

  async function handleSubmit(e) {
    e.preventDefault();
    setStatusMsg({ text: "", type: "" });

    const trimmed = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setStatusMsg({ text: "Please enter a valid email address.", type: "error" });
      return;
    }

    setSubmitting(true);
    const { error } = await resetPasswordForEmail(trimmed);

    if (error) {
      setStatusMsg({ text: formatAuthError(error), type: "error" });
      setSubmitting(false);
      return;
    }

    setStatusMsg({
      text: "Password reset instructions have been sent. Please check your email inbox and spam folder.",
      type: "success",
    });
    setSubmitting(false);
  }

  return (
    <div className="auth-page">
      <AuthHero
        headline="Secure Healthcare Access Recovery"
        description="Provide your registered account email to receive a protected verification link and restore access."
      />

      <div className="auth-right">
        <div className="auth-card">
          {/* Mobile Brand Header */}
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

          <Link to="/login" className="auth-back-btn">
            <FiArrowLeft /> Back to Sign In
          </Link>

          <div className="auth-card-header">
            <h2 className="auth-title">Reset Password</h2>
            <p className="auth-sub">Enter your email and we'll send you recovery instructions</p>
          </div>

          {statusMsg.text && (
            <div className={`alert alert-${statusMsg.type}`} style={{ marginBottom: 18 }}>
              {statusMsg.type === "success" && (
                <FiCheckCircle style={{ marginRight: 6, verticalAlign: "middle" }} />
              )}
              {statusMsg.text}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="reset-email" className="form-label">
                Registered Email Address
              </label>
              <div className="auth-input-wrapper">
                <FiMail className="auth-input-lead-icon" />
                <input
                  id="reset-email"
                  className="form-control auth-input"
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary w-100 auth-submit-btn"
              disabled={submitting}
            >
              {submitting ? "Sending verification link…" : "Send Reset Link"}
            </button>
          </form>

          <div className="auth-card-footer">
            <span>Remember your password? </span>
            <Link to="/login" className="auth-link-bold">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

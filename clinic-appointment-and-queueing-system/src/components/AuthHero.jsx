import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getClinicOperatingStatus } from "../data/schedules";
import { getOperatingMode, subscribeToClinicMode } from "../data/clinicSettings";
import {
  FiTv, FiArrowRight, FiCheckCircle, FiClock, FiShield, FiSmartphone
} from "react-icons/fi";

/**
 * AuthHero Component
 * Rich clinical brand hero panel displayed on the left side of authentication screens.
 */
export default function AuthHero({ headline, description }) {
  const [mode, setMode] = useState(getOperatingMode());

  useEffect(() => {
    const unsub = subscribeToClinicMode((newMode) => setMode(newMode));
    return () => unsub();
  }, []);

  const clinicStatus = getClinicOperatingStatus(new Date(), mode);

  return (
    <div className="auth-left">
      {/* Brand & Live Operating Pill */}
      <div>
        <div className="auth-left-logo">
          <div className="auth-left-icon">✚</div>
          <div>
            <div className="auth-left-brand">
              ClinicCare
              <span>Queue & Appointments</span>
            </div>
          </div>
        </div>

        <div className="auth-clinic-pill">
          <span
            className="auth-clinic-dot"
            style={{
              background: clinicStatus.isOpen ? "#10b981" : "#ef4444",
              boxShadow: clinicStatus.isOpen ? "0 0 8px rgba(16,185,129,0.7)" : "none",
            }}
          />
          <span>{clinicStatus.isOpen ? "Clinic: Open & Serving" : "Clinic: Closed (Off-Hours)"}</span>
        </div>
      </div>

      {/* Main Narrative & Value Pillars */}
      <div className="auth-left-body">
        <h1 className="auth-left-headline">
          {headline || "Smart Healthcare Queuing & Triage"}
        </h1>
        <p className="auth-left-desc">
          {description || "Schedule outpatient consultations, obtain digital QR arrival passes, and track live queue sequences in real time."}
        </p>

        {/* Feature Cards */}
        <div className="auth-features">
          <div className="auth-feature-item">
            <div className="auth-feature-icon">
              <FiSmartphone />
            </div>
            <div>
              <div className="auth-feature-title">Digital QR Arrival Pass</div>
              <div className="auth-feature-text">Pre-booked visits generate instant mobile passes for express kiosk check-in.</div>
            </div>
          </div>

          <div className="auth-feature-item">
            <div className="auth-feature-icon">
              <FiClock />
            </div>
            <div>
              <div className="auth-feature-title">Real-Time Lobby Sequencer</div>
              <div className="auth-feature-text">Track your ticket number live from anywhere without waiting in crowded rooms.</div>
            </div>
          </div>

          <div className="auth-feature-item">
            <div className="auth-feature-icon">
              <FiShield />
            </div>
            <div>
              <div className="auth-feature-title">Automated SMS Triage Alerts</div>
              <div className="auth-feature-text">Receive SMS reminders when your attending physician is 3 patients away.</div>
            </div>
          </div>
        </div>

        {/* Direct Link to Live Queue Board */}
        <Link to="/queue" className="auth-live-queue-card">
          <div className="auth-live-icon">
            <FiTv />
          </div>
          <div style={{ flex: 1 }}>
            <div className="auth-live-title">View Live Queue Monitor</div>
            <div className="auth-live-hint">See ongoing consultations without signing in</div>
          </div>
          <FiArrowRight className="auth-live-arrow" />
        </Link>
      </div>

      {/* Trust & Academic Project Footer */}
      <div className="auth-left-footer">
        <div>ClinicCare CAQS · Group 5 BSIT 1-3</div>
        <div className="auth-footer-sub">RA 10173 Data Privacy Aligned</div>
      </div>
    </div>
  );
}

import React from "react";
import {
  FiUser, FiClock, FiCheckCircle, FiInfo,
  FiCalendar, FiMapPin, FiShield, FiPhone
} from "react-icons/fi";

/**
 * BookingSidebar Component
 * Displays selected physician details, clinic visit requirements, and helpdesk line.
 */
export default function BookingSidebar({ activeDoc }) {
  return (
    <div>
      {/* Active Doctor Card */}
      <div className="card" style={{ padding: "20px", marginBottom: "16px" }}>
        <div style={{
          fontSize: "0.82rem", fontWeight: 700, color: "var(--navy)",
          textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 12,
          display: "flex", alignItems: "center", gap: 8
        }}>
          <FiUser style={{ color: "var(--accent)" }} /> Selected Physician
        </div>

        {activeDoc ? (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
              <div className="doctor-avatar-circle">
                {activeDoc.full_name?.split(" ").map((n) => n[0]).slice(0, 2).join("")}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: "0.98rem", color: "var(--text-primary)" }}>
                  Dr. {activeDoc.full_name}
                </div>
                <div style={{ fontSize: "0.82rem", color: "var(--accent)", fontWeight: 600 }}>
                  {activeDoc.specialty}
                </div>
              </div>
            </div>

            <div className="side-info-item">
              <FiMapPin style={{ flexShrink: 0, marginTop: 2, color: "var(--navy-soft)" }} />
              <span>Outpatient Consultation Room 204, 2nd Floor</span>
            </div>
            <div className="side-info-item">
              <FiCalendar style={{ flexShrink: 0, marginTop: 2, color: "var(--navy-soft)" }} />
              <span>Standard 15-minute consultation window</span>
            </div>
          </div>
        ) : (
          <p style={{ color: "var(--text-muted)", fontSize: "0.83rem", lineHeight: 1.5, margin: 0 }}>
            Select a doctor from the form to view their specialty, assigned room, and slot schedule.
          </p>
        )}
      </div>

      {/* Visit Checklist */}
      <div className="card" style={{ padding: "20px", marginBottom: "16px" }}>
        <div style={{
          fontSize: "0.82rem", fontWeight: 700, color: "var(--navy)",
          textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 12,
          display: "flex", alignItems: "center", gap: 8
        }}>
          <FiShield style={{ color: "var(--green)" }} /> Clinic Visit Checklist
        </div>

        <div className="side-info-item">
          <FiClock style={{ flexShrink: 0, marginTop: 2, color: "var(--navy)" }} />
          <span><strong>15-Minute Rule:</strong> Arrive early for vital signs triage.</span>
        </div>
        <div className="side-info-item">
          <FiInfo style={{ flexShrink: 0, marginTop: 2, color: "var(--navy)" }} />
          <span><strong>Identification:</strong> Present 1 valid ID at the reception desk.</span>
        </div>
        <div className="side-info-item">
          <FiCheckCircle style={{ flexShrink: 0, marginTop: 2, color: "var(--green)" }} />
          <span><strong>Digital Pass:</strong> Show the QR Pass issued upon booking.</span>
        </div>
      </div>

      {/* Reception Assistance */}
      <div className="card" style={{ padding: "18px", background: "var(--bg-page)", borderStyle: "dashed" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700, fontSize: "0.85rem", color: "var(--navy)", marginBottom: 6 }}>
          <FiPhone style={{ color: "var(--accent)" }} /> Reception Desk
        </div>
        <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", margin: 0, lineHeight: 1.5 }}>
          Open Monday to Saturday, 8:00 AM – 5:00 PM.<br />
          Direct Line: <strong>(02) 8123-4567</strong>
        </p>
      </div>
    </div>
  );
}

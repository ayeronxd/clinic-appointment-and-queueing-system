import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../components/AuthContext";
import { getPatientAppointments } from "../../data/appointments";
import { getClinicOperatingStatus } from "../../data/schedules";
import { getOperatingMode, subscribeToClinicMode } from "../../data/clinicSettings";
import StatusBadge from "../../components/StatusBadge";
import LoadingSpinner from "../../components/LoadingSpinner";
import {
  FiCalendar, FiClock, FiFileText, FiPlus,
  FiArrowRight, FiCheckCircle, FiShield, FiPhone, FiTv, FiActivity
} from "react-icons/fi";

export default function PatientDashboard() {
  const { user, profile } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState(getOperatingMode());

  useEffect(() => {
    if (!user) return;
    getPatientAppointments(user.id).then(({ data }) => {
      setAppointments(data || []);
      setLoading(false);
    });
    const unsub = subscribeToClinicMode((newMode) => setMode(newMode));
    return () => unsub();
  }, [user]);

  if (loading) return <LoadingSpinner message="Loading patient portal…" />;

  const activeAppts = appointments.filter((a) => ["Booked", "Checked-in", "Now Serving"].includes(a.status));
  const completed   = appointments.filter((a) => a.status === "Completed");
  const nextActive  = activeAppts[0] || null;
  const firstName   = profile?.full_name?.split(" ")[0] || "Patient";

  const clinicStatus = getClinicOperatingStatus(new Date(), mode);

  return (
    <>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Welcome back, {firstName} 👋</h1>
          <p className="page-subtitle">
            Outpatient healthcare portal — track appointments, queue status, and digital passes
          </p>
        </div>
        <Link to="/book" className="btn btn-primary">
          <FiPlus /> Book Consultation
        </Link>
      </div>

      {/* Metric Cards Row */}
      <div className="grid-3" style={{ marginBottom: 24 }}>
        <div className="stat-card">
          <div>
            <div className="stat-label">Active Appointments</div>
            <div className="stat-value" style={{ color: "var(--accent)" }}>{activeAppts.length}</div>
            <div className="stat-hint">Scheduled consultation visits</div>
          </div>
          <div className="stat-icon-wrapper" style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>
            <FiCalendar />
          </div>
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-label">Completed Consultations</div>
            <div className="stat-value" style={{ color: "var(--green)" }}>{completed.length}</div>
            <div className="stat-hint">Past visits on clinic record</div>
          </div>
          <div className="stat-icon-wrapper" style={{ background: "var(--green-soft)", color: "var(--green)" }}>
            <FiCheckCircle />
          </div>
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-label">Lobby Queue Status</div>
            <div className="stat-value" style={{
              fontSize: "1.25rem", marginTop: 8,
              color: clinicStatus.isOpen ? "var(--green)" : "var(--text-muted)"
            }}>
              {clinicStatus.label}
            </div>
            <div className="stat-hint">{clinicStatus.hint}</div>
          </div>
          <div className="stat-icon-wrapper" style={{
            background: clinicStatus.isOpen ? "var(--green-soft)" : "#f1f5f9",
            color: clinicStatus.isOpen ? "var(--green)" : "var(--text-muted)"
          }}>
            {clinicStatus.isOpen ? <FiActivity /> : <FiClock />}
          </div>
        </div>
      </div>

      <div className="content-grid-main-side">
        {/* Main Consultation History */}
        <div className="card">
          <div className="card-header">
            <span>Consultation Schedule & Records</span>
            <span style={{ color: "var(--text-muted)", fontSize: "0.8rem", fontWeight: 500 }}>
              {appointments.length} record{appointments.length !== 1 ? "s" : ""}
            </span>
          </div>

          {appointments.length === 0 ? (
            <div className="card-body" style={{ textAlign: "center", padding: "48px 24px" }}>
              <div style={{
                width: 56, height: 56, borderRadius: "50%",
                background: "var(--accent-soft)", color: "var(--accent)",
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 16px", fontSize: "1.6rem"
              }}>
                <FiCalendar />
              </div>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: 6 }}>
                Ready to schedule your consultation?
              </h3>
              <p style={{ color: "var(--text-muted)", fontSize: "0.86rem", maxWidth: 440, margin: "0 auto 18px", lineHeight: 1.55 }}>
                Reserve an appointment with an attending physician online to avoid lobby waiting lines.
                You'll receive an instant digital QR pass for express triage check-in.
              </p>
              <Link to="/book" className="btn btn-primary">
                <FiPlus /> Schedule Your First Visit
              </Link>

              <div style={{
                display: "flex", justifyContent: "center", gap: 20,
                marginTop: 24, paddingTop: 20, borderTop: "1px solid var(--border-xs)",
                fontSize: "0.78rem", color: "var(--text-muted)", flexWrap: "wrap"
              }}>
                <span>✓ Direct doctor booking</span>
                <span>✓ Express QR check-in</span>
                <span>✓ Automatic SMS updates</span>
              </div>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Appt #</th>
                    <th>Physician</th>
                    <th>Date & Time</th>
                    <th>Reason</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.map((appt) => (
                    <tr key={appt.appointment_id}>
                      <td>
                        <span className="mono" style={{ color: "var(--navy)", fontWeight: 700 }}>
                          {appt.appointment_no}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>Dr. {appt.doctors?.full_name}</div>
                        <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                          {appt.doctors?.specialty}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 500 }}>{appt.schedules?.date}</div>
                        <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                          {appt.schedules?.start_time} – {appt.schedules?.end_time}
                        </div>
                      </td>
                      <td style={{
                        color: "var(--text-secondary)", maxWidth: 180,
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"
                      }}>
                        {appt.reason}
                      </td>
                      <td><StatusBadge status={appt.status} /></td>
                      <td style={{ textAlign: "right" }}>
                        <Link to={`/appointment/${appt.appointment_id}`} className="btn btn-ghost btn-sm">
                          View Pass
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Sidebar */}
        <div>
          {nextActive ? (
            <div className="card" style={{ padding: "20px", marginBottom: "16px", border: "2px solid var(--accent)" }}>
              <div style={{
                fontSize: "0.82rem", fontWeight: 700, color: "var(--accent)",
                textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 12,
                display: "flex", alignItems: "center", gap: 8
              }}>
                <FiCheckCircle style={{ color: "var(--green)" }} /> Upcoming Digital Pass
              </div>
              <div style={{ background: "var(--bg-page)", padding: "14px", borderRadius: 8, marginBottom: 14 }}>
                <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 0.5 }}>
                  Pass Number
                </div>
                <div className="mono" style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--navy)" }}>
                  {nextActive.appointment_no}
                </div>
                <div style={{ fontSize: "0.9rem", fontWeight: 700, marginTop: 6 }}>
                  Dr. {nextActive.doctors?.full_name}
                </div>
                <div style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
                  {nextActive.schedules?.date} • {nextActive.schedules?.start_time}
                </div>
              </div>

              <Link
                to={`/appointment/${nextActive.appointment_id}`}
                className="btn btn-primary w-100"
                style={{ justifyContent: "center" }}
              >
                <span>Open Digital Arrival Pass</span>
                <FiArrowRight />
              </Link>
            </div>
          ) : (
            <div className="card" style={{ padding: "20px", marginBottom: "16px" }}>
              <div style={{
                fontSize: "0.82rem", fontWeight: 700, color: "var(--navy)",
                textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 10,
                display: "flex", alignItems: "center", gap: 8
              }}>
                <FiTv style={{ color: "var(--accent)" }} /> Live Queue Monitor
              </div>
              <p style={{ fontSize: "0.83rem", color: "var(--text-secondary)", marginBottom: 14, lineHeight: 1.5 }}>
                Track the active hospital consultation screen in real-time. View current serving numbers and lobby wait times.
              </p>
              <Link to="/queue" className="btn btn-ghost btn-sm w-100" style={{ justifyContent: "center" }}>
                Open Live Queue Display
              </Link>
            </div>
          )}

          {/* Clinic Guidelines */}
          <div className="card" style={{ padding: "20px", marginBottom: "16px" }}>
            <div style={{
              fontSize: "0.82rem", fontWeight: 700, color: "var(--navy)",
              textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 12,
              display: "flex", alignItems: "center", gap: 8
            }}>
              <FiShield style={{ color: "var(--green)" }} /> Patient Clinic Protocols
            </div>
            <div className="side-info-item">
              <span>● <strong>15-Minute Rule:</strong> Arrive early for vitals taking and initial triage.</span>
            </div>
            <div className="side-info-item">
              <span>● <strong>Express Kiosk:</strong> Present your QR Pass at the triage window.</span>
            </div>
            <div className="side-info-item">
              <span>● <strong>Priority Lane:</strong> Senior Citizens, PWDs, and Maternity priority lanes.</span>
            </div>
          </div>

          {/* Hotline */}
          <div className="card" style={{ padding: "18px", background: "var(--bg-page)", borderStyle: "dashed" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700, fontSize: "0.85rem", color: "var(--navy)", marginBottom: 6 }}>
              <FiPhone style={{ color: "var(--accent)" }} /> Reception Assistance
            </div>
            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", margin: 0, lineHeight: 1.5 }}>
              Need to reschedule or cancel? Contact <strong>(02) 8123-4567</strong> or visit the triage desk.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

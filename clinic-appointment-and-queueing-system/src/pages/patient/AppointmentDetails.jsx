import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { getAppointmentById, cancelAppointment, rescheduleAppointment } from "../../data/appointments";
import { getAvailableSlots } from "../../data/schedules";
import QRCodeCard from "../../components/QRCodeCard";
import StatusBadge from "../../components/StatusBadge";
import LoadingSpinner from "../../components/LoadingSpinner";
import { FiArrowLeft, FiUser, FiCalendar, FiClock, FiFileText, FiAlertCircle, FiTv } from "react-icons/fi";

export default function AppointmentDetails() {
  const { id } = useParams();

  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showReschedule, setShowReschedule] = useState(false);
  const [slots, setSlots] = useState([]);
  const [newSlotId, setNewSlotId] = useState("");
  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");

  async function loadData() {
    setLoading(true);
    const { data } = await getAppointmentById(id);
    setAppointment(data);
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, [id]);

  async function handleCancel() {
    if (!window.confirm("Are you sure you want to cancel this appointment?")) return;
    const { error } = await cancelAppointment(id);
    if (error) {
      setActionError(error.message);
    } else {
      setActionSuccess("Appointment has been cancelled.");
      loadData();
    }
  }

  async function openReschedule() {
    setActionError("");
    if (appointment?.doctor_id) {
      const { data } = await getAvailableSlots(appointment.doctor_id);
      setSlots(data || []);
      setShowReschedule(true);
    }
  }

  async function handleConfirmReschedule() {
    if (!newSlotId) return;
    const { error } = await rescheduleAppointment(id, newSlotId);
    if (error) {
      setActionError(error.message);
    } else {
      setShowReschedule(false);
      setActionSuccess("Appointment rescheduled successfully.");
      loadData();
    }
  }

  function formatTime(t) {
    if (!t) return "";
    const parts = t.split(":");
    if (parts.length < 2) return t;
    let hour = parseInt(parts[0], 10);
    const minute = parts[1];
    const ampm = hour >= 12 ? "PM" : "AM";
    hour = hour % 12 || 12;
    return `${hour}:${minute} ${ampm}`;
  }

  function formatDate(d) {
    if (!d) return "";
    try {
      const dt = new Date(d + "T00:00:00");
      return dt.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
    } catch {
      return d;
    }
  }

  if (loading) return <LoadingSpinner message="Loading appointment details…" />;
  if (!appointment) return <div className="alert alert-error">Appointment record not found.</div>;

  const canModify = appointment.status === "Booked";

  return (
    <>
      <div style={{ marginBottom: 16 }}>
        <Link to="/patient" className="btn btn-ghost btn-sm" style={{ padding: "6px 10px", fontSize: "0.85rem" }}>
          <FiArrowLeft style={{ marginRight: 6 }} /> Back to Dashboard
        </Link>
      </div>

      <div className="page-header" style={{ marginBottom: 20 }}>
        <div className="page-header-left">
          <h1 className="page-title">Appointment Consultation Pass</h1>
          <p className="page-subtitle">Review scheduled physician consultation, clinic instructions, and QR check-in pass</p>
        </div>
      </div>

      {actionError && <div className="alert alert-error" style={{ marginBottom: 16 }}>{actionError}</div>}
      {actionSuccess && <div className="alert alert-success" style={{ marginBottom: 16 }}>{actionSuccess}</div>}

      <div className="content-grid-main-side" style={{ alignItems: "start" }}>
        {/* Main Details Card */}
        <div className="card">
          <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <span style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 700, display: "block" }}>
                Appointment Reference
              </span>
              <span className="mono" style={{ color: "var(--navy)", fontSize: "1.15rem", fontWeight: 800 }}>
                {appointment.appointment_no}
              </span>
            </div>
            <StatusBadge status={appointment.status} />
          </div>

          <div className="card-body">
            {/* Attending Physician */}
            <div style={{ display: "flex", gap: 14, alignItems: "center", paddingBottom: 18, borderBottom: "1px solid var(--border-xs)" }}>
              <div style={{ width: 46, height: 46, borderRadius: "50%", background: "#f0f9ff", color: "#0284c7", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.25rem", flexShrink: 0 }}>
                <FiUser />
              </div>
              <div>
                <div style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)" }}>Attending Physician</div>
                <div style={{ fontWeight: 800, fontSize: "1.1rem", color: "var(--navy)" }}>Dr. {appointment.doctors?.full_name}</div>
                <div style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>{appointment.doctors?.specialty}</div>
              </div>
            </div>

            {/* Date & Time */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, padding: "18px 0", borderBottom: "1px solid var(--border-xs)" }}>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: "#ecfdf5", color: "#059669", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem", flexShrink: 0 }}>
                  <FiCalendar />
                </div>
                <div>
                  <div style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)" }}>Consultation Date</div>
                  <div style={{ fontWeight: 700, color: "var(--navy)", fontSize: "0.92rem" }}>{formatDate(appointment.schedules?.date)}</div>
                </div>
              </div>

              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: "#fffbeb", color: "#d97706", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem", flexShrink: 0 }}>
                  <FiClock />
                </div>
                <div>
                  <div style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)" }}>Time Window</div>
                  <div className="mono" style={{ fontWeight: 700, color: "var(--navy)", fontSize: "0.92rem" }}>
                    {formatTime(appointment.schedules?.start_time)} – {formatTime(appointment.schedules?.end_time)}
                  </div>
                </div>
              </div>
            </div>

            {/* Reason for Visit */}
            <div style={{ padding: "18px 0", borderBottom: "1px solid var(--border-xs)" }}>
              <div style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 6 }}>
                Reason for Consultation
              </div>
              <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "12px 14px", color: "var(--text-secondary)", fontSize: "0.88rem", lineHeight: 1.5 }}>
                {appointment.reason || "General Medical Checkup"}
              </div>
            </div>

            {/* Patient Clinic Protocols */}
            <div style={{ padding: "18px 0", borderBottom: canModify ? "1px solid var(--border-xs)" : "none" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.78rem", fontWeight: 700, textTransform: "uppercase", color: "var(--navy)", marginBottom: 8 }}>
                <FiAlertCircle style={{ color: "#0284c7" }} /> Clinic Arrival Instructions
              </div>
              <ul style={{ margin: 0, paddingLeft: 18, color: "var(--text-muted)", fontSize: "0.82rem", lineHeight: 1.6 }}>
                <li>Arrive at least 15 minutes before your time slot for preliminary vitals and triage.</li>
                <li>Present your digital QR pass at the triage window or scan directly at the express kiosk.</li>
                <li>Bring a valid government-issued or student ID and any previous medical test results.</li>
              </ul>
            </div>

            {canModify && (
              <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
                <button className="btn btn-outline btn-sm" onClick={openReschedule}>
                  Reschedule Appointment
                </button>
                <button
                  className="btn btn-sm"
                  style={{ background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca", fontWeight: 600 }}
                  onClick={handleCancel}
                >
                  Cancel Appointment
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: QR Pass Card & Live Queue */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <QRCodeCard
            appointmentNo={appointment.appointment_no}
            doctorName={appointment.doctors?.full_name}
            date={appointment.schedules?.date}
            time={appointment.schedules?.start_time}
          />

          {/* Quick Monitor Link */}
          <div className="card" style={{ padding: "18px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <div style={{ width: 34, height: 34, borderRadius: 8, background: "#f0f9ff", color: "#0284c7", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem" }}>
                <FiTv />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--navy)" }}>Clinic Queue Monitor</div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Live hospital waiting status</div>
              </div>
            </div>
            <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", margin: "0 0 12px", lineHeight: 1.45 }}>
              Check current calling tickets and waiting times before traveling to the clinic.
            </p>
            <Link to="/queue" className="btn btn-outline btn-sm" style={{ width: "100%", justifyContent: "center", fontSize: "0.82rem" }}>
              Open Live Queue Display
            </Link>
          </div>
        </div>
      </div>

      {/* Reschedule Modal */}
      {showReschedule && (
        <div className="modal-overlay" onClick={() => setShowReschedule(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 440 }}>
            <div className="modal-header">
              <span className="modal-title">Reschedule Consultation</span>
              <button className="modal-close" onClick={() => setShowReschedule(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Select New Available Consultation Slot</label>
                <select className="form-select" value={newSlotId} onChange={(e) => setNewSlotId(e.target.value)}>
                  <option value="">— Choose time slot —</option>
                  {slots.map((s) => (
                    <option key={s.schedule_id} value={s.schedule_id}>
                      {s.date} • {formatTime(s.start_time)} – {formatTime(s.end_time)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost btn-sm" onClick={() => setShowReschedule(false)}>Cancel</button>
              <button className="btn btn-primary btn-sm" onClick={handleConfirmReschedule} disabled={!newSlotId}>
                Confirm Reschedule
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

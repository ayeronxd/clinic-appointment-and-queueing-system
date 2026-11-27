import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../components/AuthContext";
import { getDoctors } from "../../data/doctors";
import { getAvailableSlots } from "../../data/schedules";
import { bookAppointment } from "../../data/appointments";
import { sendSmsNotification } from "../../data/sms";
import BookingSidebar from "../../components/BookingSidebar";
import {
  FiUser, FiClock, FiFileText, FiCheckCircle,
  FiCalendar, FiCheck
} from "react-icons/fi";

export default function BookAppointment() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    getDoctors().then(({ data }) => setDoctors(data || []));
  }, []);

  useEffect(() => {
    if (!selectedDoctor) {
      setSlots([]);
      setSelectedSlot("");
      return;
    }
    getAvailableSlots(selectedDoctor).then(({ data }) => setSlots(data || []));
  }, [selectedDoctor]);

  const activeDoc = doctors.find((d) => d.doctor_id === selectedDoctor);

  async function handleBooking(e) {
    e.preventDefault();
    if (!selectedSlot) {
      setErrorMsg("Please select a consultation time slot before confirming.");
      return;
    }
    setErrorMsg("");
    setSubmitting(true);

    const { data, error } = await bookAppointment({
      patientId: user.id,
      doctorId: selectedDoctor,
      scheduleId: selectedSlot,
      reason,
    });

    if (error) {
      setErrorMsg(error.message || "Failed to schedule appointment. Please try again.");
      setSubmitting(false);
      if (selectedDoctor) {
        getAvailableSlots(selectedDoctor).then(({ data: freshSlots }) => {
          setSlots(freshSlots || []);
          if (freshSlots && !freshSlots.some((s) => s.schedule_id === selectedSlot)) {
            setSelectedSlot("");
          }
        });
      }
      return;
    }

    if (profile?.mobile_no) {
      const slotObj = slots.find((s) => s.schedule_id === selectedSlot);
      const doctorName = activeDoc?.full_name ? `Dr. ${activeDoc.full_name}` : "your physician";
      const slotTime = slotObj ? `${slotObj.date} at ${slotObj.start_time}` : "your scheduled time";
      sendSmsNotification({
        appointmentId: data.appointment_id,
        mobileNo: profile.mobile_no,
        message: `ClinicCare: Your appointment (${data.appointment_no}) with ${doctorName} on ${slotTime} is confirmed. Please arrive 15 mins prior for triage.`,
      });
    }

    navigate(`/appointment/${data.appointment_id}`);
  }

  return (
    <>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Schedule a Consultation</h1>
          <p className="page-subtitle">Reserve an outpatient appointment with an attending physician and receive an instant QR arrival pass</p>
        </div>
      </div>

      <div className="content-grid-main-side">
        <div>
          {errorMsg && (
            <div className="alert alert-error" style={{ marginBottom: "20px" }}>
              {errorMsg}
            </div>
          )}

          <div className="card">
            <div className="card-header">
              <span>Consultation Booking Form</span>
              <span style={{ fontSize: "0.78rem", color: "var(--accent)", fontWeight: 600 }}>Express Scheduling</span>
            </div>

            <form onSubmit={handleBooking} className="card-body">
              <div className="form-group">
                <label className="form-label">
                  <FiUser style={{ marginRight: 6, verticalAlign: "-2px" }} />
                  Select Attending Physician
                </label>
                <div style={{ display: "grid", gap: 10, marginTop: 4 }}>
                  {doctors.map((doc) => {
                    const isSelected = selectedDoctor === doc.doctor_id;
                    const initials = doc.full_name?.split(" ").map((n) => n[0]).slice(0, 2).join("") || "DR";
                    return (
                      <div
                        key={doc.doctor_id}
                        className={`doctor-select-card ${isSelected ? "selected" : ""}`}
                        onClick={() => setSelectedDoctor(doc.doctor_id)}
                      >
                        <div className="doctor-avatar-circle" style={{
                          background: isSelected ? "var(--accent)" : "var(--navy)"
                        }}>
                          {initials}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, fontSize: "0.92rem", color: "var(--navy)" }}>
                            Dr. {doc.full_name}
                          </div>
                          <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                            {doc.specialty}
                          </div>
                        </div>
                        {isSelected && (
                          <div style={{
                            width: 22, height: 22, borderRadius: "50%",
                            background: "var(--accent)", color: "#ffffff",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: "0.75rem"
                          }}>
                            <FiCheck />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {selectedDoctor && (
                <div className="form-group">
                  <label className="form-label">
                    <FiClock style={{ marginRight: 6, verticalAlign: "-2px" }} />
                    Available Consultation Time Slots
                  </label>
                  {slots.length === 0 ? (
                    <div style={{
                      padding: "16px", background: "var(--bg-page)",
                      borderRadius: "var(--radius-sm)", border: "1px dashed var(--border)",
                      color: "var(--text-muted)", fontSize: "0.86rem", textAlign: "center"
                    }}>
                      No available booking slots found for this physician in the next 14 days.
                    </div>
                  ) : (
                    <div className="grid-auto" style={{ marginTop: 6 }}>
                      {slots.map((s) => {
                        const isSlotSelected = selectedSlot === s.schedule_id;
                        return (
                          <button
                            key={s.schedule_id}
                            type="button"
                            className={`btn ${isSlotSelected ? "btn-primary" : "btn-ghost"}`}
                            style={{
                              flexDirection: "column", alignItems: "flex-start",
                              padding: "10px 14px", height: "auto",
                              border: isSlotSelected ? "1px solid var(--accent)" : "1px solid var(--border)",
                              background: isSlotSelected ? "var(--accent-soft)" : "#ffffff",
                              color: isSlotSelected ? "var(--accent)" : "var(--text-primary)",
                            }}
                            onClick={() => setSelectedSlot(s.schedule_id)}
                          >
                            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 600 }}>
                              {s.date}
                            </span>
                            <span style={{ fontWeight: 700, fontSize: "0.88rem", marginTop: 2 }}>
                              {s.start_time} – {s.end_time}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              <div className="form-group">
                <label className="form-label">
                  <FiFileText style={{ marginRight: 6, verticalAlign: "-2px" }} />
                  Reason for Consultation / Primary Symptoms
                </label>
                <textarea
                  className="form-control"
                  rows={3}
                  placeholder="e.g. Periodic migraine, routine blood pressure check-up, medical clearance…"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary w-100"
                style={{ padding: "12px", justifyContent: "center", marginTop: 10 }}
                disabled={submitting || !selectedSlot}
              >
                <FiCheckCircle />
                {submitting ? "Booking appointment…" : "Confirm Appointment & Issue QR Pass"}
              </button>
            </form>
          </div>
        </div>

        {/* Right Sidebar Component */}
        <BookingSidebar activeDoc={activeDoc} />
      </div>
    </>
  );
}

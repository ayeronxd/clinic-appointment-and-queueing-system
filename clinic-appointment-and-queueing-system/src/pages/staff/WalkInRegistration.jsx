import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../data/supabase";
import { addToQueue } from "../../data/queue";
import { getDoctors } from "../../data/doctors";
import { sendSmsNotification } from "../../data/sms";
import {
  FiUserPlus, FiCheckCircle, FiShield, FiPhone,
  FiFileText, FiUser, FiClock, FiTv
} from "react-icons/fi";

export default function WalkInRegistration() {
  const [patientName, setPatientName] = useState("");
  const [mobileNo,    setMobileNo]    = useState("");
  const [doctorId,    setDoctorId]    = useState("");
  const [reason,      setReason]      = useState("");
  const [doctors,     setDoctors]     = useState([]);
  const [submitting,  setSubmitting]  = useState(false);
  const [queueNo,     setQueueNo]     = useState(null);
  const [lastPatient, setLastPatient] = useState("");
  const [errorMsg,    setErrorMsg]    = useState("");

  useEffect(() => {
    getDoctors().then(({ data }) => setDoctors(data || []));
  }, []);

  async function handleWalkIn(e) {
    e.preventDefault();
    setErrorMsg("");
    setSubmitting(true);

    try {
      const { data: appt, error: apptError } = await supabase
        .from("appointments")
        .insert({
          doctor_id: doctorId || null,
          reason: `Walk-in: ${patientName} — ${reason}`,
          status: "Checked-in",
        })
        .select()
        .single();

      if (apptError) throw apptError;

      const { data: queueData, error: queueError } = await addToQueue(appt.appointment_id);
      if (queueError) throw queueError;

      if (mobileNo) {
        sendSmsNotification({
          appointmentId: appt.appointment_id,
          mobileNo,
          message: `ClinicCare: Hello ${patientName}, you are registered as Queue Ticket #${String(queueData.queue_no).padStart(3, "0")}. You will be alerted via SMS when your turn is called.`,
        });
      }

      setQueueNo(queueData.queue_no);
      setLastPatient(patientName);
      setPatientName("");
      setMobileNo("");
      setDoctorId("");
      setReason("");
    } catch (err) {
      setErrorMsg(err.message || "Failed to register walk-in patient.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Walk-in Patient Registration</h1>
          <p className="page-subtitle">Register unscheduled patients arriving at the clinic and place them into today's consultation queue</p>
        </div>
      </div>

      <div className="content-grid-main-side">
        {/* Main Form Column */}
        <div>
          {queueNo && (
            <div className="card" style={{
              background: "var(--green-soft)", border: "2px solid #86efac",
              padding: "24px", textAlign: "center", marginBottom: "20px"
            }}>
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                color: "var(--green)", fontWeight: 700, fontSize: "0.88rem",
                textTransform: "uppercase", letterSpacing: "1px", marginBottom: 6
              }}>
                <FiCheckCircle /> Walk-in Ticket Issued
              </div>
              <div style={{ color: "var(--text-secondary)", fontSize: "0.95rem", marginBottom: 12 }}>
                Patient: <strong>{lastPatient}</strong>
              </div>
              <div className="queue-number" style={{ fontSize: "3.8rem", color: "#15803d", marginBottom: 4 }}>
                #{queueNo}
              </div>
              <div style={{ fontSize: "0.78rem", color: "#15803d", fontWeight: 700, letterSpacing: "1px" }}>
                ASSIGNED QUEUE NUMBER
              </div>
              <p style={{ color: "var(--text-muted)", fontSize: "0.82rem", margin: "12px 0 0" }}>
                Please hand the patient their ticket number and advise them to wait in the lobby.
              </p>
            </div>
          )}

          {errorMsg && <div className="alert alert-error" style={{ marginBottom: "20px" }}>{errorMsg}</div>}

          <div className="card">
            <div className="card-header">
              <span>Patient Intake Details</span>
              <span style={{ fontSize: "0.78rem", color: "var(--accent)", fontWeight: 600 }}>Triage Registration</span>
            </div>
            <div className="card-body">
              <form onSubmit={handleWalkIn}>
                <div className="form-group">
                  <label className="form-label">Patient Full Name</label>
                  <input
                    className="form-control"
                    required
                    placeholder="e.g. Maria Clara De Los Santos"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <FiPhone style={{ marginRight: 6, verticalAlign: "middle" }} />
                    Mobile Number (For Turn SMS Notifications)
                  </label>
                  <input
                    className="form-control mono"
                    required
                    placeholder="09171234567"
                    value={mobileNo}
                    onChange={(e) => setMobileNo(e.target.value)}
                  />
                  <small style={{ color: "var(--text-muted)", fontSize: "0.76rem", display: "block", marginTop: 4 }}>
                    Automated SMS alerts will be sent when patient is 3 numbers away
                  </small>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <FiUser style={{ marginRight: 6, verticalAlign: "middle" }} />
                    Preferred Attending Physician
                  </label>
                  <select
                    className="form-select"
                    value={doctorId}
                    onChange={(e) => setDoctorId(e.target.value)}
                  >
                    <option value="">— General Consultation (Any Available Doctor) —</option>
                    {doctors.map((doc) => (
                      <option key={doc.doctor_id} value={doc.doctor_id}>
                        Dr. {doc.full_name} ({doc.specialty})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <FiFileText style={{ marginRight: 6, verticalAlign: "middle" }} />
                    Chief Complaint / Symptoms
                  </label>
                  <textarea
                    className="form-control"
                    rows={3}
                    required
                    placeholder="Describe symptoms, reason for consultation, or vital signs recorded at triage…"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary w-100"
                  style={{ padding: "12px", justifyContent: "center", marginTop: 8 }}
                  disabled={submitting}
                >
                  <FiUserPlus />
                  {submitting ? "Registering & Queuing…" : "Add Patient to Queue & Issue Ticket"}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div>
          <div className="card" style={{ padding: "20px", marginBottom: "16px" }}>
            <div style={{
              fontSize: "0.82rem", fontWeight: 700, color: "var(--navy)",
              textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 12,
              display: "flex", alignItems: "center", gap: 8
            }}>
              <FiShield style={{ color: "var(--green)" }} /> Walk-in Triage Protocols
            </div>
            <div className="side-info-item">
              <FiClock style={{ flexShrink: 0, marginTop: 2, color: "var(--navy)" }} />
              <span><strong>Triage Vitals:</strong> Take temperature, blood pressure, and oxygen saturation prior to queueing.</span>
            </div>
            <div className="side-info-item">
              <FiPhone style={{ flexShrink: 0, marginTop: 2, color: "var(--accent)" }} />
              <span><strong>SMS Automation:</strong> Registered mobile numbers automatically receive arrival notifications.</span>
            </div>
            <div className="side-info-item">
              <FiCheckCircle style={{ flexShrink: 0, marginTop: 2, color: "var(--green)" }} />
              <span><strong>Priority Desks:</strong> Fast-track senior citizens, pregnant women, and emergency cases immediately.</span>
            </div>
          </div>

          <div className="card" style={{ padding: "20px" }}>
            <div style={{
              fontSize: "0.82rem", fontWeight: 700, color: "var(--navy)",
              textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 12
            }}>
              Related Stations
            </div>
            <Link to="/staff/check-in" className="btn btn-ghost btn-sm w-100" style={{ justifyContent: "center", marginBottom: 8 }}>
              Go to Check-in Station
            </Link>
            <Link to="/staff/queue-control" className="btn btn-ghost btn-sm w-100" style={{ justifyContent: "center" }}>
              <FiTv /> Open Queue Control
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

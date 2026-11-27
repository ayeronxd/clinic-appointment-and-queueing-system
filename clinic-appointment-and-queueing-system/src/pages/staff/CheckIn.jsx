import React, { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../data/supabase";
import { addToQueue } from "../../data/queue";
import { updateAppointmentStatus } from "../../data/appointments";
import { sendSmsNotification } from "../../data/sms";
import QRScannerModal from "../../components/QRScannerModal";
import {
  FiCamera, FiCheckCircle, FiShield, FiClock,
  FiUserPlus, FiTv, FiAlertCircle
} from "react-icons/fi";

export default function CheckIn() {
  const [appointmentNo, setAppointmentNo] = useState("");
  const [submitting,    setSubmitting]    = useState(false);
  const [showScanner,   setShowScanner]   = useState(false);
  const [result,        setResult]        = useState(null);
  const [errorMsg,      setErrorMsg]      = useState("");

  async function performCheckIn(targetApptNo) {
    setErrorMsg("");
    setResult(null);
    setSubmitting(true);

    try {
      const { data: appt, error: findError } = await supabase
        .from("appointments")
        .select("appointment_id, appointment_no, status, patient_id")
        .eq("appointment_no", targetApptNo.trim())
        .single();

      if (findError || !appt) throw new Error(`Appointment "${targetApptNo}" not found.`);

      // Check if already checked in
      if (appt.status !== "Booked") {
        if (appt.status === "Checked-in" || appt.status === "Now Serving") {
          const { data: existingQ } = await supabase
            .from("queue_entries")
            .select("queue_no, status")
            .eq("appointment_id", appt.appointment_id)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          if (existingQ) {
            throw new Error(`Patient is already checked in today (Ticket #${String(existingQ.queue_no).padStart(3, "0")} · Status: ${existingQ.status}).`);
          }
        }
        throw new Error(`Cannot check in — appointment status is already "${appt.status}".`);
      }

      let patientName = "Patient";
      let patientMobile = null;
      if (appt.patient_id) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, mobile_no")
          .eq("user_id", appt.patient_id)
          .maybeSingle();
        if (profile?.full_name) patientName = profile.full_name;
        if (profile?.mobile_no) patientMobile = profile.mobile_no;
      }

      const { data: queueData, error: queueError, alreadyQueued } = await addToQueue(appt.appointment_id);
      if (queueError) {
        if (queueError.code === "23505" || queueError.message?.includes("idx_unique_today_queue_appointment")) {
          throw new Error(`This patient is already registered in today's queue.`);
        }
        throw queueError;
      }

      await updateAppointmentStatus(appt.appointment_id, "Checked-in");

      if (patientMobile && !alreadyQueued) {
        sendSmsNotification({
          appointmentId: appt.appointment_id,
          mobileNo: patientMobile,
          message: `ClinicCare: Check-in confirmed! You are Ticket #${String(queueData.queue_no).padStart(3, "0")}. Please wait in the lobby for your number to be called.`,
        });
      }

      setResult({
        queueNo:       queueData.queue_no,
        patientName,
        appointmentNo: appt.appointment_no,
        alreadyQueued: !!alreadyQueued,
      });
      setAppointmentNo("");
    } catch (err) {
      setErrorMsg(err.message || "Failed to check in patient.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Patient Check-in Station</h1>
          <p className="page-subtitle">Scan digital arrival passes or enter appointment numbers to issue lobby queue tickets</p>
        </div>
      </div>

      <div className="content-grid-main-side">
        {/* Main Station Column */}
        <div>
          {result && (
            <div className="card" style={{
              background: result.alreadyQueued ? "#eff6ff" : "var(--green-soft)",
              border: result.alreadyQueued ? "2px solid #93c5fd" : "2px solid #86efac",
              padding: "24px", textAlign: "center", marginBottom: "20px"
            }}>
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                color: result.alreadyQueued ? "#1d4ed8" : "var(--green)",
                fontWeight: 700, fontSize: "0.88rem",
                textTransform: "uppercase", letterSpacing: "1px", marginBottom: 6
              }}>
                <FiCheckCircle /> {result.alreadyQueued ? "Patient Already Checked In" : "Check-in Successful"}
              </div>
              <div style={{ color: "var(--text-secondary)", fontSize: "0.95rem", marginBottom: 12 }}>
                <strong>{result.patientName}</strong> · <span className="mono">{result.appointmentNo}</span>
              </div>
              <div className="queue-number" style={{
                fontSize: "3.8rem",
                color: result.alreadyQueued ? "#1e40af" : "#15803d",
                marginBottom: 4
              }}>
                #{String(result.queueNo).padStart(3, "0")}
              </div>
              <div style={{
                fontSize: "0.78rem",
                color: result.alreadyQueued ? "#1e40af" : "#15803d",
                fontWeight: 700, letterSpacing: "1px"
              }}>
                {result.alreadyQueued ? "CURRENT ACTIVE QUEUE TICKET" : "ASSIGNED QUEUE TICKET NUMBER"}
              </div>
              <p style={{ color: "var(--text-muted)", fontSize: "0.82rem", margin: "12px 0 0" }}>
                {result.alreadyQueued
                  ? "This patient was already assigned a queue ticket for today and is in line."
                  : "Patient has been added to the lobby queue and display monitor."}
              </p>
            </div>
          )}

          {errorMsg && <div className="alert alert-error" style={{ marginBottom: "20px" }}>{errorMsg}</div>}

          <div className="card">
            <div className="card-header">
              <span>Arrival Verification</span>
              <span style={{ fontSize: "0.78rem", color: "var(--accent)", fontWeight: 600 }}>Triage Desk</span>
            </div>
            <div className="card-body">
              {/* QR Scanner trigger */}
              <button
                type="button"
                className="btn btn-ghost w-100"
                style={{
                  padding: "16px", justifyContent: "center", fontSize: "0.95rem",
                  border: "2px dashed var(--accent)", color: "var(--accent)",
                  background: "var(--accent-soft)", marginBottom: 20
                }}
                onClick={() => setShowScanner(true)}
              >
                <FiCamera style={{ fontSize: "1.25rem" }} />
                <span>Launch Camera QR Pass Scanner</span>
              </button>

              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
                <span style={{ color: "var(--text-muted)", fontSize: "0.74rem", fontWeight: 700, letterSpacing: "0.6px", textTransform: "uppercase" }}>
                  Or Manual Verification
                </span>
                <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
              </div>

              {/* Manual Input */}
              <form onSubmit={(e) => { e.preventDefault(); if (appointmentNo.trim()) performCheckIn(appointmentNo); }}>
                <div className="form-group">
                  <label className="form-label">Appointment Pass Number</label>
                  <input
                    className="form-control mono"
                    style={{ textAlign: "center", fontWeight: 700, fontSize: "1.1rem", letterSpacing: "1.5px", padding: "12px" }}
                    placeholder="CA-2026-00001"
                    value={appointmentNo}
                    onChange={(e) => setAppointmentNo(e.target.value)}
                  />
                  <small style={{ color: "var(--text-muted)", fontSize: "0.76rem", display: "block", marginTop: 6, textAlign: "center" }}>
                    Enter the 13-character appointment reference code printed on the patient's pass
                  </small>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary w-100"
                  style={{ padding: "12px", justifyContent: "center", marginTop: 8 }}
                  disabled={submitting || !appointmentNo.trim()}
                >
                  <FiCheckCircle />
                  {submitting ? "Checking in…" : "Confirm Arrival & Issue Queue Ticket"}
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
              <FiShield style={{ color: "var(--green)" }} /> Check-in Protocols
            </div>
            <div className="side-info-item">
              <FiClock style={{ flexShrink: 0, marginTop: 2, color: "var(--navy)" }} />
              <span><strong>15-Minute Rule:</strong> Confirm that the patient is arriving for their scheduled consultation window.</span>
            </div>
            <div className="side-info-item">
              <FiCamera style={{ flexShrink: 0, marginTop: 2, color: "var(--accent)" }} />
              <span><strong>Express QR Scanning:</strong> Scan from patient smartphone screens or printed confirmation vouchers.</span>
            </div>
            <div className="side-info-item">
              <FiCheckCircle style={{ flexShrink: 0, marginTop: 2, color: "var(--green)" }} />
              <span><strong>Auto Queue Assignment:</strong> Tickets are auto-assigned the next sequential number for today.</span>
            </div>
          </div>

          <div className="card" style={{ padding: "20px" }}>
            <div style={{
              fontSize: "0.82rem", fontWeight: 700, color: "var(--navy)",
              textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 12
            }}>
              Triage Fast Links
            </div>
            <Link to="/staff/walk-in" className="btn btn-ghost btn-sm w-100" style={{ justifyContent: "center", marginBottom: 8 }}>
              <FiUserPlus /> Register Walk-in Patient
            </Link>
            <Link to="/staff/queue-control" className="btn btn-ghost btn-sm w-100" style={{ justifyContent: "center" }}>
              <FiTv /> Monitor Active Queue
            </Link>
          </div>
        </div>
      </div>

      <QRScannerModal
        show={showScanner}
        onHide={() => setShowScanner(false)}
        onScanSuccess={(decoded) => { setShowScanner(false); performCheckIn(decoded); }}
      />
    </>
  );
}

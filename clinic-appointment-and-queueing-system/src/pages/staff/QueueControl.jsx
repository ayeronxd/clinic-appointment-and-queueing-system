import React, { useState, useEffect } from "react";
import { getTodaysQueue, callNextPatient, markCompleted, markNoShow, subscribeToQueue } from "../../data/queue";
import { getDoctors } from "../../data/doctors";
import { sendSmsNotification } from "../../data/sms";
import LoadingSpinner from "../../components/LoadingSpinner";
import QueueRosterTable from "../../components/QueueRosterTable";
import {
  FiUsers, FiUserCheck, FiClock, FiActivity,
  FiChevronRight, FiCheckCircle, FiX, FiRefreshCw
} from "react-icons/fi";

export default function QueueControl() {
  const [queue, setQueue] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState("all");
  const [loading, setLoading] = useState(true);
  const [calling, setCalling] = useState(false);
  const [msg, setMsg] = useState("");

  async function loadData() {
    setLoading(true);
    const [qRes, dRes] = await Promise.all([getTodaysQueue(), getDoctors()]);
    setQueue(qRes.data || []);
    setDoctors(dRes.data || []);
    setLoading(false);
  }

  useEffect(() => {
    loadData();
    const unsub = subscribeToQueue(() => {
      getTodaysQueue().then(({ data }) => setQueue(data || []));
    });
    return () => unsub();
  }, []);

  async function handleCallNext() {
    setCalling(true);
    setMsg("");
    const docId = selectedDoctor === "all" ? null : selectedDoctor;
    const { data, error } = await callNextPatient(docId);
    if (error) {
      if (error.code === "ACTIVE_CONSULTATION_IN_PROGRESS") {
        const confirmComplete = window.confirm(
          `${error.doctorName} is currently consulting Ticket #${String(error.activeQueueNo).padStart(3, "0")}.\n\n` +
          `Would you like to mark Ticket #${String(error.activeQueueNo).padStart(3, "0")} as COMPLETED and call the next waiting patient into the consultation room?`
        );
        if (confirmComplete) {
          await markCompleted(error.activeQueueId);
          await loadData();
          setCalling(false);
          return handleCallNext();
        }
      }
      setMsg(`⚠️ ${error.message}`);
    } else {
      setMsg(`✓ Now Calling Ticket #${String(data.queue_no).padStart(3, "0")}!`);
      const patientPhone = data.appointments?.profiles?.mobile_no;
      if (patientPhone) {
        sendSmsNotification({
          appointmentId: data.appointment_id,
          mobileNo: patientPhone,
          message: `ClinicCare: Your ticket #${String(data.queue_no).padStart(3, "0")} is NOW SERVING! Please proceed to the consultation room immediately.`,
        });
      }

      // SRS FR-12: Alert patient who is 3 positions away in line
      const remainingWaiting = queue.filter((q) => q.status === "Waiting" && q.queue_id !== data.queue_id);
      if (remainingWaiting.length >= 3) {
        const threeAway = remainingWaiting[2];
        const threeAwayPhone = threeAway.appointments?.profiles?.mobile_no;
        if (threeAwayPhone) {
          sendSmsNotification({
            appointmentId: threeAway.appointment_id,
            mobileNo: threeAwayPhone,
            message: `ClinicCare Queue Alert: You are 3 patients away from consultation (Ticket #${String(threeAway.queue_no).padStart(3, "0")}). Please proceed towards the clinic lobby waiting area.`,
          });
        }
      }

      loadData();
    }
    setCalling(false);
  }

  async function handleComplete(queueId) {
    await markCompleted(queueId);
    loadData();
  }

  async function handleNoShow(queueId) {
    if (!window.confirm("Mark this patient as No-Show? They will be removed from the active queue.")) return;
    await markNoShow(queueId);
    loadData();
  }

  const activeServing = queue.filter((q) => q.status === "Now Serving");
  const waiting = queue.filter((q) => q.status === "Waiting");
  const completed = queue.filter((q) => q.status === "Completed");

  if (loading) return <LoadingSpinner message="Connecting to live queue desk…" />;

  return (
    <>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Queue Control Console</h1>
          <p className="page-subtitle">Real-time outpatient consultation management and digital ticket calling desk</p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={loadData}>
          <FiRefreshCw /> Refresh Desk
        </button>
      </div>

      {msg && (
        <div className="alert" style={{
          background: msg.startsWith("⚠️") ? "#fef3c7" : "#ecfdf5",
          color: msg.startsWith("⚠️") ? "#92400e" : "#065f46",
          border: `1px solid ${msg.startsWith("⚠️") ? "#fde68a" : "#a7f3d0"}`,
          marginBottom: 20
        }}>
          {msg}
        </div>
      )}

      {/* Triage / Metric Overview */}
      <div className="grid-3" style={{ marginBottom: 24 }}>
        <div className="stat-card">
          <div>
            <div className="stat-label">In Consultation</div>
            <div className="stat-value" style={{ color: "#16a34a" }}>{activeServing.length}</div>
            <div className="stat-hint">Currently with physicians</div>
          </div>
          <div className="stat-icon-wrapper" style={{ background: "#dcfce7", color: "#16a34a" }}>
            <FiActivity />
          </div>
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-label">Waiting in Line</div>
            <div className="stat-value" style={{ color: "#0284c7" }}>{waiting.length}</div>
            <div className="stat-hint">Checked-in triage lobby</div>
          </div>
          <div className="stat-icon-wrapper" style={{ background: "#e0f2fe", color: "#0284c7" }}>
            <FiUsers />
          </div>
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-label">Completed Today</div>
            <div className="stat-value" style={{ color: "var(--navy)" }}>{completed.length}</div>
            <div className="stat-hint">Consultations finished</div>
          </div>
          <div className="stat-icon-wrapper" style={{ background: "#f1f5f9", color: "var(--navy)" }}>
            <FiUserCheck />
          </div>
        </div>
      </div>

      {/* Main Calling Command Station */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>Consultation Calling Station</span>
          <span style={{ fontSize: "0.8rem", color: "#16a34a", fontWeight: 700 }}>● Active Console</span>
        </div>
        <div className="card-body">
          <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap", marginBottom: 24 }}>
            <div style={{ flex: 1, minWidth: 240 }}>
              <label style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--navy)", marginBottom: 6, display: "block" }}>
                Filter By Attending Physician:
              </label>
              <select
                className="form-control"
                value={selectedDoctor}
                onChange={(e) => setSelectedDoctor(e.target.value)}
                style={{ width: "100%", fontSize: "0.92rem", padding: "10px 14px" }}
              >
                <option value="all">Next Patient in Queue (Any Physician / General Pool)</option>
                {doctors.map((d) => (
                  <option key={d.doctor_id} value={d.doctor_id}>
                    Dr. {d.full_name} ({d.specialty})
                  </option>
                ))}
              </select>
            </div>

            <button
              className="btn btn-primary"
              style={{
                padding: "12px 28px", fontSize: "1.05rem", fontWeight: 700,
                alignSelf: "flex-end", height: 46
              }}
              onClick={handleCallNext}
              disabled={calling || waiting.length === 0}
            >
              <FiChevronRight style={{ fontSize: "1.3rem" }} />
              {calling ? "Calling..." : "Call Next Patient"}
            </button>
          </div>

          <hr style={{ border: "none", borderTop: "1px solid var(--border)", margin: "20px 0" }} />

          {/* Active Consultation Cards */}
          <h4 style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--navy)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 14 }}>
            Currently in Consultation Rooms ({activeServing.length})
          </h4>

          {activeServing.length === 0 ? (
            <div style={{ padding: "28px", background: "var(--bg-page)", borderRadius: 10, textAlign: "center", color: "var(--text-muted)" }}>
              No active consultation. Click "Call Next Patient" when a physician is ready.
            </div>
          ) : (
            <div className="grid-2">
              {activeServing.map((item) => (
                <div key={item.queue_id} style={{
                  padding: "18px 20px", background: "#f0fdf4", border: "1px solid #bbf7d0",
                  borderRadius: 12, display: "flex", justifyContent: "space-between", alignItems: "center"
                }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                      <span className="mono" style={{ fontSize: "1.6rem", fontWeight: 900, color: "#15803d" }}>
                        #{String(item.queue_no).padStart(3, "0")}
                      </span>
                      <span style={{ fontSize: "0.78rem", background: "#dcfce7", color: "#16a34a", padding: "2px 8px", borderRadius: 12, fontWeight: 700 }}>
                        In Room
                      </span>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: "0.98rem", color: "var(--navy)" }}>
                      {item.appointments?.profiles?.full_name || "Walk-in Patient"}
                    </div>
                    <div style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
                      Doctor: {item.appointments?.doctors?.full_name ? `Dr. ${item.appointments.doctors.full_name}` : "General Duty"}
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <button
                      className="btn btn-sm"
                      style={{ background: "#16a34a", color: "#ffffff", border: "none", fontSize: "0.82rem", fontWeight: 700 }}
                      onClick={() => handleComplete(item.queue_id)}
                    >
                      <FiCheckCircle style={{ marginRight: 4 }} /> Complete
                    </button>
                    <button
                      className="btn btn-sm"
                      style={{ background: "#ffffff", color: "#dc2626", border: "1px solid #fecaca", fontSize: "0.78rem" }}
                      onClick={() => handleNoShow(item.queue_id)}
                    >
                      <FiX style={{ marginRight: 4 }} /> No-show
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modular Roster Table */}
      <QueueRosterTable queue={queue} waiting={waiting} onNoShow={handleNoShow} />
    </>
  );
}

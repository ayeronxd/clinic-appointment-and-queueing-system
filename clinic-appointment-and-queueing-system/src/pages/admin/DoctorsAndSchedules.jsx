import React, { useState, useEffect } from "react";
import { getDoctors, createDoctor } from "../../data/doctors";
import { getDoctorSchedules, createSchedule, deleteSchedule } from "../../data/schedules";
import LoadingSpinner from "../../components/LoadingSpinner";
import { FiPlus, FiTrash2, FiUser, FiCalendar, FiClock } from "react-icons/fi";

export default function DoctorsAndSchedules() {
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showDocModal, setShowDocModal] = useState(false);
  const [docName, setDocName] = useState("");
  const [specialty, setSpecialty] = useState("");

  const [showSchedModal, setShowSchedModal] = useState(false);
  const [schedDate, setSchedDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [alertMsg, setAlertMsg] = useState("");

  async function loadDoctors() {
    setLoading(true);
    const { data } = await getDoctors();
    setDoctors(data || []);
    if (data && data.length > 0 && !selectedDoctorId) setSelectedDoctorId(data[0].doctor_id);
    setLoading(false);
  }

  async function loadSchedules(docId) {
    if (!docId) return;
    const { data } = await getDoctorSchedules(docId);
    setSchedules(data || []);
  }

  useEffect(() => { loadDoctors(); }, []);
  useEffect(() => { if (selectedDoctorId) loadSchedules(selectedDoctorId); }, [selectedDoctorId]);

  async function handleAddDoctor(e) {
    e.preventDefault();
    const { error } = await createDoctor({ fullName: docName, specialty });
    if (error) { setAlertMsg(error.message); return; }
    setShowDocModal(false); setDocName(""); setSpecialty("");
    loadDoctors();
  }

  async function handleAddSchedule(e) {
    e.preventDefault();
    const { error } = await createSchedule({ doctorId: selectedDoctorId, date: schedDate, startTime, endTime });
    if (error) { setAlertMsg(error.message); return; }
    setShowSchedModal(false); setSchedDate(""); setStartTime(""); setEndTime("");
    loadSchedules(selectedDoctorId);
  }

  async function handleDeleteSchedule(scheduleId) {
    if (!window.confirm("Delete this consultation slot?")) return;
    await deleteSchedule(scheduleId);
    loadSchedules(selectedDoctorId);
  }

  if (loading) return <LoadingSpinner message="Loading doctors and rosters…" />;
  const activeDoc = doctors.find((d) => d.doctor_id === selectedDoctorId);

  return (
    <>
      <div className="page-header" style={{ marginBottom: 20 }}>
        <div className="page-header-left">
          <h1 className="page-title">Doctors & Consultation Slots</h1>
          <p className="page-subtitle">Configure attending physician rosters, specialties, and appointment time slots</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowDocModal(true)}>
          <FiPlus style={{ marginRight: 6 }} /> Add Doctor
        </button>
      </div>

      {alertMsg && <div className="alert alert-warning" style={{ marginBottom: 16 }}>{alertMsg}</div>}

      <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 20, alignItems: "start" }}>
        {/* Physician List */}
        <div className="card" style={{ overflow: "hidden" }}>
          <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontWeight: 700, color: "var(--navy)" }}>Attending Physicians</span>
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{doctors.length} active</span>
          </div>
          <div>
            {doctors.length === 0 ? (
              <div style={{ padding: "32px 20px", textAlign: "center", color: "var(--text-muted)", fontSize: "0.875rem" }}>
                No doctors registered yet.
              </div>
            ) : (
              doctors.map((doc) => {
                const isSelected = doc.doctor_id === selectedDoctorId;
                return (
                  <button
                    key={doc.doctor_id}
                    onClick={() => setSelectedDoctorId(doc.doctor_id)}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "14px 18px",
                      borderBottom: "1px solid var(--border-xs)",
                      background: isSelected ? "#f0f9ff" : "transparent",
                      borderLeft: isSelected ? "3px solid #0284c7" : "3px solid transparent",
                      borderTop: "none",
                      borderRight: "none",
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <div style={{
                      width: 36, height: 36, borderRadius: "50%",
                      background: isSelected ? "#e0f2fe" : "#f1f5f9",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: isSelected ? "#0284c7" : "var(--text-muted)", flexShrink: 0,
                    }}>
                      <FiUser />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: "0.88rem", color: isSelected ? "var(--navy)" : "var(--text-primary)" }}>
                        Dr. {doc.full_name}
                      </div>
                      <div style={{ fontSize: "0.76rem", color: isSelected ? "#0284c7" : "var(--text-muted)" }}>
                        {doc.specialty}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Schedules Table */}
        <div className="card">
          <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <span style={{ fontWeight: 700, color: "var(--navy)" }}>
                {activeDoc ? `Available Slots — Dr. ${activeDoc.full_name}` : "Select a Physician"}
              </span>
              {activeDoc && <span style={{ marginLeft: 8, fontSize: "0.8rem", color: "var(--text-muted)" }}>({schedules.length} slots)</span>}
            </div>
            {activeDoc && (
              <button className="btn btn-success btn-sm" onClick={() => setShowSchedModal(true)}>
                <FiPlus style={{ marginRight: 4 }} /> Add Slot
              </button>
            )}
          </div>

          <div style={{ overflowX: "auto" }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Consultation Date</th>
                  <th>Start Time</th>
                  <th>End Time</th>
                  <th>Availability</th>
                  <th style={{ textAlign: "right" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {schedules.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: "center", padding: "48px 20px" }}>
                      <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#f1f5f9", color: "var(--text-muted)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem", marginBottom: 10 }}>
                        <FiCalendar />
                      </div>
                      <div style={{ fontWeight: 600, color: "var(--navy)", marginBottom: 4 }}>No Slots Scheduled</div>
                      <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", margin: 0 }}>
                        {activeDoc ? "Click 'Add Slot' to configure consultation hours for this physician." : "Select a physician to manage time slots."}
                      </p>
                    </td>
                  </tr>
                ) : (
                  schedules.map((s) => (
                    <tr key={s.schedule_id}>
                      <td style={{ fontWeight: 600, color: "var(--navy)" }}>{s.date}</td>
                      <td className="mono" style={{ fontSize: "0.85rem" }}>{s.start_time}</td>
                      <td className="mono" style={{ fontSize: "0.85rem" }}>{s.end_time}</td>
                      <td>
                        <span style={{
                          background: s.is_available ? "#dcfce7" : "#f1f5f9",
                          color: s.is_available ? "#15803d" : "var(--text-muted)",
                          border: s.is_available ? "1px solid #bbf7d0" : "1px solid #e2e8f0",
                          padding: "2px 10px", borderRadius: 20, fontSize: "0.75rem", fontWeight: 700,
                        }}>
                          {s.is_available ? "Available" : "Booked"}
                        </span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <button
                          className="btn btn-sm"
                          style={{ background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca", padding: "4px 8px" }}
                          onClick={() => handleDeleteSchedule(s.schedule_id)}
                          title="Delete slot"
                        >
                          <FiTrash2 />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Doctor Modal */}
      {showDocModal && (
        <div className="modal-overlay" onClick={() => setShowDocModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 440 }}>
            <div className="modal-header">
              <span className="modal-title">Register Attending Physician</span>
              <button className="modal-close" onClick={() => setShowDocModal(false)}>✕</button>
            </div>
            <form onSubmit={handleAddDoctor}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input className="form-control" required placeholder="e.g. Maria Santos, MD" value={docName} onChange={(e) => setDocName(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Specialty / Department</label>
                  <input className="form-control" required placeholder="Pediatrics, Internal Medicine, etc." value={specialty} onChange={(e) => setSpecialty(e.target.value)} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowDocModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary btn-sm">Save Physician</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Schedule Modal */}
      {showSchedModal && (
        <div className="modal-overlay" onClick={() => setShowSchedModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 440 }}>
            <div className="modal-header">
              <span className="modal-title">Add Consultation Slot</span>
              <button className="modal-close" onClick={() => setShowSchedModal(false)}>✕</button>
            </div>
            <form onSubmit={handleAddSchedule}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Consultation Date</label>
                  <input className="form-control" type="date" required value={schedDate} onChange={(e) => setSchedDate(e.target.value)} />
                </div>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Start Time</label>
                    <input className="form-control" type="time" required value={startTime} onChange={(e) => setStartTime(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">End Time</label>
                    <input className="form-control" type="time" required value={endTime} onChange={(e) => setEndTime(e.target.value)} />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowSchedModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary btn-sm">Add Slot</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getTodaysAppointments } from "../../data/appointments";
import { addToQueue } from "../../data/queue";
import StatusBadge from "../../components/StatusBadge";
import LoadingSpinner from "../../components/LoadingSpinner";
import {
  FiSearch, FiRefreshCw, FiCalendar, FiUsers,
  FiCheckCircle, FiClock, FiPlus
} from "react-icons/fi";

export default function TodaysAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [search,       setSearch]       = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [message,      setMessage]      = useState({ text: "", type: "" });

  async function loadData() {
    setLoading(true);
    const { data } = await getTodaysAppointments();
    setAppointments(data || []);
    setLoading(false);
  }

  useEffect(() => { loadData(); }, []);

  async function handleCheckIn(appt) {
    const { data, error } = await addToQueue(appt.appointment_id);
    if (error) {
      setMessage({ text: `Check-in error: ${error.message}`, type: "error" });
    } else {
      setMessage({ text: `✓ Checked in ${appt.appointment_no} — Queue #${data.queue_no} assigned`, type: "success" });
      loadData();
    }
  }

  const checkedInCount = appointments.filter((a) => ["Checked-in", "Now Serving", "Completed"].includes(a.status)).length;
  const pendingCount   = appointments.filter((a) => a.status === "Booked").length;

  const filtered = appointments.filter((a) => {
    const q = search.toLowerCase();
    const matchesSearch = (a.appointment_no?.toLowerCase() || "").includes(q)
        || (a.profiles?.full_name?.toLowerCase() || "").includes(q);
    const matchesStatus = statusFilter === "all" || a.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) return <LoadingSpinner message="Loading clinic roster…" />;

  return (
    <>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Today's Appointment Roster</h1>
          <p className="page-subtitle">Real-time schedule of pre-booked patient visits and consultation arrivals</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <Link to="/staff/check-in" className="btn btn-primary btn-sm">
            Check-in Station
          </Link>
          <button className="btn btn-ghost btn-sm" onClick={loadData} title="Refresh roster">
            <FiRefreshCw /> Refresh
          </button>
        </div>
      </div>

      {/* Top Metric Cards */}
      <div className="grid-3" style={{ marginBottom: 24 }}>
        <div className="stat-card">
          <div>
            <div className="stat-label">Total Scheduled Today</div>
            <div className="stat-value" style={{ color: "var(--navy)" }}>{appointments.length}</div>
            <div className="stat-hint">Active patient bookings</div>
          </div>
          <div className="stat-icon-wrapper" style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>
            <FiCalendar />
          </div>
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-label">Checked-in & Active</div>
            <div className="stat-value" style={{ color: "var(--green)" }}>{checkedInCount}</div>
            <div className="stat-hint">Patients arrived at clinic</div>
          </div>
          <div className="stat-icon-wrapper" style={{ background: "var(--green-soft)", color: "var(--green)" }}>
            <FiCheckCircle />
          </div>
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-label">Pending Arrival</div>
            <div className="stat-value" style={{ color: "var(--yellow)" }}>{pendingCount}</div>
            <div className="stat-hint">Awaiting triage check-in</div>
          </div>
          <div className="stat-icon-wrapper" style={{ background: "var(--yellow-soft)", color: "var(--yellow)" }}>
            <FiClock />
          </div>
        </div>
      </div>

      {message.text && (
        <div className={`alert alert-${message.type}`} style={{ marginBottom: 20 }}>
          {message.text}
        </div>
      )}

      {/* Roster Card */}
      <div className="card">
        <div className="card-header" style={{ flexWrap: "wrap", gap: 12 }}>
          <span>Scheduled Patients</span>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {/* Search Input */}
            <div style={{ position: "relative" }}>
              <FiSearch style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
              <input
                className="form-control"
                style={{ paddingLeft: 32, width: 230, fontSize: "0.82rem" }}
                placeholder="Search patient or code…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* Filter Buttons */}
            <div style={{ display: "flex", gap: 4 }}>
              {["all", "Booked", "Checked-in", "Completed"].map((s) => (
                <button
                  key={s}
                  className={`btn btn-sm ${statusFilter === s ? "btn-primary" : "btn-ghost"}`}
                  style={{ fontSize: "0.75rem", padding: "4px 10px" }}
                  onClick={() => setStatusFilter(s)}
                >
                  {s === "all" ? "All" : s}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table className="table">
            <thead>
              <tr>
                <th>Appt #</th>
                <th>Patient Name</th>
                <th>Mobile</th>
                <th>Attending Doctor</th>
                <th>Time Slot</th>
                <th>Status</th>
                <th style={{ textAlign: "right" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "48px 20px" }}>
                    <div style={{
                      width: 48, height: 48, borderRadius: "50%",
                      background: "var(--accent-soft)", color: "var(--accent)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      margin: "0 auto 12px", fontSize: "1.4rem"
                    }}>
                      <FiCalendar />
                    </div>
                    <div style={{ fontWeight: 600, color: "var(--text-primary)", marginBottom: 4 }}>
                      {search ? "No matching appointments found" : "No appointments scheduled for today"}
                    </div>
                    <p style={{ color: "var(--text-muted)", fontSize: "0.82rem", margin: 0 }}>
                      {search ? "Try clearing your search query" : "Patients will appear here once booked or checked in."}
                    </p>
                  </td>
                </tr>
              ) : (
                filtered.map((appt) => (
                  <tr key={appt.appointment_id}>
                    <td className="mono" style={{ color: "var(--navy)", fontWeight: 700 }}>
                      {appt.appointment_no}
                    </td>
                    <td style={{ fontWeight: 600 }}>{appt.profiles?.full_name || "Guest Patient"}</td>
                    <td style={{ color: "var(--text-muted)" }}>{appt.profiles?.mobile_no || "—"}</td>
                    <td>{appt.doctors?.full_name ? `Dr. ${appt.doctors.full_name}` : "—"}</td>
                    <td className="mono" style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>
                      {appt.schedules?.start_time} – {appt.schedules?.end_time}
                    </td>
                    <td><StatusBadge status={appt.status} /></td>
                    <td style={{ textAlign: "right" }}>
                      {appt.status === "Booked" && (
                        <button className="btn btn-primary btn-sm" onClick={() => handleCheckIn(appt)}>
                          <FiCheckCircle /> Check In
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

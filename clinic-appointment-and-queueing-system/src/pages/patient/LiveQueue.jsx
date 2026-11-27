import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../components/AuthContext";
import { getTodaysQueue, subscribeToQueue } from "../../data/queue";
import { getClinicOperatingStatus } from "../../data/schedules";
import { getOperatingMode, subscribeToClinicMode } from "../../data/clinicSettings";
import LoadingSpinner from "../../components/LoadingSpinner";
import LobbyReminders from "../../components/LobbyReminders";
import ClinicModeToggle from "../../components/ClinicModeToggle";
import QueueStationGrid from "../../components/QueueStationGrid";
import QueueWaitingList from "../../components/QueueWaitingList";
import { FiClock, FiCalendar, FiArrowRight, FiUsers, FiFilter } from "react-icons/fi";

export default function LiveQueue() {
  const { role } = useAuth();
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [time, setTime] = useState(new Date());
  const [mode, setMode] = useState(getOperatingMode());
  const [doctorFilter, setDoctorFilter] = useState("all");

  async function loadQueue() {
    const { data } = await getTodaysQueue();
    setQueue(data || []);
    setLoading(false);
  }

  useEffect(() => {
    loadQueue();
    const unsubQueue = subscribeToQueue(() => loadQueue());
    const unsubMode = subscribeToClinicMode((newMode) => setMode(newMode));
    const clock = setInterval(() => setTime(new Date()), 1000);

    return () => {
      if (unsubQueue) unsubQueue();
      if (unsubMode) unsubMode();
      clearInterval(clock);
    };
  }, []);

  if (loading) return <LoadingSpinner message="Connecting to clinic queue monitor…" />;

  // Active queue entries (Now Serving + Waiting) currently on the live floor
  const activeQueue = queue.filter((q) => q.status === "Now Serving" || q.status === "Waiting");

  // Dynamic list of physicians with active patients on the floor
  const activeDoctors = [];
  const doctorIds = new Set();
  activeQueue.forEach((q) => {
    const doc = q.appointments?.doctors;
    if (doc?.full_name && !doctorIds.has(doc.full_name)) {
      doctorIds.add(doc.full_name);
      activeDoctors.push(doc);
    }
  });

  const filteredQueue = doctorFilter === "all"
    ? queue
    : queue.filter((q) => q.appointments?.doctors?.full_name === doctorFilter);

  const nowServing = filteredQueue.filter((q) => q.status === "Now Serving");
  const waiting = filteredQueue.filter((q) => q.status === "Waiting");

  const clinicStatus = getClinicOperatingStatus(time, mode);
  const isOffHoursEmpty = !clinicStatus.isOpen && nowServing.length === 0 && waiting.length === 0;
  const isStaffOrAdmin = role === "staff" || role === "admin";

  return (
    <>
      <div className="page-header" style={{ marginBottom: 16 }}>
        <div className="page-header-left">
          <h1 className="page-title">Live Queue Display</h1>
          <p className="page-subtitle">
            Outpatient consultation monitor — real-time queue synchronization across all attending physicians
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          {isStaffOrAdmin && <ClinicModeToggle variant="bar" />}
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            background: clinicStatus.isOpen ? "var(--green-soft)" : "rgba(100, 116, 139, 0.12)",
            color: clinicStatus.isOpen ? "var(--green)" : "var(--text-muted)",
            padding: "6px 14px", borderRadius: 20, fontSize: "0.82rem", fontWeight: 700
          }}>
            <span style={{
              width: 8, height: 8, borderRadius: "50%",
              background: clinicStatus.isOpen ? "var(--green)" : "#94a3b8",
              display: "inline-block",
              boxShadow: clinicStatus.isOpen ? "0 0 8px rgba(34, 197, 94, 0.6)" : "none"
            }} />
            <span>{clinicStatus.badgeText}</span>
          </div>
        </div>
      </div>

      {/* Hospital-Grade Department / Physician Filter Pills */}
      {activeDoctors.length > 1 && (
        <div style={{
          display: "flex", alignItems: "center", gap: 8, overflowX: "auto",
          paddingBottom: 10, marginBottom: 14, userSelect: "none"
        }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: "0.78rem", color: "var(--navy)", fontWeight: 700, paddingRight: 4 }}>
            <FiFilter /> Filter:
          </div>
          <button
            type="button"
            className={`btn btn-sm ${doctorFilter === "all" ? "btn-primary" : "btn-ghost"}`}
            style={{ fontSize: "0.78rem", padding: "4px 12px", height: 32, borderRadius: 20 }}
            onClick={() => setDoctorFilter("all")}
          >
            All Stations ({activeQueue.length})
          </button>
          {activeDoctors.map((doc) => {
            const count = activeQueue.filter((q) => q.appointments?.doctors?.full_name === doc.full_name).length;
            const isSel = doctorFilter === doc.full_name;
            return (
              <button
                key={doc.full_name}
                type="button"
                className={`btn btn-sm ${isSel ? "btn-primary" : "btn-ghost"}`}
                style={{ fontSize: "0.78rem", padding: "4px 12px", height: 32, borderRadius: 20 }}
                onClick={() => setDoctorFilter(doc.full_name)}
              >
                Dr. {doc.full_name} ({count})
              </button>
            );
          })}
        </div>
      )}

      {/* Main Digital Queue TV Display */}
      <div className="card" style={{
        background: "#081b33",
        border: "1px solid #16365c",
        borderRadius: 18,
        padding: 0,
        overflow: "hidden",
        boxShadow: "0 20px 40px rgba(0, 0, 0, 0.35)",
        marginBottom: 24,
      }}>
        {/* Board Header Bar */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "16px 24px", background: "rgba(255, 255, 255, 0.03)",
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)", flexWrap: "wrap", gap: 12
        }}>
          <div>
            <div style={{ fontSize: "0.72rem", letterSpacing: "1.5px", textTransform: "uppercase", color: "#38bdf8", fontWeight: 700 }}>
              Outpatient Department · Multi-Station Monitor
            </div>
            <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "#ffffff", marginTop: 2 }}>
              ClinicCare Active Queue
            </div>
          </div>

          <div style={{
            background: "rgba(0, 0, 0, 0.4)", border: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: 10, padding: "8px 16px", color: "#ffffff",
            fontFamily: "ui-monospace, monospace", fontSize: "1.05rem", fontWeight: 700,
            display: "flex", alignItems: "center", gap: 8
          }}>
            <FiClock style={{ color: "#38bdf8" }} />
            {time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
          </div>
        </div>

        {/* Board Body */}
        {isOffHoursEmpty ? (
          <div style={{ padding: "48px 24px", textAlign: "center" }}>
            <div style={{
              width: 56, height: 56, borderRadius: "50%",
              background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)",
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              fontSize: "1.8rem", color: "#38bdf8", marginBottom: 16
            }}>
              <FiClock />
            </div>

            <div style={{
              background: "rgba(248, 113, 113, 0.15)", color: "#f87171",
              border: "1px solid rgba(248, 113, 113, 0.3)", padding: "4px 14px",
              borderRadius: 20, fontSize: "0.75rem", fontWeight: 700,
              textTransform: "uppercase", letterSpacing: "0.08em",
              width: "fit-content", margin: "0 auto 12px"
            }}>
              Queue Closed (Off-Hours)
            </div>

            <h2 style={{ color: "#ffffff", fontSize: "1.35rem", fontWeight: 800, margin: "0 0 6px" }}>
              Outpatient Department is Currently Closed
            </h2>

            <p style={{ color: "#94a3b8", fontSize: "0.92rem", margin: "0 auto 18px", maxWidth: 520, lineHeight: 1.6 }}>
              {clinicStatus.label}. Regular clinic consultation hours are <strong>Monday to Saturday, 8:00 AM – 5:00 PM</strong>.
              Queue tickets and in-person consultations resume when the clinic reopens.
            </p>

            <div style={{ display: "inline-flex", gap: 12, alignItems: "center", flexWrap: "wrap", justifyContent: "center" }}>
              <Link to="/book" className="btn btn-primary" style={{ padding: "10px 22px", fontSize: "0.88rem" }}>
                <FiCalendar style={{ marginRight: 6 }} /> Book Advance Consultation <FiArrowRight style={{ marginLeft: 6 }} />
              </Link>
            </div>
          </div>
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: 20,
            padding: "22px",
            alignItems: "start",
          }}>
            {/* NOW SERVING COLUMN */}
            <div>
              <div style={{
                color: "#4ade80", fontSize: "0.78rem", fontWeight: 800,
                letterSpacing: "1px", textTransform: "uppercase", marginBottom: 12,
                display: "flex", alignItems: "center", justifyContent: "space-between"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{
                    width: 8, height: 8, borderRadius: "50%", background: "#4ade80",
                    display: "inline-block", boxShadow: "0 0 8px #4ade80"
                  }} />
                  Now Serving Stations
                </div>
                <span style={{
                  background: "rgba(34, 197, 94, 0.15)", color: "#86efac",
                  padding: "2px 8px", borderRadius: 12, fontSize: "0.72rem"
                }}>
                  {nowServing.length} Active
                </span>
              </div>

              {/* Scalable Station Grid */}
              <QueueStationGrid nowServing={nowServing} />
            </div>

            {/* UP NEXT IN LINE COLUMN */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div style={{
                  color: "#93c5fd", fontSize: "0.78rem", fontWeight: 800,
                  letterSpacing: "1px", textTransform: "uppercase",
                  display: "flex", alignItems: "center", gap: 8
                }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#93c5fd", display: "inline-block" }} />
                  Up Next In Line
                </div>
                <span style={{
                  background: "rgba(255,255,255,0.12)", color: "#ffffff",
                  borderRadius: 20, padding: "3px 12px", fontSize: "0.76rem", fontWeight: 700
                }}>
                  {waiting.length} waiting
                </span>
              </div>

              {/* Scrollable Waiting Queue List */}
              <QueueWaitingList waiting={waiting} />
            </div>
          </div>
        )}

        {/* Board Bottom Information Banner */}
        <div className="queue-status-banner">
          <div>
            ⏱ Average consultation: <strong>15–20 minutes</strong> per patient
          </div>
          <div>
            🔔 Chime sounds when your ticket number is announced
          </div>
          <div>
            📱 SMS alerts sent when you are <strong>3 patients away</strong>
          </div>
        </div>
      </div>

      {/* Lobby Reminder Cards */}
      <LobbyReminders />
    </>
  );
}

import React, { useState, useEffect } from "react";
import { getDailyReport, getRecentSmsLogs } from "../../data/reports";
import { getTodayDateString } from "../../data/queue";
import LoadingSpinner from "../../components/LoadingSpinner";
import StatusBadge from "../../components/StatusBadge";
import { FiCalendar, FiUsers, FiClock, FiMessageSquare, FiSend, FiCheckCircle } from "react-icons/fi";

export default function DailyReport() {
  const todayStr = getTodayDateString();
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [report, setReport] = useState(null);
  const [smsLogs, setSmsLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  async function loadReport(date) {
    setLoading(true);
    const [{ data: reportData }, { data: logsData }] = await Promise.all([
      getDailyReport(date),
      getRecentSmsLogs(6),
    ]);
    setReport(reportData);
    setSmsLogs(logsData || []);
    setLoading(false);
  }

  useEffect(() => {
    loadReport(selectedDate);
  }, [selectedDate]);

  const formattedDate = new Date(selectedDate + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <>
      <div className="page-header" style={{ marginBottom: 20 }}>
        <div className="page-header-left">
          <h1 className="page-title">Daily Clinic Report & Analytics</h1>
          <p className="page-subtitle">Consultation volume, waiting times, physician workload, and SMS communication logs</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <input
            className="form-control"
            type="date"
            style={{ paddingLeft: 12, paddingRight: 12, fontWeight: 600, fontSize: "0.85rem", cursor: "pointer" }}
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
          {selectedDate !== todayStr && (
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setSelectedDate(todayStr)}
              style={{ fontSize: "0.8rem" }}
            >
              Today
            </button>
          )}
        </div>
      </div>

      <div style={{ marginBottom: 16, fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 600 }}>
        Analytics for: <span style={{ color: "var(--navy)", fontWeight: 700 }}>{formattedDate}</span>
      </div>

      {loading ? (
        <LoadingSpinner message="Aggregating clinic statistics…" />
      ) : !report ? (
        <div className="card">
          <div className="card-body" style={{ textAlign: "center", padding: "60px 20px" }}>
            <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#f1f5f9", color: "var(--text-muted)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "1.3rem", marginBottom: 12 }}>
              <FiCalendar />
            </div>
            <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--navy)", margin: "0 0 6px" }}>No Records for Selected Date</h3>
            <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", margin: 0 }}>
              There are no clinic visits recorded for {formattedDate}. Try switching the date to view previous records.
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Key Metric Stat Cards */}
          <div className="grid-3" style={{ marginBottom: 24 }}>
            <div className="card" style={{ padding: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)", letterSpacing: "0.05em" }}>
                    Total Daily Visits
                  </div>
                  <div style={{ fontSize: "2rem", fontWeight: 800, color: "var(--navy)", lineHeight: 1.2, marginTop: 4 }}>
                    {report.totalAppointments}
                  </div>
                  <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: 4 }}>
                    Scheduled & walk-in patients
                  </div>
                </div>
                <div style={{ width: 44, height: 44, borderRadius: 10, background: "#f0f9ff", color: "#0284c7", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.25rem" }}>
                  <FiCalendar />
                </div>
              </div>
            </div>

            <div className="card" style={{ padding: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)", letterSpacing: "0.05em" }}>
                    Patients Checked In
                  </div>
                  <div style={{ fontSize: "2rem", fontWeight: 800, color: "var(--navy)", lineHeight: 1.2, marginTop: 4 }}>
                    {report.totalQueueEntries}
                  </div>
                  <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: 4 }}>
                    Entered lobby queue
                  </div>
                </div>
                <div style={{ width: 44, height: 44, borderRadius: 10, background: "#ecfdf5", color: "#059669", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.25rem" }}>
                  <FiUsers />
                </div>
              </div>
            </div>

            <div className="card" style={{ padding: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)", letterSpacing: "0.05em" }}>
                    Avg Waiting Time
                  </div>
                  <div style={{ fontSize: "2rem", fontWeight: 800, color: "var(--navy)", lineHeight: 1.2, marginTop: 4 }}>
                    {report.avgWaitMinutes} <span style={{ fontSize: "1rem", fontWeight: 600, color: "var(--text-secondary)" }}>min</span>
                  </div>
                  <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: 4 }}>
                    Check-in to consultation call
                  </div>
                </div>
                <div style={{ width: 44, height: 44, borderRadius: 10, background: "#fffbeb", color: "#d97706", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.25rem" }}>
                  <FiClock />
                </div>
              </div>
            </div>
          </div>

          {/* Breakdown Grids */}
          <div className="grid-2" style={{ marginBottom: 24 }}>
            {/* Status Breakdown */}
            <div className="card">
              <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontWeight: 700, color: "var(--navy)" }}>Appointments by Status</span>
                <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Breakdown</span>
              </div>
              <div style={{ overflowX: "auto" }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Status Category</th>
                      <th style={{ textAlign: "right" }}>Count</th>
                      <th style={{ textAlign: "right" }}>Share</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(report.statusCounts).map(([status, count]) => {
                      const total = report.totalAppointments || 1;
                      const pct = Math.round((count / total) * 100);
                      return (
                        <tr key={status}>
                          <td>
                            <StatusBadge status={status} />
                          </td>
                          <td style={{ textAlign: "right", fontWeight: 700, color: "var(--navy)" }}>{count}</td>
                          <td style={{ textAlign: "right", color: "var(--text-muted)", fontSize: "0.82rem" }}>
                            {report.totalAppointments > 0 ? `${pct}%` : "0%"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Doctor Load Breakdown */}
            <div className="card">
              <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontWeight: 700, color: "var(--navy)" }}>Physician Consultation Load</span>
                <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Patient distribution</span>
              </div>
              <div style={{ overflowX: "auto" }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Attending Physician</th>
                      <th style={{ textAlign: "right" }}>Patients</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(report.doctorCounts).length === 0 ? (
                      <tr>
                        <td colSpan={2} style={{ textAlign: "center", padding: "28px", color: "var(--text-muted)" }}>
                          No physician visits recorded for this date.
                        </td>
                      </tr>
                    ) : (
                      Object.entries(report.doctorCounts).map(([doc, count]) => (
                        <tr key={doc}>
                          <td style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", color: "var(--navy)", fontWeight: 700 }}>
                                Dr
                              </div>
                              {doc.startsWith("Dr.") ? doc : `Dr. ${doc}`}
                            </div>
                          </td>
                          <td style={{ textAlign: "right", fontWeight: 700, color: "var(--navy)" }}>{count}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* SMS Audit & Dispatch Log */}
          <div className="card">
            <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <FiMessageSquare style={{ color: "var(--accent)" }} />
                <span style={{ fontWeight: 700, color: "var(--navy)" }}>SMS Dispatch Audit Log</span>
              </div>
              <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>Recent Automated Alerts</span>
            </div>

            <div style={{ overflowX: "auto" }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Recipient</th>
                    <th>Message Content</th>
                    <th>Delivery Status</th>
                    <th style={{ textAlign: "right" }}>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {smsLogs.length === 0 ? (
                    <tr>
                      <td colSpan={4} style={{ textAlign: "center", padding: "32px 20px", color: "var(--text-muted)", fontSize: "0.85rem" }}>
                        No SMS notification events recorded yet. SMS notifications trigger automatically upon booking, check-in, and when called.
                      </td>
                    </tr>
                  ) : (
                    smsLogs.map((log) => (
                      <tr key={log.sms_id}>
                        <td className="mono" style={{ fontWeight: 600, color: "var(--navy)", fontSize: "0.85rem" }}>
                          {log.mobile_no}
                        </td>
                        <td style={{ fontSize: "0.82rem", color: "var(--text-secondary)", maxWidth: 380 }}>
                          {log.message}
                        </td>
                        <td>
                          <span style={{
                            background: log.provider_status === "sent" ? "#dcfce7" : "#f1f5f9",
                            color: log.provider_status === "sent" ? "#15803d" : "var(--navy)",
                            border: log.provider_status === "sent" ? "1px solid #bbf7d0" : "1px solid #e2e8f0",
                            padding: "2px 8px",
                            borderRadius: 12,
                            fontSize: "0.72rem",
                            fontWeight: 700,
                            textTransform: "uppercase",
                          }}>
                            {log.provider_status}
                          </span>
                        </td>
                        <td style={{ textAlign: "right", color: "var(--text-muted)", fontSize: "0.8rem" }}>
                          {new Date(log.sent_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </>
  );
}

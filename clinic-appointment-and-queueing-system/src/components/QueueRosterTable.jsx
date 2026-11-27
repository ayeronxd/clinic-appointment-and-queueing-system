import React from "react";
import StatusBadge from "./StatusBadge";
import { FiUsers, FiClock } from "react-icons/fi";

/**
 * QueueRosterTable Component
 * Renders the tabular roster of checked-in and active queue entries for the day.
 */
export default function QueueRosterTable({ queue, waiting, onNoShow }) {
  return (
    <div className="card">
      <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <span style={{ fontWeight: 700, color: "var(--navy)" }}>Today's Queue Roster</span>
          <span style={{ marginLeft: 8, fontSize: "0.8rem", color: "var(--text-muted)" }}>
            ({queue.length} total entries)
          </span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <span style={{
            background: "#f0f9ff", color: "#0284c7",
            border: "1px solid #bae6fd", borderRadius: 20,
            padding: "3px 10px", fontSize: "0.75rem", fontWeight: 700
          }}>
            {waiting.length} Waiting
          </span>
        </div>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table className="table">
          <thead>
            <tr>
              <th style={{ width: 90 }}>Queue #</th>
              <th>Appt #</th>
              <th>Patient Name</th>
              <th>Assigned Physician</th>
              <th>Status</th>
              <th>Check-in Time</th>
              <th style={{ textAlign: "right" }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {queue.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", padding: "48px 20px" }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: "50%",
                    background: "#f1f5f9", color: "var(--text-muted)",
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                    fontSize: "1.2rem", marginBottom: 10
                  }}>
                    <FiUsers />
                  </div>
                  <div style={{ fontWeight: 600, color: "var(--navy)", marginBottom: 4 }}>
                    Queue is Empty
                  </div>
                  <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", margin: 0 }}>
                    Checked-in patients and registered walk-ins will automatically appear in this list.
                  </p>
                </td>
              </tr>
            ) : (
              queue.map((item) => {
                const isServing = item.status === "Now Serving";
                return (
                  <tr key={item.queue_id} style={{ background: isServing ? "rgba(240, 253, 244, 0.5)" : "transparent" }}>
                    <td>
                      <span className="mono" style={{
                        fontWeight: 800, fontSize: "1rem",
                        color: isServing ? "#15803d" : "var(--navy)"
                      }}>
                        #{String(item.queue_no).padStart(3, "0")}
                      </span>
                    </td>
                    <td className="mono" style={{ color: "var(--text-secondary)", fontSize: "0.82rem" }}>
                      {item.appointments?.appointment_no || "Walk-in"}
                    </td>
                    <td style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                      {item.appointments?.profiles?.full_name || "Walk-in Patient"}
                    </td>
                    <td style={{ color: "var(--text-secondary)" }}>
                      {item.appointments?.doctors?.full_name ? `Dr. ${item.appointments.doctors.full_name}` : "General Physician"}
                    </td>
                    <td>
                      <StatusBadge status={item.status} />
                    </td>
                    <td style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>
                      <FiClock style={{ marginRight: 5, verticalAlign: "-2px" }} />
                      {item.checked_in_at
                        ? new Date(item.checked_in_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                        : "—"}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      {item.status === "Waiting" && (
                        <button
                          className="btn btn-sm"
                          style={{
                            background: "#fef2f2", color: "#dc2626",
                            border: "1px solid #fecaca", fontSize: "0.78rem", fontWeight: 600
                          }}
                          onClick={() => onNoShow(item.queue_id)}
                        >
                          No-show
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

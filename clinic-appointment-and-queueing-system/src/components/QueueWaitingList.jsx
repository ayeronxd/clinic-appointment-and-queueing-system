import React from "react";
import StatusBadge from "./StatusBadge";
import { FiClock, FiUsers } from "react-icons/fi";

/**
 * QueueWaitingList Component
 * Displays the upcoming lobby queue tickets waiting for consultation.
 * Capped with internal scrolling so large hospital queues never stretch the TV screen.
 */
export default function QueueWaitingList({ waiting }) {
  return (
    <div
      style={{
        background: "rgba(0, 0, 0, 0.25)",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        borderRadius: 14,
        overflow: "hidden",
        flex: 1,
        display: "flex",
        flexDirection: "column",
        minHeight: 280,
      }}
    >
      {waiting.length === 0 ? (
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            padding: "36px 20px",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "2.4rem", color: "#64748b", marginBottom: 10 }}>
            <FiClock />
          </div>
          <div style={{ color: "#ffffff", fontWeight: 700, fontSize: "1.1rem", marginBottom: 4 }}>
            Queue is Clear
          </div>
          <div style={{ color: "#94a3b8", fontSize: "0.85rem", maxWidth: 300 }}>
            No patients currently waiting. Check in at the kiosk or triage desk to be queued.
          </div>
        </div>
      ) : (
        <>
          <div
            style={{
              overflowY: "auto",
              maxHeight: 380,
              padding: "4px 0",
            }}
          >
            {waiting.map((item, i) => {
              const docName = item.appointments?.doctors?.full_name
                ? `Dr. ${item.appointments.doctors.full_name}`
                : "General Duty";

              return (
                <div
                  key={item.queue_id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    padding: "12px 18px",
                    borderBottom: i < waiting.length - 1 ? "1px solid rgba(255, 255, 255, 0.06)" : "none",
                    background: i === 0 ? "rgba(250, 204, 21, 0.06)" : "transparent",
                    transition: "background 0.15s ease",
                  }}
                >
                  <span
                    style={{
                      color: i === 0 ? "#facc15" : "#94a3b8",
                      fontSize: "0.74rem",
                      fontWeight: 800,
                      background: i === 0 ? "rgba(250, 204, 21, 0.15)" : "rgba(255, 255, 255, 0.08)",
                      padding: "2px 8px",
                      borderRadius: 6,
                    }}
                  >
                    #{i + 1}
                  </span>

                  <span
                    style={{
                      fontFamily: "ui-monospace, monospace",
                      fontWeight: 800,
                      fontSize: "1.25rem",
                      color: "#facc15",
                      letterSpacing: "0.5px",
                    }}
                  >
                    #{String(item.queue_no).padStart(3, "0")}
                  </span>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        color: "#ffffff",
                        fontSize: "0.88rem",
                        fontWeight: 600,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {docName}
                    </div>
                    <div style={{ color: "#94a3b8", fontSize: "0.74rem" }}>
                      {item.appointments?.doctors?.specialty || "Outpatient Triage"}
                    </div>
                  </div>

                  <StatusBadge status={item.status} />
                </div>
              );
            })}
          </div>

          {waiting.length > 5 && (
            <div
              style={{
                padding: "8px 16px",
                background: "rgba(255,255,255,0.03)",
                borderTop: "1px solid rgba(255,255,255,0.06)",
                fontSize: "0.75rem",
                color: "#94a3b8",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span>Showing all upcoming lobby tickets</span>
              <span style={{ fontWeight: 700, color: "#cbd5e1" }}>{waiting.length} Total</span>
            </div>
          )}
        </>
      )}
    </div>
  );
}

import React from "react";
import { FiClock, FiMapPin, FiActivity } from "react-icons/fi";

/**
 * QueueStationGrid Component
 * Hospital-grade scalable grid displaying active physician consultation stations.
 * Automatically adapts whether 1, 2, 4, or 10 doctors are simultaneously serving.
 */
export default function QueueStationGrid({ nowServing }) {
  if (nowServing.length === 0) {
    return (
      <div
        className="queue-serving-card"
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          borderColor: "#1e3a5f",
          background: "rgba(255,255,255,0.02)",
          boxShadow: "none",
          minHeight: 280,
          padding: "36px 20px",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: "2.4rem", color: "#64748b", marginBottom: 10 }}>
          <FiClock />
        </div>
        <div style={{ color: "#ffffff", fontWeight: 700, fontSize: "1.1rem", marginBottom: 4 }}>
          Consultation Rooms Standing By
        </div>
        <div style={{ color: "#94a3b8", fontSize: "0.85rem", maxWidth: 320 }}>
          Attending physicians will call the next ticket number when ready.
        </div>
      </div>
    );
  }

  // Multi-station layout: If 1 station, show prominent hero card; if 2+, show compact responsive grid
  const isMulti = nowServing.length > 1;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: isMulti ? "repeat(auto-fit, minmax(220px, 1fr))" : "1fr",
        gap: 14,
        alignContent: "start",
      }}
    >
      {nowServing.map((item, idx) => {
        const doctorName = item.appointments?.doctors?.full_name
          ? `Dr. ${item.appointments.doctors.full_name}`
          : "General Physician";
        const specialty = item.appointments?.doctors?.specialty || "Outpatient Care";
        const stationNo = idx + 1;

        return (
          <div
            key={item.queue_id}
            className="queue-serving-card"
            style={{
              padding: isMulti ? "18px 16px" : "26px 20px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              minHeight: isMulti ? 180 : 260,
              background: "linear-gradient(180deg, #0d2847 0%, #07192d 100%)",
              border: "1.5px solid #22c55e",
              borderRadius: 14,
              boxShadow: "0 0 20px rgba(34, 197, 94, 0.15)",
              textAlign: "center",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Station Header Pill */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                borderBottom: "1px solid rgba(255,255,255,0.08)",
                paddingBottom: 8,
                marginBottom: 8,
              }}
            >
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  color: "#86efac",
                  fontSize: "0.74rem",
                  fontWeight: 800,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                <span
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: "#22c55e",
                    boxShadow: "0 0 6px #22c55e",
                  }}
                />
                Station {stationNo}
              </div>

              <span
                style={{
                  fontSize: "0.7rem",
                  color: "#93c5fd",
                  fontWeight: 600,
                  background: "rgba(56, 189, 248, 0.12)",
                  padding: "2px 8px",
                  borderRadius: 12,
                }}
              >
                In Consultation
              </span>
            </div>

            {/* Calling Ticket Number */}
            <div
              className="queue-number"
              style={{
                fontSize: isMulti ? "clamp(2.4rem, 5vw, 3.2rem)" : "clamp(3.4rem, 7vw, 4.8rem)",
                margin: "4px 0",
                lineHeight: 1,
              }}
            >
              #{String(item.queue_no).padStart(3, "0")}
            </div>

            {/* Physician & Room Assignment */}
            <div style={{ marginTop: 6 }}>
              <div
                style={{
                  color: "#ffffff",
                  fontWeight: 700,
                  fontSize: isMulti ? "0.92rem" : "1.05rem",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {doctorName}
              </div>
              <div
                style={{
                  color: "#94a3b8",
                  fontSize: "0.76rem",
                  marginTop: 2,
                }}
              >
                {specialty}
              </div>
              <div
                style={{
                  color: "#38bdf8",
                  fontSize: "0.74rem",
                  marginTop: 6,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  fontWeight: 600,
                }}
              >
                <FiMapPin /> Room {100 + stationNo}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

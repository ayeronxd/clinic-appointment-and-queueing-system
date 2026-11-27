import React from "react";
import { QRCodeSVG } from "qrcode.react";
import { FiInfo, FiPrinter } from "react-icons/fi";

/**
 * QRCodeCard Component
 * Structured Clinical Appointment Pass / Ticket
 */
export default function QRCodeCard({ appointmentNo, doctorName, date, time }) {
  if (!appointmentNo) return null;

  function formatDisplayTime(t) {
    if (!t) return "";
    const parts = t.split(":");
    if (parts.length < 2) return t;
    let hour = parseInt(parts[0], 10);
    const minute = parts[1];
    const ampm = hour >= 12 ? "PM" : "AM";
    hour = hour % 12 || 12;
    return `${hour}:${minute} ${ampm}`;
  }

  function formatDisplayDate(d) {
    if (!d) return "";
    try {
      const dt = new Date(d + "T00:00:00");
      return dt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    } catch {
      return d;
    }
  }

  return (
    <div className="card" style={{ overflow: "hidden", border: "1px solid #cbd5e1" }}>
      {/* Ticket Header */}
      <div style={{
        background: "linear-gradient(145deg, #0f2744 0%, #0a1d35 100%)",
        color: "#ffffff",
        padding: "18px 20px",
        textAlign: "center",
      }}>
        <div style={{
          display: "inline-block",
          background: "rgba(56, 189, 248, 0.2)",
          color: "#38bdf8",
          border: "1px solid rgba(56, 189, 248, 0.3)",
          fontSize: "0.72rem",
          fontWeight: 700,
          letterSpacing: "0.08em",
          padding: "3px 12px",
          borderRadius: 12,
          marginBottom: 8,
          textTransform: "uppercase",
        }}>
          Express Check-in Pass
        </div>
        <h2 className="mono" style={{ fontSize: "1.3rem", fontWeight: 800, margin: 0, color: "#ffffff", letterSpacing: "0.03em" }}>
          {appointmentNo}
        </h2>
      </div>

      <div style={{ padding: "24px 20px", textAlign: "center" }}>
        {/* Scannable QR Frame */}
        <div style={{
          display: "inline-flex",
          padding: 14,
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: 12,
          boxShadow: "0 4px 12px rgba(15, 23, 42, 0.06)",
          marginBottom: 16,
        }}>
          <QRCodeSVG value={appointmentNo} size={190} level="H" includeMargin={true} />
        </div>

        <div style={{
          background: "#f0f9ff",
          border: "1px solid #bae6fd",
          borderRadius: 8,
          padding: "10px 14px",
          fontSize: "0.82rem",
          color: "#0369a1",
          textAlign: "left",
          lineHeight: 1.45,
          marginBottom: 18,
          display: "flex",
          gap: 8,
          alignItems: "flex-start",
        }}>
          <FiInfo style={{ flexShrink: 0, marginTop: 2, fontSize: "0.95rem" }} />
          <span>Present this QR code at the reception kiosk or triage desk upon arrival.</span>
        </div>

        {doctorName && (
          <div style={{ borderTop: "1px solid var(--border-xs)", paddingTop: 14, marginBottom: 16, textAlign: "left" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700, display: "block" }}>
                  Attending Doctor
                </span>
                <strong style={{ fontSize: "0.85rem", color: "var(--navy)" }}>Dr. {doctorName}</strong>
              </div>
              <div>
                <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700, display: "block" }}>
                  Scheduled Slot
                </span>
                <strong style={{ fontSize: "0.85rem", color: "var(--navy)" }}>
                  {formatDisplayDate(date)} {formatDisplayTime(time)}
                </strong>
              </div>
            </div>
          </div>
        )}

        <button
          type="button"
          className="btn btn-ghost btn-sm"
          style={{ width: "100%", justifyContent: "center", fontSize: "0.82rem" }}
          onClick={() => window.print()}
        >
          <FiPrinter style={{ marginRight: 6 }} /> Print / Save Pass
        </button>
      </div>
    </div>
  );
}

import React from "react";
import { Link } from "react-router-dom";
import { FiInfo, FiCheckCircle } from "react-icons/fi";

export default function LobbyReminders() {
  return (
    <div className="grid-2" style={{ marginTop: 24 }}>
      <div className="card" style={{ padding: 20 }}>
        <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
          <div style={{
            width: 36, height: 36, borderRadius: "50%",
            background: "var(--accent-soft)", color: "var(--accent)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "1.1rem", flexShrink: 0
          }}>
            <FiInfo />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--text-primary)", marginBottom: 4 }}>
              Waiting in the Clinic Lobby?
            </div>
            <p style={{ color: "var(--text-muted)", fontSize: "0.83rem", margin: 0, lineHeight: 1.5 }}>
              Make sure you have confirmed your arrival with the triage nurse so your appointment number is placed on this active queue display.
            </p>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 20 }}>
        <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
          <div style={{
            width: 36, height: 36, borderRadius: "50%",
            background: "var(--green-soft)", color: "var(--green)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "1.1rem", flexShrink: 0
          }}>
            <FiCheckCircle />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--text-primary)", marginBottom: 4 }}>
              Have an Active Pass?
            </div>
            <p style={{ color: "var(--text-muted)", fontSize: "0.83rem", margin: 0, lineHeight: 1.5 }}>
              View your <Link to="/patient" style={{ color: "var(--accent)", fontWeight: 600, textDecoration: "underline" }}>digital pass</Link> to show your barcode or QR code at the triage kiosk for express check-in.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

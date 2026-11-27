import React, { useState, useEffect } from "react";
import { getOperatingMode, setOperatingMode, subscribeToClinicMode } from "../data/clinicSettings";
import { FiCheck, FiPower, FiClock, FiSettings } from "react-icons/fi";

export default function ClinicModeToggle({ variant = "bar" }) {
  const [mode, setMode] = useState(getOperatingMode());
  const [openDropdown, setOpenDropdown] = useState(false);

  useEffect(() => {
    const unsub = subscribeToClinicMode((newMode) => {
      setMode(newMode);
    });
    return () => unsub();
  }, []);

  function handleSelect(newMode) {
    setOperatingMode(newMode);
    setOpenDropdown(false);
  }

  if (variant === "navbar") {
    const isOpen = mode === "open" || (mode === "auto" && new Date().getDay() !== 0 && new Date().getHours() >= 8 && new Date().getHours() < 17);
    return (
      <div style={{ position: "relative" }}>
        <button
          type="button"
          onClick={() => setOpenDropdown(!openDropdown)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            background: isOpen ? "#ecfdf5" : "#fef2f2",
            color: isOpen ? "#059669" : "#dc2626",
            border: isOpen ? "1px solid #a7f3d0" : "1px solid #fecaca",
            borderRadius: 20,
            padding: "4px 10px",
            fontSize: "0.74rem",
            fontWeight: 700,
            cursor: "pointer",
            transition: "all 0.15s ease",
          }}
          title="Click to toggle clinic operating status"
        >
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: isOpen ? "#10b981" : "#ef4444",
              boxShadow: isOpen ? "0 0 6px rgba(16,185,129,0.6)" : "none",
            }}
          />
          <span>{mode === "auto" ? (isOpen ? "Clinic: Open (Auto)" : "Clinic: Closed (Auto)") : mode === "open" ? "Clinic: OPEN" : "Clinic: CLOSED"}</span>
        </button>

        {openDropdown && (
          <>
            <div
              style={{ position: "fixed", inset: 0, zIndex: 998 }}
              onClick={() => setOpenDropdown(false)}
            />
            <div
              style={{
                position: "absolute",
                top: "calc(100% + 6px)",
                right: 0,
                width: 220,
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: 10,
                boxShadow: "0 10px 25px rgba(15, 23, 42, 0.15)",
                padding: 6,
                zIndex: 999,
              }}
            >
              <div style={{ padding: "6px 10px", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)" }}>
                Clinic Operating Gate
              </div>

              <button
                type="button"
                onClick={() => handleSelect("open")}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "8px 10px",
                  borderRadius: 6,
                  border: "none",
                  background: mode === "open" ? "#ecfdf5" : "transparent",
                  color: mode === "open" ? "#065f46" : "var(--text-primary)",
                  fontWeight: mode === "open" ? 700 : 500,
                  fontSize: "0.82rem",
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <span>● Force Open (Live Now)</span>
                {mode === "open" && <FiCheck />}
              </button>

              <button
                type="button"
                onClick={() => handleSelect("closed")}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "8px 10px",
                  borderRadius: 6,
                  border: "none",
                  background: mode === "closed" ? "#fef2f2" : "transparent",
                  color: mode === "closed" ? "#991b1b" : "var(--text-primary)",
                  fontWeight: mode === "closed" ? 700 : 500,
                  fontSize: "0.82rem",
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <span>○ Force Closed (Off-Hours)</span>
                {mode === "closed" && <FiCheck />}
              </button>

              <button
                type="button"
                onClick={() => handleSelect("auto")}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "8px 10px",
                  borderRadius: 6,
                  border: "none",
                  background: mode === "auto" ? "#f0f9ff" : "transparent",
                  color: mode === "auto" ? "#0369a1" : "var(--text-primary)",
                  fontWeight: mode === "auto" ? 700 : 500,
                  fontSize: "0.82rem",
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <span>⏱ Auto (Mon–Sat 8AM–5PM)</span>
                {mode === "auto" && <FiCheck />}
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  // Variant: "bar" (for Queue Control and Live Queue headers)
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        background: "#ffffff",
        border: "1px solid #cbd5e1",
        borderRadius: 10,
        padding: 3,
        gap: 3,
      }}
    >
      <button
        type="button"
        onClick={() => setOperatingMode("open")}
        style={{
          border: "none",
          padding: "6px 12px",
          borderRadius: 8,
          fontSize: "0.78rem",
          fontWeight: 700,
          cursor: "pointer",
          background: mode === "open" ? "#10b981" : "transparent",
          color: mode === "open" ? "#ffffff" : "var(--text-secondary)",
          transition: "all 0.15s ease",
          display: "flex",
          alignItems: "center",
          gap: 5,
        }}
      >
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: mode === "open" ? "#ffffff" : "#10b981" }} />
        Force Open
      </button>

      <button
        type="button"
        onClick={() => setOperatingMode("closed")}
        style={{
          border: "none",
          padding: "6px 12px",
          borderRadius: 8,
          fontSize: "0.78rem",
          fontWeight: 700,
          cursor: "pointer",
          background: mode === "closed" ? "#ef4444" : "transparent",
          color: mode === "closed" ? "#ffffff" : "var(--text-secondary)",
          transition: "all 0.15s ease",
          display: "flex",
          alignItems: "center",
          gap: 5,
        }}
      >
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: mode === "closed" ? "#ffffff" : "#ef4444" }} />
        Force Closed
      </button>

      <button
        type="button"
        onClick={() => setOperatingMode("auto")}
        style={{
          border: "none",
          padding: "6px 12px",
          borderRadius: 8,
          fontSize: "0.78rem",
          fontWeight: 700,
          cursor: "pointer",
          background: mode === "auto" ? "var(--navy)" : "transparent",
          color: mode === "auto" ? "#ffffff" : "var(--text-muted)",
          transition: "all 0.15s ease",
        }}
        title="Follows regular Monday to Saturday 8:00 AM – 5:00 PM schedule"
      >
        Auto Schedule
      </button>
    </div>
  );
}

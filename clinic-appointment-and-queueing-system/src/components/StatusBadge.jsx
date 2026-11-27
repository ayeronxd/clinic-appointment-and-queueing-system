import React from "react";

/**
 * StatusBadge Component
 * Clinical High-Contrast Status Badges strictly matching SRS definitions:
 * - Booked: Gray
 * - Checked-in: Blue
 * - Now Serving: Green
 * - Completed: Dark Navy
 * - Cancelled: Red
 * - No-show: Orange
 */
export default function StatusBadge({ status }) {
  const getBadgeStyle = (statusName) => {
    switch (statusName) {
      case "Booked":
        return { bg: "#f1f5f9", text: "#475569", border: "#cbd5e1", dot: "#64748b" };
      case "Checked-in":
      case "Waiting":
        return { bg: "#f0f9ff", text: "#0369a1", border: "#bae6fd", dot: "#0284c7" };
      case "Now Serving":
        return { bg: "#f0fdf4", text: "#15803d", border: "#bbf7d0", dot: "#16a34a" };
      case "Completed":
        return { bg: "#f8fafc", text: "#0f172a", border: "#94a3b8", dot: "#1e293b" };
      case "Cancelled":
        return { bg: "#fef2f2", text: "#b91c1c", border: "#fecaca", dot: "#dc2626" };
      case "No-show":
        return { bg: "#fff7ed", text: "#c2410c", border: "#fed7aa", dot: "#ea580c" };
      default:
        return { bg: "#f8fafc", text: "#334155", border: "#e2e8f0", dot: "#64748b" };
    }
  };

  const style = getBadgeStyle(status);

  return (
    <span
      className="d-inline-flex align-items-center px-2 py-1 rounded"
      style={{
        backgroundColor: style.bg,
        color: style.text,
        border: `1px solid ${style.border}`,
        fontSize: "0.82rem",
        fontWeight: 600,
        letterSpacing: "0.2px",
      }}
    >
      <span
        style={{
          width: "7px",
          height: "7px",
          borderRadius: "50%",
          backgroundColor: style.dot,
          marginRight: "6px",
          display: "inline-block",
        }}
      />
      {status || "Unknown"}
    </span>
  );
}

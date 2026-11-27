import React, { useState, useEffect } from "react";
import { getStaffAccounts, createStaffAccount, deactivateStaffAccount, activateStaffAccount } from "../../data/profiles";
import LoadingSpinner from "../../components/LoadingSpinner";
import { FiPlus, FiUserCheck, FiUserX, FiShield, FiUsers, FiUser } from "react-icons/fi";

export default function StaffAccounts() {
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newStaff, setNewStaff] = useState({ fullName: "", email: "", mobileNo: "", password: "", role: "staff" });
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  async function loadStaff() {
    setLoading(true);
    const { data } = await getStaffAccounts();
    setStaffList(data || []);
    setLoading(false);
  }

  useEffect(() => {
    loadStaff();
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    setErrorMsg("");
    const { error } = await createStaffAccount(newStaff);
    if (error) {
      setErrorMsg(error.message);
      return;
    }
    setSuccessMsg("Staff account created successfully.");
    setShowModal(false);
    setNewStaff({ fullName: "", email: "", mobileNo: "", password: "", role: "staff" });
    loadStaff();
  }

  async function toggleStatus(staff) {
    if (staff.is_active) await deactivateStaffAccount(staff.user_id);
    else await activateStaffAccount(staff.user_id);
    loadStaff();
  }

  if (loading) return <LoadingSpinner message="Loading staff accounts…" />;

  const set = (key) => (e) => setNewStaff({ ...newStaff, [key]: e.target.value });

  const activeCount = staffList.filter((s) => s.is_active).length;
  const adminCount = staffList.filter((s) => s.role === "admin").length;

  return (
    <>
      <div className="page-header" style={{ marginBottom: 20 }}>
        <div className="page-header-left">
          <h1 className="page-title">Staff & Personnel</h1>
          <p className="page-subtitle">Manage clinic receptionist, nurse, and administrative user access</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <FiPlus style={{ marginRight: 6 }} /> Add Staff Member
        </button>
      </div>

      {errorMsg && <div className="alert alert-error" style={{ marginBottom: 16 }}>{errorMsg}</div>}
      {successMsg && <div className="alert alert-success" style={{ marginBottom: 16 }}>{successMsg}</div>}

      {/* Summary Stat Cards */}
      <div className="grid-3" style={{ marginBottom: 20 }}>
        <div className="card" style={{ padding: "14px 18px", display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 42, height: 42, borderRadius: 10, background: "#f0f9ff", color: "#0284c7", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem" }}>
            <FiUsers />
          </div>
          <div>
            <div style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)", letterSpacing: "0.05em" }}>Total Accounts</div>
            <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--navy)", lineHeight: 1.2 }}>{staffList.length}</div>
          </div>
        </div>

        <div className="card" style={{ padding: "14px 18px", display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 42, height: 42, borderRadius: 10, background: "#ecfdf5", color: "#059669", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem" }}>
            <FiUserCheck />
          </div>
          <div>
            <div style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)", letterSpacing: "0.05em" }}>Active Access</div>
            <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--navy)", lineHeight: 1.2 }}>{activeCount}</div>
          </div>
        </div>

        <div className="card" style={{ padding: "14px 18px", display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 42, height: 42, borderRadius: 10, background: "#faf5ff", color: "#7c3aed", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem" }}>
            <FiShield />
          </div>
          <div>
            <div style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)", letterSpacing: "0.05em" }}>Administrators</div>
            <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--navy)", lineHeight: 1.2 }}>{adminCount}</div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <span style={{ fontWeight: 700, color: "var(--navy)" }}>Clinic Personnel Directory</span>
            <span style={{ marginLeft: 8, fontSize: "0.8rem", color: "var(--text-muted)" }}>({staffList.length} registered)</span>
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table className="table">
            <thead>
              <tr>
                <th>Personnel</th>
                <th>Email Address</th>
                <th>Contact Mobile</th>
                <th>System Role</th>
                <th>Access Status</th>
                <th style={{ textAlign: "right" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {staffList.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "48px 20px" }}>
                    <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#f1f5f9", color: "var(--text-muted)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem", marginBottom: 10 }}>
                      <FiUsers />
                    </div>
                    <div style={{ fontWeight: 600, color: "var(--navy)", marginBottom: 4 }}>No Staff Accounts Yet</div>
                    <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", margin: 0 }}>
                      Click <strong>"Add Staff Member"</strong> to provision access for nurses or receptionists.
                    </p>
                  </td>
                </tr>
              ) : (
                staffList.map((s) => {
                  const initials = (s.full_name || "Staff")
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .substring(0, 2)
                    .toUpperCase();

                  return (
                    <tr key={s.user_id}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{ width: 34, height: 34, borderRadius: "50%", background: s.role === "admin" ? "#e0e7ff" : "#f1f5f9", color: s.role === "admin" ? "#3730a3" : "var(--navy)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.78rem", fontWeight: 700, flexShrink: 0 }}>
                            {initials}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>{s.full_name}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>{s.email}</td>
                      <td className="mono" style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>{s.mobile_no || "—"}</td>
                      <td>
                        <span style={{
                          background: s.role === "admin" ? "#eff6ff" : "#f8fafc",
                          color: s.role === "admin" ? "#1d4ed8" : "var(--navy)",
                          border: s.role === "admin" ? "1px solid #bfdbfe" : "1px solid #e2e8f0",
                          padding: "2px 10px",
                          borderRadius: 20,
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          textTransform: "capitalize",
                        }}>
                          {s.role}
                        </span>
                      </td>
                      <td>
                        <span style={{
                          background: s.is_active ? "#dcfce7" : "#fee2e2",
                          color: s.is_active ? "#15803d" : "#b91c1c",
                          border: s.is_active ? "1px solid #bbf7d0" : "1px solid #fecaca",
                          padding: "2px 10px",
                          borderRadius: 20,
                          fontSize: "0.75rem",
                          fontWeight: 700,
                        }}>
                          {s.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <button
                          className="btn btn-sm btn-ghost"
                          onClick={() => toggleStatus(s)}
                          style={{ fontSize: "0.8rem", color: s.is_active ? "var(--red)" : "var(--green)" }}
                        >
                          {s.is_active ? <><FiUserX style={{ marginRight: 4 }} /> Deactivate</> : <><FiUserCheck style={{ marginRight: 4 }} /> Activate</>}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Staff Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 460 }}>
            <div className="modal-header">
              <span className="modal-title">Create Clinic Personnel</span>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input className="form-control" required placeholder="e.g. Nurse Jane Reyes" value={newStaff.fullName} onChange={set("fullName")} />
                </div>
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input className="form-control" type="email" required placeholder="jane.reyes@clinic.com" value={newStaff.email} onChange={set("email")} />
                </div>
                <div className="form-group">
                  <label className="form-label">Mobile Number (SMS)</label>
                  <input className="form-control" required placeholder="09171234567" value={newStaff.mobileNo} onChange={set("mobileNo")} />
                </div>
                <div className="form-group">
                  <label className="form-label">Initial Password</label>
                  <input className="form-control" type="password" required placeholder="••••••••" value={newStaff.password} onChange={set("password")} />
                </div>
                <div className="form-group">
                  <label className="form-label">Assigned Role</label>
                  <select className="form-select" value={newStaff.role} onChange={set("role")}>
                    <option value="staff">Clinic Staff (Receptionist / Triage Nurse)</option>
                    <option value="admin">System Administrator</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary btn-sm">Provision Account</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signUp, formatAuthError } from "../../data/auth";
import { getRegions, getProvinces, getCities, getBarangays } from "../../data/psgc";
import AuthHero from "../../components/AuthHero";
import { getClinicOperatingStatus } from "../../data/schedules";
import { getOperatingMode } from "../../data/clinicSettings";
import { FiEye, FiEyeOff } from "react-icons/fi";

export default function Register() {
  const [form, setForm] = useState({
    fullName: "", mobileNo: "", email: "", password: "", confirmPassword: "", consent: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Address PSGC dropdown states
  const [regions, setRegions]     = useState([]);
  const [provinces, setProvinces] = useState([]);
  const [cities, setCities]       = useState([]);
  const [barangays, setBarangays] = useState([]);
  const [region, setRegion]       = useState("");
  const [province, setProvince]   = useState("");
  const [city, setCity]           = useState("");
  const [barangay, setBarangay]   = useState("");

  const [fieldErrors, setFieldErrors] = useState({});
  const [errorMsg, setErrorMsg]       = useState("");
  const [submitting, setSubmitting]   = useState(false);
  const navigate = useNavigate();
  const clinicStatus = getClinicOperatingStatus(new Date(), getOperatingMode());

  useEffect(() => { getRegions().then((d) => setRegions(d || [])).catch(() => {}); }, []);
  useEffect(() => {
    if (!region) { setProvinces([]); setCities([]); setBarangays([]); return; }
    getProvinces(region).then((d) => setProvinces(d || []));
  }, [region]);
  useEffect(() => {
    if (!province) { setCities([]); setBarangays([]); return; }
    getCities(province).then((d) => setCities(d || []));
  }, [province]);
  useEffect(() => {
    if (!city) { setBarangays([]); return; }
    getBarangays(city).then((d) => setBarangays(d || []));
  }, [city]);

  function validate() {
    const errs = {};
    if (!form.fullName.trim() || form.fullName.trim().length < 2) {
      errs.fullName = "Please enter your full legal name.";
    }
    const cleanMobile = form.mobileNo.replace(/[^0-9]/g, "");
    if (!cleanMobile) {
      errs.mobileNo = "Mobile number is required.";
    } else if (!/^09\d{9}$/.test(cleanMobile)) {
      errs.mobileNo = "Must be an 11-digit Philippine mobile starting with 09 (e.g. 09171234567).";
    }
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      errs.email = "Please provide a valid email address.";
    }
    if (!region || !province || !city || !barangay) {
      errs.address = "Please select all address levels.";
    }
    if (!form.password) {
      errs.password = "Password is required.";
    } else if (form.password.length < 6) {
      errs.password = "Password must be at least 6 characters long.";
    }
    if (form.password !== form.confirmPassword) {
      errs.confirmPassword = "Passwords do not match.";
    }
    if (!form.consent) {
      errs.consent = "You must accept the Data Privacy consent to register.";
    }
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMsg("");
    if (!validate()) return;
    setSubmitting(true);

    const address = `${barangay}, ${city}, ${province}`;
    const cleanMobile = form.mobileNo.replace(/[^0-9]/g, "");

    const { error } = await signUp({
      email: form.email.trim(), password: form.password,
      fullName: form.fullName.trim(), mobileNo: cleanMobile, address,
    });

    if (error) {
      setErrorMsg(formatAuthError(error));
      setSubmitting(false);
      return;
    }
    navigate("/login");
  }

  const set = (key) => (e) => {
    setForm({ ...form, [key]: e.target.value });
    if (fieldErrors[key]) setFieldErrors({ ...fieldErrors, [key]: "" });
  };

  return (
    <div className="auth-page">
      <AuthHero
        headline="Patient Account Registration"
        description="Create your personal patient portal to schedule consultations, receive SMS arrival alerts, and access digital QR passes."
      />

      <div className="auth-right scrollable">
        <div className="auth-card" style={{ maxWidth: 520 }}>
          {/* Mobile Brand Header */}
          <div className="auth-mobile-header">
            <div className="auth-mobile-brand">
              <div className="auth-mobile-icon">✚</div>
              <div>
                <div className="auth-mobile-title">ClinicCare</div>
                <div className="auth-mobile-sub">Queue & Appointments</div>
              </div>
            </div>
            <div className="auth-mobile-status">
              <span
                className="auth-clinic-dot"
                style={{
                  background: clinicStatus.isOpen ? "#10b981" : "#ef4444",
                  boxShadow: clinicStatus.isOpen ? "0 0 6px rgba(16,185,129,0.7)" : "none",
                }}
              />
              <span>{clinicStatus.isOpen ? "Open" : "Closed"}</span>
            </div>
          </div>

          <div className="auth-card-header">
            <h2 className="auth-title">Create Account</h2>
            <p className="auth-sub">Enter your details to register as a clinic patient</p>
          </div>

          {errorMsg && <div className="alert alert-error" style={{ marginBottom: 18 }}>{errorMsg}</div>}

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label htmlFor="reg-name" className="form-label">Full Legal Name</label>
              <input
                id="reg-name"
                className={`form-control ${fieldErrors.fullName ? "is-invalid" : ""}`}
                required placeholder="Juan Dela Cruz" value={form.fullName} onChange={set("fullName")}
              />
              {fieldErrors.fullName && <div className="form-feedback error">{fieldErrors.fullName}</div>}
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label htmlFor="reg-mobile" className="form-label">Mobile Number</label>
                <input
                  id="reg-mobile"
                  className={`form-control ${fieldErrors.mobileNo ? "is-invalid" : ""}`}
                  required placeholder="09171234567" maxLength={11} value={form.mobileNo} onChange={set("mobileNo")}
                />
                {fieldErrors.mobileNo && <div className="form-feedback error">{fieldErrors.mobileNo}</div>}
              </div>
              <div className="form-group">
                <label htmlFor="reg-email" className="form-label">Email Address</label>
                <input
                  id="reg-email"
                  className={`form-control ${fieldErrors.email ? "is-invalid" : ""}`}
                  type="email" required placeholder="name@example.com" value={form.email} onChange={set("email")}
                />
                {fieldErrors.email && <div className="form-feedback error">{fieldErrors.email}</div>}
              </div>
            </div>

            <div className="form-section-label" style={{ marginTop: 10 }}>Residential Address</div>

            <div className="grid-2">
              <div className="form-group">
                <label htmlFor="reg-region" className="form-label">Region</label>
                <select id="reg-region" className="form-select" required value={region} onChange={(e) => setRegion(e.target.value)}>
                  <option value="">Select Region</option>
                  {regions.map((r) => <option key={r.code} value={r.code}>{r.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="reg-province" className="form-label">Province</label>
                <select id="reg-province" className="form-select" required disabled={!provinces.length} value={province} onChange={(e) => setProvince(e.target.value)}>
                  <option value="">Select Province</option>
                  {provinces.map((p) => <option key={p.code} value={p.code}>{p.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="reg-city" className="form-label">City / Municipality</label>
                <select id="reg-city" className="form-select" required disabled={!cities.length} value={city} onChange={(e) => setCity(e.target.value)}>
                  <option value="">Select City</option>
                  {cities.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="reg-barangay" className="form-label">Barangay</label>
                <select id="reg-barangay" className="form-select" required disabled={!barangays.length} value={barangay} onChange={(e) => setBarangay(e.target.value)}>
                  <option value="">Select Barangay</option>
                  {barangays.map((b) => <option key={b.code} value={b.name}>{b.name}</option>)}
                </select>
              </div>
            </div>
            {fieldErrors.address && <div className="form-feedback error mb-3">{fieldErrors.address}</div>}

            <div className="form-section-label" style={{ marginTop: 10 }}>Security Password</div>

            <div className="grid-2">
              <div className="form-group">
                <label htmlFor="reg-password" className="form-label">Password (min. 6 chars)</label>
                <div className="input-with-icon">
                  <input
                    id="reg-password"
                    className={`form-control ${fieldErrors.password ? "is-invalid" : ""}`}
                    type={showPassword ? "text" : "password"} required placeholder="••••••••" value={form.password} onChange={set("password")}
                  />
                  <button type="button" className="input-icon-btn" onClick={() => setShowPassword(!showPassword)} aria-label="Toggle password view">
                    {showPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
                {fieldErrors.password && <div className="form-feedback error">{fieldErrors.password}</div>}
              </div>

              <div className="form-group">
                <label htmlFor="reg-confirm" className="form-label">Confirm Password</label>
                <div className="input-with-icon">
                  <input
                    id="reg-confirm"
                    className={`form-control ${fieldErrors.confirmPassword ? "is-invalid" : ""}`}
                    type={showConfirmPassword ? "text" : "password"} required placeholder="••••••••" value={form.confirmPassword} onChange={set("confirmPassword")}
                  />
                  <button type="button" className="input-icon-btn" onClick={() => setShowConfirmPassword(!showConfirmPassword)} aria-label="Toggle confirm password view">
                    {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
                {fieldErrors.confirmPassword && <div className="form-feedback error">{fieldErrors.confirmPassword}</div>}
              </div>
            </div>

            <div className="form-check" style={{ margin: "10px 0 20px" }}>
              <input
                type="checkbox" id="consent" required checked={form.consent}
                onChange={(e) => {
                  setForm({ ...form, consent: e.target.checked });
                  if (fieldErrors.consent) setFieldErrors({ ...fieldErrors, consent: "" });
                }}
              />
              <label className="form-check-label" htmlFor="consent">
                I consent to the collection and processing of my personal healthcare data under RA 10173 (Data Privacy Act of 2012).
              </label>
            </div>
            {fieldErrors.consent && <div className="form-feedback error mb-3">{fieldErrors.consent}</div>}

            <button type="submit" className="btn btn-primary w-100 auth-submit-btn" disabled={submitting}>
              {submitting ? "Registering account…" : "Create Patient Account"}
            </button>
          </form>

          <div className="auth-card-footer">
            <span>Already have an account? </span>
            <Link to="/login" className="auth-link-bold">Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

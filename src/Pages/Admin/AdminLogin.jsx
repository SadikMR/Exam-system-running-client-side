import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

// ── Tiny eye icons ────────────────────────────────────────────────────────────
const EyeOpen = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);
const EyeOff = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
  </svg>
);

// ── Reusable input wrapper with optional right adornment ──────────────────────
const InputGroup = ({ label, children }) => (
  <div>
    <label className="block text-sm font-semibold text-muted-foreground mb-2">{label}</label>
    {children}
  </div>
);

// ── Main component ────────────────────────────────────────────────────────────
const AdminLogin = () => {
  const navigate = useNavigate();

  // Login state
  const [formData, setFormData]   = useState({ email: "", password: "" });
  const [showPass, setShowPass]   = useState(false);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");

  // Forgot-password state  ("idle" | "sendCode" | "verifyCode" | "resetPass")
  const [fpStep, setFpStep]       = useState("idle");
  const [fpEmail, setFpEmail]     = useState("");
  const [fpCode, setFpCode]       = useState("");
  const [fpNewPass, setFpNewPass] = useState("");
  const [fpShowPass, setFpShowPass] = useState(false);
  const [fpLoading, setFpLoading] = useState(false);
  const [fpMsg, setFpMsg]         = useState({ type: "", text: "" }); // type: "error"|"success"

  // ── Login ──────────────────────────────────────────────────────────────────
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res  = await fetch(`${BACKEND_URL}/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Login failed");
      localStorage.setItem("adminToken", data.token);
      localStorage.setItem("adminInfo", JSON.stringify(data.admin));
      navigate("/admin");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Forgot password helpers ────────────────────────────────────────────────
  const fpPost = async (path, body) => {
    const res  = await fetch(`${BACKEND_URL}/admin/${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return res.json();
  };

  const handleSendCode = async (e) => {
    e.preventDefault();
    setFpLoading(true); setFpMsg({ type: "", text: "" });
    try {
      const data = await fpPost("forgot-password", { email: fpEmail });
      if (data.success) {
        setFpMsg({ type: "success", text: "Reset code sent! Check your inbox." });
        setFpStep("verifyCode");
      } else {
        setFpMsg({ type: "error", text: data.message || "Failed to send code." });
      }
    } catch {
      setFpMsg({ type: "error", text: "Network error. Try again." });
    } finally {
      setFpLoading(false);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setFpLoading(true); setFpMsg({ type: "", text: "" });
    try {
      const data = await fpPost("verify-reset-code", { email: fpEmail, code: fpCode });
      if (data.success) {
        setFpMsg({ type: "success", text: "Code verified! Enter your new password." });
        setFpStep("resetPass");
      } else {
        setFpMsg({ type: "error", text: data.message || "Invalid or expired code." });
      }
    } catch {
      setFpMsg({ type: "error", text: "Network error. Try again." });
    } finally {
      setFpLoading(false);
    }
  };

  const handleResetPass = async (e) => {
    e.preventDefault();
    if (fpNewPass.length < 6) {
      setFpMsg({ type: "error", text: "Password must be at least 6 characters." });
      return;
    }
    setFpLoading(true); setFpMsg({ type: "", text: "" });
    try {
      const data = await fpPost("reset-password", { email: fpEmail, code: fpCode, newPassword: fpNewPass });
      if (data.success) {
        setFpMsg({ type: "success", text: "Password reset! Returning to login…" });
        setTimeout(() => {
          setFpStep("idle"); setFpEmail(""); setFpCode(""); setFpNewPass("");
          setFpMsg({ type: "", text: "" });
        }, 2000);
      } else {
        setFpMsg({ type: "error", text: data.message || "Reset failed. Try again." });
      }
    } catch {
      setFpMsg({ type: "error", text: "Network error. Try again." });
    } finally {
      setFpLoading(false);
    }
  };

  const cancelForgotPassword = () => {
    setFpStep("idle"); setFpEmail(""); setFpCode(""); setFpNewPass("");
    setFpMsg({ type: "", text: "" });
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="bg-card rounded-3xl shadow-xl border border-border overflow-hidden max-w-md w-full">
        <div className="p-8 md:p-12">

          {/* ── Header ── */}
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              {fpStep === "idle" ? "Admin Login" : "Forgot Password"}
            </h1>
            <p className="text-muted-foreground">
              {fpStep === "idle"    && "Sign in to your account"}
              {fpStep === "sendCode"  && "Enter your admin email to receive a reset code"}
              {fpStep === "verifyCode" && "Enter the 6-digit code sent to your email"}
              {fpStep === "resetPass"  && "Set a new password for your account"}
            </p>
          </div>

          {/* ── Feedback message (forgot-password flow) ── */}
          {fpMsg.text && (
            <div className={`mb-4 px-4 py-3 rounded-xl text-sm border-l-4 ${
              fpMsg.type === "success"
                ? "bg-green-50 border-green-500 text-green-800"
                : "bg-destructive/10 border-destructive text-destructive"
            }`}>
              {fpMsg.text}
            </div>
          )}

          {/* ═══════════════════════════════════ LOGIN FORM ══════════════════ */}
          {fpStep === "idle" && (
            <form onSubmit={handleSubmit} className="space-y-5">
              <InputGroup label="Email Address">
                <input
                  type="email" name="email" value={formData.email}
                  onChange={handleChange} required
                  className="w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring transition"
                  placeholder="Enter email" autoComplete="email"
                />
              </InputGroup>

              <InputGroup label="Password">
                <div className="relative">
                  <input
                    type={showPass ? "text" : "password"}
                    name="password" value={formData.password}
                    onChange={handleChange} required
                    className="w-full px-4 py-3 pr-12 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring transition"
                    placeholder="Enter password" autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
                    tabIndex={-1}
                    aria-label={showPass ? "Hide password" : "Show password"}
                  >
                    {showPass ? <EyeOff /> : <EyeOpen />}
                  </button>
                </div>
              </InputGroup>

              {/* Forgot password link */}
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => { setFpStep("sendCode"); setFpEmail(formData.email); setError(""); }}
                  className="text-sm text-accent hover:underline font-medium"
                >
                  Forgot password?
                </button>
              </div>

              {error && (
                <div className="bg-destructive/10 border-l-4 border-destructive text-destructive px-4 py-3 rounded text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit" disabled={loading}
                className="w-full bg-accent text-accent-foreground py-3.5 rounded-2xl font-semibold hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-md hover:shadow-lg"
              >
                {loading ? "Signing In…" : "Login"}
              </button>
            </form>
          )}

          {/* ══════════════════════════ STEP 1 — send code ═══════════════════ */}
          {fpStep === "sendCode" && (
            <form onSubmit={handleSendCode} className="space-y-5">
              <InputGroup label="Admin Email">
                <input
                  type="email" value={fpEmail}
                  onChange={e => setFpEmail(e.target.value)} required
                  className="w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring transition"
                  placeholder="your@email.com"
                />
              </InputGroup>

              <button
                type="submit" disabled={fpLoading}
                className="w-full bg-accent text-accent-foreground py-3.5 rounded-2xl font-semibold hover:bg-accent/90 disabled:opacity-50 transition shadow-md"
              >
                {fpLoading ? "Sending…" : "Send Reset Code"}
              </button>
              <button type="button" onClick={cancelForgotPassword}
                className="w-full text-sm text-muted-foreground hover:text-foreground transition">
                ← Back to Login
              </button>
            </form>
          )}

          {/* ══════════════════════════ STEP 2 — verify code ═════════════════ */}
          {fpStep === "verifyCode" && (
            <form onSubmit={handleVerifyCode} className="space-y-5">
              <InputGroup label="6-Digit Code">
                <input
                  type="text" inputMode="numeric" maxLength={6}
                  value={fpCode}
                  onChange={e => setFpCode(e.target.value.replace(/\D/g, ""))} required
                  className="w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring transition tracking-widest text-center text-xl font-mono"
                  placeholder="000000"
                />
              </InputGroup>

              <p className="text-xs text-muted-foreground text-center">
                Didn't get it?{" "}
                <button type="button" onClick={() => setFpStep("sendCode")}
                  className="text-accent hover:underline font-medium">
                  Resend code
                </button>
              </p>

              <button
                type="submit" disabled={fpLoading || fpCode.length !== 6}
                className="w-full bg-accent text-accent-foreground py-3.5 rounded-2xl font-semibold hover:bg-accent/90 disabled:opacity-50 transition shadow-md"
              >
                {fpLoading ? "Verifying…" : "Verify Code"}
              </button>
              <button type="button" onClick={cancelForgotPassword}
                className="w-full text-sm text-muted-foreground hover:text-foreground transition">
                ← Back to Login
              </button>
            </form>
          )}

          {/* ══════════════════════════ STEP 3 — new password ════════════════ */}
          {fpStep === "resetPass" && (
            <form onSubmit={handleResetPass} className="space-y-5">
              <InputGroup label="New Password">
                <div className="relative">
                  <input
                    type={fpShowPass ? "text" : "password"}
                    value={fpNewPass}
                    onChange={e => setFpNewPass(e.target.value)} required minLength={6}
                    className="w-full px-4 py-3 pr-12 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring transition"
                    placeholder="At least 6 characters"
                  />
                  <button
                    type="button"
                    onClick={() => setFpShowPass(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
                    tabIndex={-1}
                    aria-label={fpShowPass ? "Hide password" : "Show password"}
                  >
                    {fpShowPass ? <EyeOff /> : <EyeOpen />}
                  </button>
                </div>
              </InputGroup>

              <button
                type="submit" disabled={fpLoading}
                className="w-full bg-accent text-accent-foreground py-3.5 rounded-2xl font-semibold hover:bg-accent/90 disabled:opacity-50 transition shadow-md"
              >
                {fpLoading ? "Resetting…" : "Reset Password"}
              </button>
              <button type="button" onClick={cancelForgotPassword}
                className="w-full text-sm text-muted-foreground hover:text-foreground transition">
                ← Back to Login
              </button>
            </form>
          )}

        </div>
      </div>
    </div>
  );
};

export default AdminLogin;

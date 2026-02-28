import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Swal from "sweetalert2";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const VerifyCode = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const email = location.state?.email;
  const type = location.state?.type;
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const config = {
    email: {
      title: "Verify Your Email",
      description: "We've sent a 6-digit verification code to:",
      endpoint: "/user/verify-email",
      resendEndpoint: "/user/resend-verification-code",
      successMessage: "Your account has been verified. You can now login.",
      redirectPath: "/login",
      fallbackPath: "/register",
      fallbackMessage: "Please register first.",
    },
    "password-reset": {
      title: "Verify Code",
      description: "Enter the 6-digit verification code sent to:",
      endpoint: "/user/verify-reset-code",
      resendEndpoint: "/user/request-password-reset",
      successMessage: "Now you can set your new password.",
      redirectPath: "/set-new-password",
      fallbackPath: "/forgot-password",
      fallbackMessage: "Please start from the forgot password page.",
    },
  };

  const currentConfig = config[type] || config["email"];

  useEffect(() => {
    if (!email || !type || !config[type]) {
      Swal.fire({ icon: "error", title: "Invalid Access", text: currentConfig.fallbackMessage });
      navigate(currentConfig.fallbackPath);
    }
  }, [email, type, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!code) { Swal.fire({ icon: "warning", title: "Missing Information", text: "Please enter the verification code." }); return; }
    if (code.length !== 6) { Swal.fire({ icon: "error", title: "Invalid Code", text: "Verification code must be 6 digits." }); return; }

    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}${currentConfig.endpoint}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to verify code");

      Swal.fire({
        icon: "success",
        title: type === "email" ? "Email Verified!" : "Code Verified!",
        text: currentConfig.successMessage,
        timer: type === "email" ? 2500 : 1500,
        showConfirmButton: false,
      });

      setTimeout(() => {
        if (type === "password-reset") { navigate(currentConfig.redirectPath, { state: { email, code } }); }
        else { navigate(currentConfig.redirectPath); }
      }, type === "email" ? 2500 : 1500);
    } catch (err) {
      Swal.fire({ icon: "error", title: "Verification Failed", text: err.message || "Server error, please try again later." });
    }
    setLoading(false);
  };

  const handleResendCode = async () => {
    setResending(true);
    try {
      const res = await fetch(`${BACKEND_URL}${currentConfig.resendEndpoint}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to resend code");
      Swal.fire({ icon: "success", title: "Code Sent!", text: "A new verification code has been sent to your email.", timer: 2000, showConfirmButton: false });
    } catch (err) {
      Swal.fire({ icon: "error", title: "Error", text: err.message || "Server error, please try again later." });
    }
    setResending(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-16">
      <div className="bg-card rounded-3xl shadow-xl border border-border max-w-lg w-full p-12 font-sans">
        <h1 className="text-4xl font-extrabold mb-4 text-foreground select-none text-center">
          {currentConfig.title}
        </h1>
        <p className="text-muted-foreground text-center mb-2">{currentConfig.description}</p>
        <p className="text-accent font-semibold text-center mb-8">{email}</p>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="code" className="block mb-2 text-base font-semibold text-muted-foreground cursor-pointer">
              Verification Code
            </label>
            <input
              id="code"
              name="code"
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Enter 6-digit code"
              maxLength="6"
              className="w-full px-5 py-3 border border-border rounded-xl text-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-ring transition hover:shadow-md tracking-widest text-center font-mono"
              disabled={loading}
              autoFocus
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-accent text-accent-foreground font-extrabold rounded-2xl shadow-md hover:bg-accent/90 transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "Verifying..." : "Verify Code"}
          </button>
        </form>

        <div className="mt-8 flex justify-between text-accent font-semibold text-sm select-none">
          <button type="button" onClick={handleResendCode} disabled={resending} className="underline hover:text-accent/80 disabled:opacity-50">
            {resending ? "Sending..." : "Resend Code"}
          </button>
          <button type="button" onClick={() => navigate("/login")} className="underline hover:text-accent/80">
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerifyCode;

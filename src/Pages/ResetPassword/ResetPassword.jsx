import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Swal from "sweetalert2";
import { Eye, EyeOff } from "lucide-react";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const ResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({
    email: location.state?.email || "",
    code: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.code || !formData.newPassword) {
      Swal.fire({ icon: "warning", title: "Missing Information", text: "Please fill in all fields." }); return;
    }
    if (formData.newPassword !== formData.confirmPassword) {
      Swal.fire({ icon: "error", title: "Password Mismatch", text: "Passwords do not match." }); return;
    }
    if (formData.code.length !== 6) {
      Swal.fire({ icon: "error", title: "Invalid Code", text: "Verification code must be 6 digits." }); return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/user/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email, code: formData.code, newPassword: formData.newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to reset password");

      Swal.fire({ icon: "success", title: "Success!", text: "Your password has been reset successfully.", timer: 2500, showConfirmButton: false });
      setTimeout(() => { navigate("/login"); }, 2500);
    } catch (err) {
      Swal.fire({ icon: "error", title: "Error", text: err.message || "Server error, please try again later." });
    }
    setLoading(false);
  };

  const inputClass = "w-full px-5 py-3 border border-border rounded-xl text-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-ring transition hover:shadow-md";

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-16">
      <div className="bg-card rounded-3xl shadow-xl border border-border max-w-lg w-full p-12 font-sans">
        <h1 className="text-4xl font-extrabold mb-4 text-foreground select-none text-center">
          Reset Password
        </h1>
        <p className="text-muted-foreground text-center mb-8">
          Enter the verification code sent to your email and your new password.
        </p>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block mb-2 text-base font-semibold text-muted-foreground cursor-pointer">Email Address</label>
            <input id="email" name="email" type="email" value={formData.email} onChange={handleChange} placeholder="Enter your email address" className={inputClass} disabled={loading} autoComplete="email" required />
          </div>

          <div>
            <label htmlFor="code" className="block mb-2 text-base font-semibold text-muted-foreground cursor-pointer">Verification Code</label>
            <input id="code" name="code" type="text" value={formData.code} onChange={handleChange} placeholder="Enter 6-digit code" maxLength="6" className={`${inputClass} tracking-widest text-center font-mono`} disabled={loading} required />
          </div>

          <div>
            <label htmlFor="newPassword" className="block mb-2 text-base font-semibold text-muted-foreground cursor-pointer">New Password</label>
            <div className="relative">
              <input id="newPassword" name="newPassword" type={showPassword ? "text" : "password"} value={formData.newPassword} onChange={handleChange} placeholder="Enter new password" className={`${inputClass} pr-12`} disabled={loading} autoComplete="new-password" required />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition">
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block mb-2 text-base font-semibold text-muted-foreground cursor-pointer">Confirm New Password</label>
            <div className="relative">
              <input id="confirmPassword" name="confirmPassword" type={showConfirmPassword ? "text" : "password"} value={formData.confirmPassword} onChange={handleChange} placeholder="Confirm new password" className={`${inputClass} pr-12`} disabled={loading} autoComplete="new-password" required />
              <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition">
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} className="w-full py-4 bg-accent text-accent-foreground font-extrabold rounded-2xl shadow-md hover:bg-accent/90 transition disabled:opacity-60 disabled:cursor-not-allowed">
            {loading ? "Resetting Password..." : "Reset Password"}
          </button>
        </form>

        <div className="mt-8 text-center font-semibold text-sm select-none">
          <button type="button" onClick={() => navigate("/login")} className="text-accent underline hover:text-accent/80">
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;

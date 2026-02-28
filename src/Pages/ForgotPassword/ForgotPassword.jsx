import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      Swal.fire({ icon: "warning", title: "Missing Information", text: "Please enter your email address." });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/user/request-password-reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 404) {
          throw new Error("This email is not registered. Please check your email or register a new account.");
        }
        throw new Error(data.message || "Failed to send reset code");
      }

      Swal.fire({ icon: "success", title: "Code Sent!", text: "A verification code has been sent to your email.", timer: 2500, showConfirmButton: false });
      setTimeout(() => { navigate("/verify-code", { state: { email, type: "password-reset" } }); }, 2500);
    } catch (err) {
      Swal.fire({ icon: "error", title: "Error", text: err.message || "Server error, please try again later." });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-16">
      <div className="bg-card rounded-3xl shadow-xl border border-border max-w-lg w-full p-12 font-sans">
        <h1 className="text-4xl font-extrabold mb-4 text-foreground select-none text-center">
          Forgot Password
        </h1>
        <p className="text-muted-foreground text-center mb-8">
          Enter your email address and we'll send you a verification code to reset your password.
        </p>
        <form onSubmit={handleSubmit} className="space-y-7">
          <div>
            <label htmlFor="email" className="block mb-2 text-base font-semibold text-muted-foreground cursor-pointer">
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
              className="w-full px-5 py-3 border border-border rounded-xl text-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-ring transition hover:shadow-md"
              disabled={loading}
              autoComplete="email"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-accent text-accent-foreground font-extrabold rounded-2xl shadow-md hover:bg-accent/90 transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "Sending Code..." : "Send Verification Code"}
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

export default ForgotPassword;

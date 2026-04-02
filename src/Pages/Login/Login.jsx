import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Swal from "sweetalert2";
import { Eye, EyeOff } from "lucide-react";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({
    emailOrUsername: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const redirectPath = location.state?.from?.pathname || "/";

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.emailOrUsername || !formData.password) {
      Swal.fire({ icon: "warning", title: "Missing Information", text: "Please fill in both fields." });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/user/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const contentType = res.headers.get("content-type");
      if (!res.ok) {
        let errorMessage = "Login failed";
        if (contentType && contentType.includes("application/json")) {
          const errData = await res.json();
          errorMessage = errData.message || errorMessage;
        } else {
          errorMessage = await res.text();
        }
        throw new Error(errorMessage);
      }

      const data = await res.json();
      localStorage.setItem("userToken", data.token);
      const { id, email, username } = data.user;
      localStorage.setItem("userInfo", JSON.stringify({ id, email, username }));
      window.dispatchEvent(new Event("storage"));
      window.dispatchEvent(new Event("authChange"));

      Swal.fire({ icon: "success", title: "Welcome Back!", text: `Hello, ${username}`, timer: 2000, showConfirmButton: false });
      setTimeout(() => { navigate(redirectPath, { replace: true }); }, 2000);
    } catch (err) {
      const raw = err.message || "";

      // Map backend messages to friendly UI text (no private info exposed)
      const getFriendlyError = (msg) => {
        if (msg.includes("Please verify your email")) return null; // handled separately
        if (msg.includes("Invalid credentials") || msg.includes("password"))
          return { title: "Incorrect Credentials", text: "The email/username or password you entered is incorrect. Please try again." };
        if (msg.includes("Missing credentials") || msg.includes("Missing required"))
          return { title: "Missing Information", text: "Please fill in both your email/username and password." };
        if (msg.includes("User not found"))
          return { title: "Account Not Found", text: "No account found with that email or username. Please check your details or register." };
        if (msg.includes("Server error"))
          return { title: "Server Error", text: "Something went wrong on our end. Please try again in a moment." };
        return { title: "Login Failed", text: "Unable to log in. Please check your details and try again." };
      };

      if (raw.includes("Please verify your email")) {
        const result = await Swal.fire({
          icon: "warning",
          title: "Email Not Verified",
          text: "You need to verify your email address before you can log in.",
          showCancelButton: true,
          confirmButtonText: "Resend Verification Code",
          cancelButtonText: "Cancel",
          confirmButtonColor: "#10B981",
        });
        if (result.isConfirmed) {
          try {
            const resendRes = await fetch(`${BACKEND_URL}/user/resend-verification-code`, {
              method: "POST", headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email: formData.emailOrUsername }),
            });
            const resendData = await resendRes.json();
            if (resendRes.ok) {
              Swal.fire({ icon: "success", title: "Code Sent!", text: "A verification code has been sent to your email.", timer: 2000, showConfirmButton: false });
              setTimeout(() => { navigate("/verify-code", { state: { email: formData.emailOrUsername, type: "email" } }); }, 2000);
            } else {
              Swal.fire({ icon: "error", title: "Could Not Send Code", text: "We couldn't send the verification code. Please try again later." });
            }
          } catch {
            Swal.fire({ icon: "error", title: "Could Not Send Code", text: "We couldn't send the verification code. Please try again later." });
          }
        }
      } else {
        const friendly = getFriendlyError(raw);
        Swal.fire({ icon: "error", title: friendly.title, text: friendly.text });
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-16">
      <div className="bg-card rounded-3xl shadow-xl border border-border max-w-lg w-full p-12 font-sans">
        <h1 className="text-4xl font-extrabold mb-8 text-foreground select-none text-center">
          Login
        </h1>
        <form onSubmit={handleSubmit} className="space-y-7">
          <div>
            <label htmlFor="emailOrUsername" className="block mb-2 text-base font-semibold text-muted-foreground cursor-pointer">
              Email or Username
            </label>
            <input
              id="emailOrUsername"
              name="emailOrUsername"
              type="text"
              value={formData.emailOrUsername}
              onChange={handleChange}
              placeholder="Enter your email or username"
              className="w-full px-5 py-3 border border-border rounded-xl text-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-ring transition hover:shadow-md"
              disabled={loading}
              autoComplete="username"
              required
            />
          </div>
          <div>
            <label htmlFor="password" className="block mb-2 text-base font-semibold text-muted-foreground cursor-pointer">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                className="w-full px-5 py-3 pr-12 border border-border rounded-xl text-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-ring transition hover:shadow-md"
                disabled={loading}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-accent text-accent-foreground font-extrabold rounded-2xl shadow-md hover:bg-accent/90 transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <div className="mt-8 flex justify-between text-accent font-semibold text-sm select-none">
          <button type="button" onClick={() => navigate("/forgot-password")} className="underline hover:text-accent/80">
            Forgot Password?
          </button>
          <div>
            Don't have an account?{" "}
            <button type="button" onClick={() => navigate("/register")} className="underline hover:text-accent/80">
              Register
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

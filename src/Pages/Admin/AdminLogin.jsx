import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const AdminLogin = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${BACKEND_URL}/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email, password: formData.password }),
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="bg-card rounded-3xl shadow-xl border border-border overflow-hidden max-w-md w-full">
        <div className="p-8 md:p-12">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-foreground mb-2">Admin Login</h1>
            <p className="text-muted-foreground">Sign in to your account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-muted-foreground mb-2">Email Address</label>
              <input
                type="email" name="email" value={formData.email} onChange={handleChange} required
                className="w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring transition"
                placeholder="Enter email" autoComplete="email"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-muted-foreground mb-2">Password</label>
              <input
                type="password" name="password" value={formData.password} onChange={handleChange} required
                className="w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring transition"
                placeholder="Enter password" autoComplete="current-password"
              />
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
              {loading ? "Signing In..." : "Login"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;

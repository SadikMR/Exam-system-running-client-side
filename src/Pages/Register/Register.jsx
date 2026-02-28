import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { Eye, EyeOff } from "lucide-react";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const Registration = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: "",
    name: "",
    email: "",
    phone: "",
    address: "",
    collegeOrUniversity: "",
    image: null,
    password: "",
    confirmPassword: "",
  });

  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    return () => { if (imagePreview) URL.revokeObjectURL(imagePreview); };
  }, [imagePreview]);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({ ...prev, image: file }));
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (formData.password !== formData.confirmPassword) {
      Swal.fire({ icon: "error", title: "Oops...", text: "Passwords do not match." }); return;
    }

    setLoading(true);
    try {
      const submitData = new FormData();
      submitData.append("username", formData.username);
      submitData.append("name", formData.name);
      submitData.append("email", formData.email);
      submitData.append("phone", formData.phone);
      submitData.append("address", formData.address);
      submitData.append("collegeOrUniversity", formData.collegeOrUniversity);
      submitData.append("password", formData.password);
      if (formData.image) submitData.append("image", formData.image);

      const res = await fetch(`${BACKEND_URL}/user/register`, { method: "POST", body: submitData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Registration failed");

      Swal.fire({ icon: "success", title: "Success!", text: "Registration completed. Please check your email to verify your account.", timer: 2500, showConfirmButton: false });
      setTimeout(() => { navigate("/verify-code", { state: { email: data.email, type: "email" } }); }, 2500);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  const inputClass = "w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring transition";

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="bg-card rounded-3xl shadow-xl border border-border overflow-hidden max-w-2xl w-full">
        <div className="p-8 md:p-12">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-foreground mb-2">Create Your Account</h1>
            <p className="text-muted-foreground">Register to get started with our system</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username */}
            <div>
              <label className="block text-sm font-semibold text-muted-foreground mb-2">Username</label>
              <input type="text" name="username" value={formData.username} onChange={handleChange} required className={inputClass} placeholder="Choose a username" />
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-sm font-semibold text-muted-foreground mb-2">Full Name</label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} required className={inputClass} placeholder="Enter your full name" />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-muted-foreground mb-2">Email Address</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} required className={inputClass} placeholder="Enter your email address" />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-semibold text-muted-foreground mb-2">Phone Number</label>
              <input type="tel" name="phone" value={formData.phone} onChange={handleChange} required className={inputClass} placeholder="Enter your phone number" />
            </div>

            {/* Address */}
            <div>
              <label className="block text-sm font-semibold text-muted-foreground mb-2">Address</label>
              <textarea name="address" value={formData.address} onChange={handleChange} required rows="3" className={`${inputClass} resize-none`} placeholder="Enter your address" />
            </div>

            {/* College/University */}
            <div>
              <label className="block text-sm font-semibold text-muted-foreground mb-2">College/University</label>
              <input type="text" name="collegeOrUniversity" value={formData.collegeOrUniversity} onChange={handleChange} className={inputClass} placeholder="Enter your college or university" />
            </div>

            {/* Profile Image */}
            <div>
              <label className="block text-sm font-semibold text-muted-foreground mb-2">Profile Image (optional)</label>
              <input type="file" accept="image/*" onChange={handleImageChange} className={inputClass} />
              {imagePreview && (
                <div className="mt-3 flex justify-center">
                  <img src={imagePreview} alt="Profile Preview" className="w-32 h-32 object-cover rounded-xl border-2 border-border" />
                </div>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-muted-foreground mb-2">Password</label>
              <div className="relative">
                <input type={showPassword ? "text" : "password"} name="password" value={formData.password} onChange={handleChange} required className={`${inputClass} pr-12`} placeholder="Enter your password" autoComplete="new-password" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition">
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-semibold text-muted-foreground mb-2">Confirm Password</label>
              <div className="relative">
                <input type={showConfirmPassword ? "text" : "password"} name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required className={`${inputClass} pr-12`} placeholder="Confirm your password" autoComplete="off" />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition">
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-destructive/10 border-l-4 border-destructive text-destructive px-4 py-3 rounded text-sm">
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="w-full bg-accent text-accent-foreground py-3.5 rounded-2xl font-semibold hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-md hover:shadow-lg">
              {loading ? "Creating Account..." : "Complete Registration"}
            </button>

            <p className="mt-4 text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <button type="button" onClick={() => navigate("/login")} className="font-semibold text-accent hover:text-accent/80 focus:outline-none">
                Login
              </button>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Registration;

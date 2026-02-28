import React from "react";
import { useNavigate } from "react-router-dom";

const AdminNavbar = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminInfo");
    navigate("/admin/login");
  };

  const isLoggedIn = () => !!localStorage.getItem("adminToken");

  return (
    <nav className="bg-card shadow-md border-b border-border">
      <div className="flex justify-between items-center px-6 py-4">
        {/* Left - Brand Name */}
        <button
          onClick={() => navigate("/admin")}
          className="text-2xl font-bold text-accent hover:text-accent/80 transition-colors"
        >
          ExamDesk
        </button>

        {/* Middle - Admin Mode Badge */}
        <div className="absolute left-1/2 transform -translate-x-1/2">
          <span className="px-4 py-2 bg-accent/10 text-accent rounded-lg font-semibold text-sm border border-accent/20">
            Admin Mode
          </span>
        </div>

        {/* Right - Dashboard and Login/Logout */}
        <div className="flex items-center gap-4">
          {isLoggedIn() && (
            <button
              onClick={() => navigate("/admin")}
              className="px-4 py-2 text-muted-foreground hover:text-accent font-medium transition-colors"
            >
              Dashboard
            </button>
          )}

          {isLoggedIn() ? (
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-colors font-medium"
            >
              Logout
            </button>
          ) : (
            <button
              onClick={() => navigate("/admin/login")}
              className="px-4 py-2 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 transition-colors font-medium"
            >
              Login
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default AdminNavbar;

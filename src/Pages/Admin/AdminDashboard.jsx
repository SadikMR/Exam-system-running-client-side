import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminNavbar from "./AdminNavbar";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [adminInfo, setAdminInfo] = useState(null);

  useEffect(() => {
    // Get admin info from localStorage
    const info = localStorage.getItem("adminInfo");
    if (info) {
      setAdminInfo(JSON.parse(info));
    } else {
      // If no admin info, redirect to login
      navigate("/admin/login");
    }
  }, [navigate]);

  if (!adminInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-accent"></div>
      </div>
    );
  }

  return (
    <>
      <AdminNavbar />
      <div className="min-h-screen bg-background py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12 text-center">
            <h2 className="text-4xl font-bold text-foreground mb-3">
              Welcome back, {adminInfo.name}
            </h2>
            <p className="text-muted-foreground text-lg">
              What would you like to do today?
            </p>
          </div>

          {/* Dashboard Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Admin Management - Only for Admins */}
            {adminInfo.role === "admin" && (
              <div
                onClick={() => navigate("/admin/management")}
                className="bg-card rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer border border-border overflow-hidden group"
              >
                <div className="bg-gradient-to-br from-purple-500 to-indigo-600 p-6">
                  <div className="w-16 h-16 bg-white bg-opacity-20 rounded-xl flex items-center justify-center mb-4">
                    <svg
                      className="w-8 h-8 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">
                    Admin Management
                  </h3>
                  <p className="text-purple-100">
                    Invite and manage admins and editors
                  </p>
                </div>
                <div className="p-6 bg-card group-hover:bg-muted transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 font-medium">
                      Manage Team
                    </span>
                    <svg
                      className="w-5 h-5 text-muted-foreground group-hover:text-accent group-hover:translate-x-1 transition-all"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            )}

            {/* Create Exam */}
            <div
              onClick={() => navigate("/admin/create-exam")}
              className="bg-card rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer border border-border overflow-hidden group"
            >
              <div className="bg-gradient-to-br from-green-500 to-teal-600 p-6">
                <div className="w-16 h-16 bg-white bg-opacity-20 rounded-xl flex items-center justify-center mb-4">
                  <svg
                    className="w-8 h-8 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">
                  Create Exam
                </h3>
                <p className="text-green-100">
                  Design new exams and add questions
                </p>
              </div>
              <div className="p-6 bg-card group-hover:bg-muted transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 font-medium">
                    New Exam
                  </span>
                  <svg
                    className="w-5 h-5 text-muted-foreground group-hover:text-accent group-hover:translate-x-1 transition-all"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </div>
            </div>

            {/* Update Exam */}
            <div
              onClick={() => navigate("/admin/update-exam")}
              className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer border border-gray-200 overflow-hidden group"
            >
              <div className="bg-gradient-to-br from-orange-500 to-red-600 p-6">
                <div className="w-16 h-16 bg-white bg-opacity-20 rounded-xl flex items-center justify-center mb-4">
                  <svg
                    className="w-8 h-8 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">
                  Update Exam
                </h3>
                <p className="text-orange-100">
                  Edit existing exams and questions
                </p>
              </div>
              <div className="p-6 bg-card group-hover:bg-muted transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 font-medium">
                    Edit Exams
                  </span>
                  <svg
                    className="w-5 h-5 text-muted-foreground group-hover:text-accent group-hover:translate-x-1 transition-all"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </div>
            </div>

            {/* Exam History */}
            <div
              onClick={() => navigate("/admin/exam-history")}
              className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer border border-gray-200 overflow-hidden group"
            >
              <div className="bg-gradient-to-br from-blue-500 to-cyan-600 p-6">
                <div className="w-16 h-16 bg-white bg-opacity-20 rounded-xl flex items-center justify-center mb-4">
                  <svg
                    className="w-8 h-8 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">
                  Exam History
                </h3>
                <p className="text-blue-100">
                  View finished exams and rankings
                </p>
              </div>
              <div className="p-6 bg-card group-hover:bg-muted transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 font-medium">
                    View Rankings
                  </span>
                  <svg
                    className="w-5 h-5 text-muted-foreground group-hover:text-accent group-hover:translate-x-1 transition-all"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminDashboard;

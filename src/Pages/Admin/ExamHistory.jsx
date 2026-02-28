import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import AdminNavbar from "./AdminNavbar";

const ExamHistory = () => {
  const navigate = useNavigate();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchFinishedExams();
  }, []);

  const fetchFinishedExams = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/liveExam/history`
      );

      if (response.data.success) {
        setExams(response.data.exams);
      }
    } catch (err) {
      console.error("Error fetching exam history:", err);
      setError("Failed to load exam history");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <>
        <AdminNavbar />
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-accent"></div>
        </div>
      </>
    );
  }

  return (
    <>
      <AdminNavbar />
      <div className="min-h-screen bg-background py-12 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => navigate("/admin")}
              className="mb-4 flex items-center text-accent hover:text-accent/80 transition-colors"
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Back to Dashboard
            </button>
            <h1 className="text-4xl font-bold text-foreground mb-2">
              Exam History
            </h1>
            <p className="text-gray-600">
              View finished exams and their performance statistics
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Exams Table */}
          {exams.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
              <svg
                className="w-16 h-16 mx-auto mb-4 text-gray-400"
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
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                No Finished Exams
              </h3>
              <p className="text-gray-500">
                Completed exams will appear here
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table View - Hidden on mobile */}
              <div className="hidden md:block bg-white rounded-2xl shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-muted">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Exam Name
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Participants
                        </th>
                        <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Highest
                        </th>
                        <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Average
                        </th>
                        <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Lowest
                        </th>
                        <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Banned
                        </th>
                        <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {exams.map((exam) => (
                        <tr
                          key={exam._id}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-gray-900">
                              {exam.title}
                            </div>
                            <div className="text-xs text-gray-500">
                              {exam.examType}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {formatDate(exam.endTime)}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center whitespace-nowrap">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-accent/10 text-accent">
                              {exam.totalParticipants}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center whitespace-nowrap">
                            <span className="text-sm font-semibold text-green-600">
                              {exam.highestMarks}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center whitespace-nowrap">
                            <span className="text-sm font-medium text-gray-700">
                              {exam.averageMarks}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center whitespace-nowrap">
                            <span className="text-sm font-semibold text-orange-600">
                              {exam.lowestMarks}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center whitespace-nowrap">
                            {exam.bannedUsersCount > 0 ? (
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                                {exam.bannedUsersCount}
                              </span>
                            ) : (
                              <span className="text-sm text-gray-400">0</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-center whitespace-nowrap">
                            <button
                              onClick={() =>
                                navigate(`/admin/exam-history/${exam._id}/ranking`)
                              }
                              className="inline-flex items-center px-4 py-2 bg-accent hover:bg-accent/90 text-accent-foreground text-sm font-medium rounded-lg transition-colors"
                            >
                              View Ranking
                              <svg
                                className="w-4 h-4 ml-2"
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
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile Card View - Hidden on desktop */}
              <div className="md:hidden space-y-4">
                {exams.map((exam) => (
                  <div
                    key={exam._id}
                    className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200"
                  >
                    <div className="bg-accent/90 p-4 text-white">
                      <h3 className="text-lg font-bold text-white mb-1">
                        {exam.title}
                      </h3>
                      <p className="text-white/80 text-sm">{exam.examType}</p>
                    </div>
                    
                    <div className="p-4 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Date:</span>
                        <span className="text-sm font-medium text-gray-900">
                          {formatDate(exam.endTime)}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-blue-50 rounded-lg p-3 text-center">
                          <div className="text-xs text-blue-600 mb-1">Participants</div>
                          <div className="text-xl font-bold text-blue-700">
                            {exam.totalParticipants}
                          </div>
                        </div>
                        <div className="bg-red-50 rounded-lg p-3 text-center">
                          <div className="text-xs text-red-600 mb-1">Banned</div>
                          <div className="text-xl font-bold text-red-700">
                            {exam.bannedUsersCount}
                          </div>
                        </div>
                      </div>

                      <div className="border-t pt-3">
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div>
                            <div className="text-xs text-gray-500 mb-1">Highest</div>
                            <div className="text-sm font-semibold text-green-600">
                              {exam.highestMarks}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 mb-1">Average</div>
                            <div className="text-sm font-medium text-gray-700">
                              {exam.averageMarks}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 mb-1">Lowest</div>
                            <div className="text-sm font-semibold text-orange-600">
                              {exam.lowestMarks}
                            </div>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() =>
                          navigate(`/admin/exam-history/${exam._id}/ranking`)
                        }
                        className="w-full flex items-center justify-center px-4 py-3 bg-accent hover:bg-accent/90 text-accent-foreground text-sm font-medium rounded-lg transition-colors"
                      >
                        View Ranking
                        <svg
                          className="w-4 h-4 ml-2"
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
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default ExamHistory;

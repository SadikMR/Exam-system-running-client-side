import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiUser,
  FiMail,
  FiCalendar,
  FiAward,
  FiEye,
  FiBarChart2,
  FiChevronLeft,
  FiChevronRight,
  FiSettings,
  FiLogOut,
  FiTrendingUp,
  FiCheckCircle,
  FiXCircle,
  FiPhone,
  FiMapPin,
  FiBook,
} from "react-icons/fi";

const ITEMS_PER_PAGE = 5;

const Profile = () => {
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState(null);
  const [liveExams, setLiveExams] = useState([]);
  const [hscExams, setHscExams] = useState([]);
  const [bcsExams, setBcsExams] = useState([]);
  const [bankExams, setBankExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // Pagination states
  const [livePage, setLivePage] = useState(0);
  const [hscPage, setHscPage] = useState(0);
  const [bcsPage, setBcsPage] = useState(0);
  const [bankPage, setBankPage] = useState(0);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const storedUserInfo = JSON.parse(localStorage.getItem("userInfo"));
        setUserInfo(storedUserInfo);

        const userId = storedUserInfo?._id || storedUserInfo?.id;

        if (!userId) {
          navigate("/login");
          return;
        }

        // Fetch Live Exam submissions
        const liveRes = await fetch(
          `${
            import.meta.env.VITE_BACKEND_URL
          }/liveExam/submission/user/${userId}`
        );
        const liveData = await liveRes.json();
        setLiveExams(liveData.submissions || []);

        // Fetch Practice Exam submissions
        const practiceRes = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/practice-exam/user/${userId}`
        );
        const practiceData = await practiceRes.json();

        // Categorize practice exams
        const submissions = practiceData.submissions || [];
        setHscExams(
          submissions.filter((s) => s.examSnapshot.examType === "HSC")
        );
        setBcsExams(
          submissions.filter((s) => s.examSnapshot.examType === "BCS")
        );
        setBankExams(
          submissions.filter((s) => s.examSnapshot.examType === "Bank")
        );

        setLoading(false);
      } catch (error) {
        console.error("Error fetching user data:", error);
        setLoading(false);
      }
    };

    fetchUserData();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("userToken");
    localStorage.removeItem("userInfo");
    navigate("/login");
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Calculate overall statistics
  const allExams = [...liveExams, ...hscExams, ...bcsExams, ...bankExams];
  const totalExams = allExams.length;
  const averageScore =
    totalExams > 0
      ? (
          allExams.reduce(
            (sum, exam) => sum + exam.resultMetrics.percentage,
            0
          ) / totalExams
        ).toFixed(1)
      : 0;
  const totalCorrect = allExams.reduce(
    (sum, exam) => sum + exam.resultMetrics.correctAnswers,
    0
  );
  const totalWrong = allExams.reduce(
    (sum, exam) => sum + exam.resultMetrics.wrongAnswers,
    0
  );

  const ExamCard = ({ exam, type }) => {
    const isLive = type === "live";
    const snapshot = exam.examSnapshot;
    const metrics = exam.resultMetrics;

    return (
      <div className="group bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-indigo-300 h-full flex flex-col">
        {/* Card Header */}
        <div
          className={`p-6 ${
            metrics.percentage >= 80
              ? "bg-gradient-to-br from-green-50 to-emerald-50"
              : metrics.percentage >= 60
              ? "bg-gradient-to-br from-blue-50 to-cyan-50"
              : metrics.percentage >= 40
              ? "bg-gradient-to-br from-amber-50 to-orange-50"
              : "bg-gradient-to-br from-red-50 to-pink-50"
          }`}
        >
          <h3 className="font-bold text-gray-900 text-xl mb-3 line-clamp-2 min-h-[56px] group-hover:text-indigo-600 transition-colors">
            {snapshot.title}
          </h3>
          <div className="flex items-center gap-2 flex-wrap">
            {!isLive && snapshot.category && (
              <span className="px-3 py-1.5 bg-white text-indigo-700 text-xs font-bold rounded-full shadow-sm border border-indigo-200">
                {snapshot.category === "full" ? "Full Exam" : "Subject-wise"}
              </span>
            )}
            <span className="flex items-center gap-1.5 text-gray-600 text-sm font-semibold bg-white px-3 py-1.5 rounded-full shadow-sm">
              <FiCalendar size={14} />
              {formatDate(exam.createdAt)}
            </span>
          </div>
        </div>

        {/* Score Section */}
        <div className="px-6 py-5 bg-gray-50">
          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-600 font-semibold text-sm">
              Your Score
            </span>
            <div
              className={`px-4 py-2 rounded-xl font-bold text-2xl ${
                metrics.percentage >= 80
                  ? "bg-green-100 text-green-700"
                  : metrics.percentage >= 60
                  ? "bg-blue-100 text-blue-700"
                  : metrics.percentage >= 40
                  ? "bg-amber-100 text-amber-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {metrics.percentage}%
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white rounded-xl p-3 text-center shadow-sm border border-gray-100">
              <FiCheckCircle
                size={18}
                className="text-green-600 mx-auto mb-1"
              />
              <p className="text-xs text-gray-500 mb-1 font-medium">Correct</p>
              <p className="text-lg font-bold text-green-600">
                {metrics.correctAnswers}
              </p>
            </div>
            <div className="bg-white rounded-xl p-3 text-center shadow-sm border border-gray-100">
              <FiXCircle size={18} className="text-red-600 mx-auto mb-1" />
              <p className="text-xs text-gray-500 mb-1 font-medium">Wrong</p>
              <p className="text-lg font-bold text-red-600">
                {metrics.wrongAnswers}
              </p>
            </div>
            <div className="bg-white rounded-xl p-3 text-center shadow-sm border border-gray-100">
              <FiAward size={18} className="text-indigo-600 mx-auto mb-1" />
              <p className="text-xs text-gray-500 mb-1 font-medium">Marks</p>
              <p className="text-lg font-bold text-indigo-600">
                {metrics.totalMarksObtained.toFixed(0)}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons - stick bottom for mobile */}
        <div className={`p-6 bg-white mt-auto ${isLive ? "space-y-3" : ""}`}>
          <button
            onClick={() => {
              // Store exam type in localStorage for API call
              localStorage.setItem(`exam_${exam._id}_type`, isLive ? "live" : "practice");
              navigate(`/student/exam-review/${exam._id}`);
            }}
            className="w-full py-3.5 rounded-xl font-bold transition-all duration-300 flex items-center justify-center gap-2 bg-indigo-600 text-white hover:bg-indigo-700 shadow-md hover:shadow-lg text-base"
          >
            <FiEye size={20} />
            Show Review
          </button>

          {isLive && (
            <button
              onClick={() => {
                // Navigate to leaderboard with examId from the submission
                // Handle case where examId might be an object with _id property
                const examIdFromSubmission = exam.examId?._id || exam.examId || exam._id;
                navigate(`/student/leaderboard/${examIdFromSubmission}`);
              }}
              className="w-full py-3.5 rounded-xl font-bold transition-all duration-300 flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 shadow-md hover:shadow-lg text-base"
            >
              <FiBarChart2 size={20} />
              Show Leaderboard
            </button>
          )}
        </div>
      </div>
    );
  };

  const ExamSection = ({
    title,
    exams,
    page,
    setPage,
    type,
    icon,
    gradientFrom,
    gradientTo,
  }) => {
    const startIndex = page * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const paginatedExams = exams.slice(startIndex, endIndex);
    const totalPages = Math.ceil(exams.length / ITEMS_PER_PAGE);

    if (exams.length === 0) return null;

    return (
      <div className="mb-10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
          <div className="flex items-center gap-4">
            <div
              className={`p-4 rounded-2xl bg-gradient-to-br ${gradientFrom} ${gradientTo} shadow-lg`}
            >
              {icon}
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
                {title}
              </h2>
              <p className="text-sm text-gray-600 font-semibold mt-1">
                {exams.length} exams completed
              </p>
            </div>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center gap-3 bg-white rounded-2xl shadow-lg p-2 border border-gray-200">
              <button
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
                className="p-3 rounded-xl bg-gray-50 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <FiChevronLeft size={22} />
              </button>
              <span className="text-base font-bold text-gray-700 px-4">
                {page + 1} / {totalPages}
              </span>
              <button
                onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                disabled={page >= totalPages - 1}
                className="p-3 rounded-xl bg-gray-50 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <FiChevronRight size={22} />
              </button>
            </div>
          )}
        </div>

        {/* Responsive grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-5 sm:gap-6">
          {paginatedExams.map((exam) => (
            <ExamCard key={exam._id} exam={exam} type={type} />
          ))}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
        <div className="text-center">
          <div className="relative w-24 h-24 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-indigo-200"></div>
            <div className="absolute inset-0 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin"></div>
          </div>
          <p className="text-gray-700 font-bold text-xl">
            Loading your dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 pb-12">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-md sticky top-0 z-50">
        <div className="max-w-[1400px] mx-auto px-3 sm:px-4 md:px-8">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-0 items-center justify-between py-3 sm:py-0 sm:h-20">
            <div className="text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Dashboard
            </div>

            {/* Profile menu */}
            <div className="flex items-center gap-3">

              <div className="relative">
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center gap-3 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-bold transition-all shadow-md"
                >
                  <div className="w-9 h-9 rounded-full bg-white/30 flex items-center justify-center text-base font-bold">
                    {userInfo?.username?.charAt(0).toUpperCase() || "U"}
                  </div>
                  <span className="hidden md:inline">
                    {userInfo?.username || "User"}
                  </span>
                </button>

                {/* Profile menu */}
                {showProfileMenu && (
                  <div className="absolute right-0 mt-3 w-60 bg-white rounded-2xl shadow-2xl border border-gray-200 py-2 z-50">
                    <button
                      onClick={() => {
                        navigate("/profile");
                        setShowProfileMenu(false);
                      }}
                      className="w-full px-5 py-3 text-left hover:bg-indigo-50 flex items-center gap-3 text-gray-700 font-semibold transition-colors"
                    >
                      <FiUser size={20} />
                      View Profile
                    </button>
                    <button
                      onClick={() => {
                        navigate("/settings");
                        setShowProfileMenu(false);
                      }}
                      className="w-full px-5 py-3 text-left hover:bg-indigo-50 flex items-center gap-3 text-gray-700 font-semibold transition-colors"
                    >
                      <FiSettings size={20} />
                      Settings
                    </button>
                    <div className="border-t border-gray-200 my-2"></div>
                    <button
                      onClick={handleLogout}
                      className="w-full px-5 py-3 text-left hover:bg-red-50 flex items-center gap-3 text-red-600 font-semibold transition-colors"
                    >
                      <FiLogOut size={20} />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-2 sm:px-4 md:px-8 pt-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-10">
          {[
            {
              color: "indigo",
              icon: <FiAward />,
              label: "Total Exams",
              value: totalExams,
            },
            {
              color: "green",
              icon: <FiTrendingUp />,
              label: "Average Score",
              value: `${averageScore}%`,
            },
            {
              color: "blue",
              icon: <FiCheckCircle />,
              label: "Correct Answers",
              value: totalCorrect,
            },
            {
              color: "red",
              icon: <FiXCircle />,
              label: "Wrong Answers",
              value: totalWrong,
            },
          ].map(({ color, icon, label, value }) => (
            <div
              key={label}
              className={`bg-white rounded-2xl shadow p-3 sm:p-4 border-l-4 border-${color}-500 flex flex-col items-start`}
            >
              <div className={`p-2 bg-${color}-100 rounded-xl mb-2`}>
                {icon}
              </div>
              <p className="text-xs sm:text-sm font-bold text-gray-600 mb-1">
                {label}
              </p>
              <p className="text-lg sm:text-2xl font-extrabold text-gray-900">
                {value}
              </p>
            </div>
          ))}
        </div>

        {/* Exam Sections */}
        <div className="space-y-10">
          <ExamSection
            title="Live Exams"
            exams={liveExams}
            page={livePage}
            setPage={setLivePage}
            type="live"
            icon={<FiBarChart2 size={32} className="text-white" />}
            gradientFrom="from-purple-500"
            gradientTo="to-pink-600"
          />

          <ExamSection
            title="BCS Exams"
            exams={bcsExams}
            page={bcsPage}
            setPage={setBcsPage}
            type="bcs"
            icon={<FiAward size={32} className="text-white" />}
            gradientFrom="from-blue-500"
            gradientTo="to-cyan-600"
          />

          <ExamSection
            title="HSC Exams"
            exams={hscExams}
            page={hscPage}
            setPage={setHscPage}
            type="hsc"
            icon={<FiUser size={32} className="text-white" />}
            gradientFrom="from-green-500"
            gradientTo="to-emerald-600"
          />

          <ExamSection
            title="Bank Exams"
            exams={bankExams}
            page={bankPage}
            setPage={setBankPage}
            type="bank"
            icon={<FiAward size={32} className="text-white" />}
            gradientFrom="from-amber-500"
            gradientTo="to-orange-600"
          />
        </div>

        {/* Empty State */}
        {totalExams === 0 && (
          <div className="bg-white rounded-3xl shadow-2xl px-4 py-10 sm:px-10 sm:py-16 text-center border-2 border-dashed border-gray-300">
            <div className="w-28 h-28 sm:w-40 sm:h-40 mx-auto mb-8 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center">
              <FiAward size={56} className="sm:size-80 text-indigo-600" />
            </div>
            <h3 className="text-2xl sm:text-4xl font-extrabold text-gray-900 mb-3">
              No Exams Yet
            </h3>
            <p className="text-sm sm:text-lg text-gray-600 mb-8 max-w-md mx-auto">
              Start your learning journey by taking exams and track your
              progress!
            </p>
            <button
              onClick={() => navigate("/exams")}
              className="w-full sm:w-auto px-6 sm:px-10 py-3 sm:py-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white rounded-2xl font-extrabold text-base sm:text-xl shadow-2xl hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 transition-all"
            >
              Browse Available Exams
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;

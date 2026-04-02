import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import ExamRegistrationModal from "../../components/ExamRegistrationModal";
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const FilterDrawer = ({
  isOpen,
  onClose,
  selectedCategory,
  setSelectedCategory,
  selectedTestType,
  setSelectedTestType,
  selectedSubjects,
  setSelectedSubjects,
  categories,
  testTypes,
  subjects,
  activeFiltersCount,
  clearFilters,
}) => {
  const handleSubjectToggle = (subject) => {
    setSelectedSubjects((prev) =>
      prev.includes(subject)
        ? prev.filter((s) => s !== subject)
        : [...prev, subject]
    );
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black bg-opacity-30 z-40 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`fixed right-0 top-0 h-full w-96 max-w-[90vw] bg-card shadow-2xl z-50 transform transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border bg-muted">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-foreground">
                Advanced Filters
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-border rounded-lg transition-colors"
            >
              <svg
                className="w-6 h-6 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Filter Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            {/* Active Filters */}
            {activeFiltersCount > 0 && (
              <div className="bg-accent/10 border border-accent/30 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-accent">
                    {activeFiltersCount} filter
                    {activeFiltersCount > 1 ? "s" : ""} active
                  </span>
                  <button
                    onClick={clearFilters}
                    className="text-sm text-accent hover:text-accent/80 font-medium"
                  >
                    Clear all
                  </button>
                </div>
              </div>
            )}

            {/* Exam Category Filter */}
            <div>
              <label className="block text-sm font-semibold text-muted-foreground mb-4">
                📚 Exam Category
              </label>
              <div className="space-y-2">
                <button
                  onClick={() => setSelectedCategory("all")}
                  className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                    selectedCategory === "all"
                      ? "border-accent bg-accent text-white shadow-md"
                      : "border-border bg-muted text-muted-foreground hover:border-accent/50 hover:bg-accent/5"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">🌟</span>
                    <span className="font-medium">All Categories</span>
                  </div>
                </button>
                {categories.map((category) => (
                  <button
                    key={category.value}
                    onClick={() => setSelectedCategory(category.value)}
                    className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                      selectedCategory === category.value
                        ? "border-accent bg-accent text-white shadow-md"
                        : "border-border bg-muted text-muted-foreground hover:border-accent/50 hover:bg-accent/5"
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{category.icon}</span>
                      <span className="font-medium">{category.name}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Test Type Filter */}
            <div>
              <label className="block text-sm font-semibold text-muted-foreground mb-4">
                🎯 Test Type
              </label>
              <div className="space-y-2">
                <button
                  onClick={() => setSelectedTestType("all")}
                  className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                    selectedTestType === "all"
                      ? "border-accent bg-accent text-white shadow-md"
                      : "border-border bg-muted text-muted-foreground hover:border-accent/50 hover:bg-accent/5"
                  }`}
                >
                  <span className="font-medium">All Types</span>
                </button>
                {testTypes.map((type) => (
                  <button
                    key={type.value}
                    onClick={() => setSelectedTestType(type.value)}
                    className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                      selectedTestType === type.value
                        ? "border-accent bg-accent text-white shadow-md"
                        : "border-border bg-muted text-muted-foreground hover:border-accent/50 hover:bg-accent/5"
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-xl">{type.icon}</span>
                      <span className="font-medium">{type.name}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Subject Filter - Only show when subject-wise is selected */}
            {selectedTestType === "subject-wise" && (
              <div>
                <label className="block text-sm font-semibold text-muted-foreground mb-4">
                  📖 Subjects ({selectedSubjects.length} selected)
                </label>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {subjects.map((subject) => (
                    <button
                      key={subject}
                      onClick={() => handleSubjectToggle(subject)}
                      className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                        selectedSubjects.includes(subject)
                          ? "border-accent bg-accent text-white shadow-md"
                          : "border-border bg-muted text-muted-foreground hover:border-accent/50 hover:bg-accent/5"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{subject}</span>
                        {selectedSubjects.includes(subject) && (
                          <svg
                            className="w-5 h-5 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

// Subjects Overlay Component
const SubjectsOverlay = ({ isOpen, onClose, subjects, examTitle }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />

      {/* Overlay Content */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="bg-accent/90 p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold mb-1">Exam Subjects</h3>
              <p className="text-white/80 text-sm">{examTitle}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Subjects List */}
        <div className="p-6 max-h-96 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {subjects.map((subject, index) => (
              <div
                key={index}
                className="bg-muted rounded-lg p-4 border-l-4 border-accent hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-1">
                      {subject.name}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {subject.questionCount} Questions
                    </p>
                  </div>
                  <div className="ml-4">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-accent/10 text-accent">
                      {subject.questionCount} Q
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-muted px-6 py-4 border-t border-border">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">
              Total: {subjects.length} subjects,{" "}
              {subjects.reduce((sum, s) => sum + s.questionCount, 0)} questions
            </span>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const LiveExamsPage = () => {
  const navigate = useNavigate(); // Add this hook
  const [searchCode, setSearchCode] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedTestType, setSelectedTestType] = useState("all");
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [filteredExams, setFilteredExams] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);
  const [selectedExamForSubjects, setSelectedExamForSubjects] = useState(null);
  const [liveExams, setLiveExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [registrationModal, setRegistrationModal] = useState({ isOpen: false, exam: null });
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [reminderExamIds, setReminderExamIds] = useState(new Set());

  // Only BCS, HSC, Bank
  const categories = [
    { value: "BCS", name: "BCS", icon: "🎓" },
    { value: "HSC", name: "HSC", icon: "📚" },
    { value: "Bank", name: "Bank", icon: "🏦" },
  ];

  const testTypes = [
    { value: "model-test", name: "Model Test", icon: "🎯" },
    { value: "subject-wise", name: "Subject Wise", icon: "📖" },
  ];

  const subjects = [
    "বাংলা ভাষা ও সাহিত্য",
    "English Language and Literature",
    "গণিত",
    "Mathematics",
    "Physics",
    "Chemistry",
    "Biology",
    "সাধারণ জ্ঞান",
    "General Knowledge",
    "বিজ্ঞান",
    "কম্পিউটার ও তথ্য প্রযুক্তি",
    "মানসিক দক্ষতা",
    "নৈতিকতা ও মূল্যবোধ",
    "ভূগোল ও পরিবেশ",
    "বাংলাদেশ ও বিশ্বপরিচয়",
    "Banking",
    "Accounting",
    "Economics",
    "Finance",
    "Management",
  ];

  // Runtime guard for invalid categories
  useEffect(() => {
    const allowedCategories = ["BCS", "HSC", "Bank"];
    if (
      selectedCategory !== "all" &&
      !allowedCategories.includes(selectedCategory)
    ) {
      setSelectedCategory("all");
      setSelectedTestType("all");
      setSelectedSubjects([]);
    }
  }, [selectedCategory]);

  // Check authentication status
  useEffect(() => {
    const token = localStorage.getItem("userToken");
    setIsAuthenticated(!!token);

    // Fetch user's existing reminders if logged in
    if (token) {
      fetch(`${BACKEND_URL}/liveExam/reminders`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.success) setReminderExamIds(new Set(data.examIds));
        })
        .catch(() => {});
    }
  }, []);

  // Fetch live exams from API
  useEffect(() => {
    const fetchLiveExams = async () => {
      try {
        setLoading(true);
        
        // Get authentication token if available
        const token = localStorage.getItem("userToken");
        const headers = {
          "Content-Type": "application/json",
        };
        
        // Add Authorization header if token exists
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }
        
        const response = await fetch(`${BACKEND_URL}/liveExam/active`, {
          headers,
        });
        
        if (!response.ok) {
          throw new Error("Failed to fetch live exams");
        }
        const data = await response.json();
        if (data.success) {
          // Filter only BCS, HSC, Bank exams
          const filteredData = data.data.exams.filter((exam) =>
            ["BCS", "HSC", "Bank"].includes(exam.examType)
          );
          // Sort: real exams first, demo/practice exams last
          const sortedData = filteredData.sort((a, b) => {
            const aIsDemo = a.isDemo || a.isPractice ? 1 : 0;
            const bIsDemo = b.isDemo || b.isPractice ? 1 : 0;
            return aIsDemo - bIsDemo;
          });
          setLiveExams(sortedData);
        } else {
          throw new Error(data.message || "Failed to fetch live exams");
        }
      } catch (error) {
        console.error("Error fetching live exams:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchLiveExams();
  }, []);

  // Handle exam registration
  const handleRegister = async () => {
    const exam = registrationModal.exam;
    if (!exam) return;

    try {
      const token = localStorage.getItem("userToken");
      if (!token) {
        await Swal.fire({
          icon: "warning",
          title: "Login Required",
          text: "Please login to register for exams",
          confirmButtonText: "Go to Login",
          showCancelButton: true,
          cancelButtonText: "Cancel",
        }).then((result) => {
          if (result.isConfirmed) {
            navigate("/login");
          }
        });
        return;
      }

      const response = await fetch(`${BACKEND_URL}/liveExam/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ examId: exam._id || exam.id }),
      });

      const data = await response.json();

      if (data.success) {
        // Update the exam's registration status in the list
        setLiveExams((prevExams) =>
          prevExams.map((e) =>
            (e._id || e.id) === (exam._id || exam.id)
              ? { ...e, isRegistered: true }
              : e
          )
        );
        await Swal.fire({
          icon: "success",
          title: "Registration Successful!",
          text: "You have successfully registered for the exam",
          confirmButtonText: "OK",
          timer: 3000,
          timerProgressBar: true,
        });
      } else {
        // Check if verification is required
        if (data.requiresVerification) {
          await Swal.fire({
            icon: "warning",
            title: "Verification Required",
            html: data.message || "Only verified users can register for live exams. Please complete your verification first.",
            confirmButtonText: "Go to Verification",
            showCancelButton: true,
            cancelButtonText: "Cancel",
          }).then((result) => {
            if (result.isConfirmed) {
              navigate("/profile");
            }
          });
        } else {
          await Swal.fire({
            icon: "error",
            title: "Registration Failed",
            text: data.message || "Failed to register for exam",
            confirmButtonText: "OK",
          });
        }
        throw new Error(data.message);
      }
    } catch (error) {
      console.error("Registration error:", error);
      throw error;
    }
  };

  // Check registration before entering exam
  const checkRegistrationBeforeEnter = async (exam) => {
    // Skip registration check for demo exams
    if (exam.isDemo) {
      return true; // Demo exams don't require registration
    }

    const token = localStorage.getItem("userToken");
    if (!token) {
      await Swal.fire({
        icon: "warning",
        title: "Login Required",
        text: "Please login to enter the exam",
        confirmButtonText: "Go to Login",
        showCancelButton: true,
        cancelButtonText: "Cancel",
      }).then((result) => {
        if (result.isConfirmed) {
          navigate("/login");
        }
      });
      return false;
    }

    try {
      const response = await fetch(
        `${BACKEND_URL}/liveExam/registration/${exam._id || exam.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      // Check if verification is required
      if (data.requiresVerification) {
        await Swal.fire({
          icon: "warning",
          title: "Verification Required",
          html: data.message || "Only verified users can access live exams. Please complete your verification first.",
          confirmButtonText: "Go to Verification",
          showCancelButton: true,
          cancelButtonText: "Cancel",
        }).then((result) => {
          if (result.isConfirmed) {
            navigate("/profile");
          }
        });
        return false;
      }

      if (!data.success || !data.isRegistered) {
        await Swal.fire({
          icon: "warning",
          title: "Registration Required",
          text: "You must register for this exam before entering. Please register first.",
          confirmButtonText: "Register Now",
          showCancelButton: true,
          cancelButtonText: "Cancel",
        }).then((result) => {
          if (result.isConfirmed) {
            setRegistrationModal({ isOpen: true, exam });
          }
        });
        return false;
      }

      return true;
    } catch (error) {
      console.error("Check registration error:", error);
      await Swal.fire({
        icon: "error",
        title: "Error",
        text: "Error checking registration status. Please try again.",
        confirmButtonText: "OK",
      });
      return false;
    }
  };

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Count active filters
  useEffect(() => {
    let count = 0;
    if (selectedCategory !== "all") count++;
    if (selectedTestType !== "all") count++;
    if (selectedSubjects.length > 0) count++;
    setActiveFiltersCount(count);
  }, [selectedCategory, selectedTestType, selectedSubjects]);

  // Filter exams based on your model requirements
  useEffect(() => {
    let filtered = liveExams;

    // Search by code or title
    if (searchCode) {
      filtered = filtered.filter(
        (exam) =>
          (exam.code &&
            exam.code.toLowerCase().includes(searchCode.toLowerCase())) ||
          exam.title.toLowerCase().includes(searchCode.toLowerCase())
      );
    }

    // Filter by category (examType) - only allow BCS, HSC, Bank
    if (selectedCategory !== "all") {
      filtered = filtered.filter(
        (exam) =>
          exam.examType === selectedCategory &&
          ["BCS", "HSC", "Bank"].includes(exam.examType)
      );
    } else {
      // Even when "all" is selected, only show BCS, HSC, Bank
      filtered = filtered.filter((exam) =>
        ["BCS", "HSC", "Bank"].includes(exam.examType)
      );
    }

    // Filter by test type (tags)
    if (selectedTestType !== "all") {
      filtered = filtered.filter(
        (exam) => exam.tags && exam.tags.includes(selectedTestType)
      );
    }

    // Filter by subjects (exact match logic)
    if (selectedSubjects.length > 0) {
      filtered = filtered.filter((exam) => {
        const examSubjects = exam.subjects.map((s) => s.name);
        return (
          selectedSubjects.every((subject) => examSubjects.includes(subject)) &&
          examSubjects.filter((subject) => selectedSubjects.includes(subject))
            .length === selectedSubjects.length
        );
      });
    }

    // Only show non-expired exams
    filtered = filtered.filter((exam) => new Date(exam.endTime) > currentTime);

    setFilteredExams(filtered);
  }, [
    searchCode,
    selectedCategory,
    selectedTestType,
    selectedSubjects,
    liveExams,
    currentTime,
  ]);

  const getExamStatus = (startTime, endTime, exam) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const timeDiff = start.getTime() - currentTime.getTime();
    const timeToEnd = end.getTime() - currentTime.getTime();

    if (timeDiff <= 0 && timeToEnd > 0) {
      return {
        status: "running",
        // For demo exams, show duration instead of calculating from end time
        timeRemaining: exam?.isDemo ? exam.duration : Math.floor(timeToEnd / (1000 * 60)),
        buttonText: "🚀 Enter Exam",
        buttonColor: "from-green-500 to-emerald-600",
        statusText: "🔴 LIVE NOW",
        statusColor: "bg-red-500 text-white",
      };
    }

    if (timeToEnd <= 0) {
      return {
        status: "ended",
        buttonText: "⏰ Exam Ended",
        buttonColor: "from-gray-400 to-gray-500",
        statusText: "⚫ ENDED",
        statusColor: "bg-gray-500 text-white",
      };
    }

    const totalSeconds = Math.floor(timeDiff / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const isMoreThanOneHour = hours > 3;

    return {
      status: "upcoming",
      totalSeconds,
      hours,
      minutes,
      seconds,
      isMoreThanOneHour,
      buttonColor: isMoreThanOneHour
        ? "from-purple-500 to-violet-600"
        : "from-blue-500 to-indigo-600",
      statusText: "🟢 UPCOMING",
      statusColor: "bg-green-500 text-white",
    };
  };

  const formatCountdown = (hours, minutes, seconds) => {
    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    }
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const clearFilters = () => {
    setSelectedCategory("all");
    setSelectedTestType("all");
    setSelectedSubjects([]);
    setSearchCode("");
  };

  const getCategoryConfig = (examType) => {
    const configs = {
      BCS: { color: "from-blue-500 to-indigo-600", icon: "🎓" },
      HSC: { color: "from-green-500 to-emerald-600", icon: "📚" },
      Bank: { color: "from-purple-500 to-violet-600", icon: "🏦" },
    };
    return (
      configs[examType] || { color: "from-gray-500 to-gray-600", icon: "📝" }
    );
  };

  const ExamCard = ({ exam }) => {
    const examStatus = getExamStatus(exam.startTime, exam.endTime, exam);
    const categoryConfig = getCategoryConfig(exam.examType);

    const handleSetReminder = async (e) => {
      e.preventDefault();
      const token = localStorage.getItem("userToken");
      if (!token) {
        Swal.fire({ icon: "info", title: "Login Required", text: "Please login to set exam reminders", confirmButtonText: "Login" })
          .then((r) => { if (r.isConfirmed) navigate("/login"); });
        return;
      }
      try {
        if (hasReminder) {
          const res = await fetch(`${BACKEND_URL}/liveExam/reminder/${examId}`, {
            method: "DELETE", headers: { Authorization: `Bearer ${token}` },
          });
          const data = await res.json();
          if (data.success) {
            setReminderExamIds((prev) => { const s = new Set(prev); s.delete(examId); return s; });
            Swal.fire({ icon: "success", title: "Reminder Removed", timer: 2000, showConfirmButton: false });
          }
        } else {
          const res = await fetch(`${BACKEND_URL}/liveExam/reminder`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ examId }),
          });
          const data = await res.json();
          if (data.success) {
            setReminderExamIds((prev) => new Set([...prev, examId]));
            Swal.fire({ icon: "success", title: "Reminder Set! 🔔", text: "We'll email you 1 hour before the exam starts.", timer: 2500, showConfirmButton: false });
          } else {
            Swal.fire({ icon: "info", title: "Cannot Set Reminder", text: data.message });
          }
        }
      } catch {
        Swal.fire({ icon: "error", title: "Error", text: "Failed to update reminder. Please try again." });
      }
    };

    // Updated handleEnterExam function with registration check
    const handleEnterExam = async (e) => {
      e.preventDefault();
      
      // For demo exams, check login and verification but skip registration
      if (exam.isDemo) {
        const token = localStorage.getItem("userToken");
        if (!token) {
          await Swal.fire({
            icon: "warning",
            title: "Login Required",
            text: "Please login to enter the demo exam",
            confirmButtonText: "Go to Login",
            showCancelButton: true,
            cancelButtonText: "Cancel",
          }).then((result) => {
            if (result.isConfirmed) {
              navigate("/login");
            }
          });
          return;
        }

        // Check if user is verified
        try {
          const response = await fetch(
            `${import.meta.env.VITE_BACKEND_URL}/api/profile/verification-status`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (response.ok) {
            const data = await response.json();
            if (!data.success || !data.data?.isVerified) {
              await Swal.fire({
                icon: "warning",
                title: "Verification Required",
                html: "Please verify your profile with images before taking the demo exam.",
                confirmButtonText: "Go to Profile",
                showCancelButton: true,
                cancelButtonText: "Cancel",
              }).then((result) => {
                if (result.isConfirmed) {
                  navigate("/profile");
                }
              });
              return;
            }
          }
        } catch (error) {
          console.error("Verification check error:", error);
        }

        // Verification passed, navigate to demo exam
        navigate("/exam/live", { state: { examData: exam } });
        return;
      }
      
      // Check if user is authenticated (for non-demo exams)
      const token = localStorage.getItem("userToken");
      if (!token) {
        await Swal.fire({
          icon: "warning",
          title: "Login Required",
          text: "Please login to enter the exam",
          confirmButtonText: "Go to Login",
          showCancelButton: true,
          cancelButtonText: "Cancel",
        }).then((result) => {
          if (result.isConfirmed) {
            navigate("/login");
          }
        });
        return;
      }

      // Check registration before entering (for non-demo exams)
      const isRegistered = await checkRegistrationBeforeEnter(exam);
      if (!isRegistered) {
        return; // Registration modal will be shown by checkRegistrationBeforeEnter
      }

      // Navigate to /exam/room/live with exam data
      navigate("/exam/live", { state: { examData: exam } });
    };

    const handleOpenRegistration = async (e) => {
      e.preventDefault();
      const token = localStorage.getItem("userToken");
      if (!token) {
        await Swal.fire({
          icon: "warning",
          title: "Login Required",
          text: "Please login to register for exams",
          confirmButtonText: "Go to Login",
          showCancelButton: true,
          cancelButtonText: "Cancel",
        }).then((result) => {
          if (result.isConfirmed) {
            navigate("/login");
          }
        });
        return;
      }
      setRegistrationModal({ isOpen: true, exam });
    };

    const examId = exam._id || exam.id;
    const hasReminder = reminderExamIds.has(examId);
    const showBell = true; // Bell available on all exams

    const handleReminderClick = async (e) => {
      e.stopPropagation();
      const token = localStorage.getItem("userToken");
      if (!token) {
        Swal.fire({ icon: "info", title: "Login Required", text: "Please login to set exam reminders", confirmButtonText: "Login" })
          .then((r) => { if (r.isConfirmed) navigate("/login"); });
        return;
      }
      try {
        if (hasReminder) {
          const res = await fetch(`${BACKEND_URL}/liveExam/reminder/${examId}`, {
            method: "DELETE", headers: { Authorization: `Bearer ${token}` },
          });
          const data = await res.json();
          if (data.success) {
            setReminderExamIds((prev) => { const s = new Set(prev); s.delete(examId); return s; });
            Swal.fire({ icon: "success", title: "Reminder Removed", timer: 2000, showConfirmButton: false });
          }
        } else {
          const res = await fetch(`${BACKEND_URL}/liveExam/reminder`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ examId }),
          });
          const data = await res.json();
          if (data.success) {
            setReminderExamIds((prev) => new Set([...prev, examId]));
            Swal.fire({ icon: "success", title: "Reminder Set! 🔔", text: "We'll email you 1 hour before the exam starts.", timer: 2500, showConfirmButton: false });
          } else {
            Swal.fire({ icon: "info", title: "Cannot Set Reminder", text: data.message });
          }
        }
      } catch {
        Swal.fire({ icon: "error", title: "Error", text: "Failed to update reminder. Please try again." });
      }
    };

    return (
      <div className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 border border-gray-100 hover:border-blue-200 overflow-hidden h-full flex flex-col relative">
        {/* Card Header */}
        <div
          className={`bg-gradient-to-r ${categoryConfig.color} p-5 relative overflow-hidden`}
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-white bg-opacity-10 rounded-full -mr-12 -mt-12 transition-transform duration-500 group-hover:scale-110"></div>

          <div className="relative z-10 flex justify-between items-start">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                <span className="text-2xl">{categoryConfig.icon}</span>
              </div>
              <div>
                <h4 className="text-white font-bold text-lg">
                  {exam.examType}
                </h4>
                <p className="text-white text-opacity-90 text-sm">
                  {exam.code
                    ? `Code: ${exam.code}`
                    : `ID: ${exam.id.slice(-6)}`}
                </p>
              </div>
            </div>
            <div className="flex flex-col items-end space-y-2">
              <span
                className={`text-xs px-3 py-1 rounded-full font-medium ${examStatus.statusColor} animate-pulse`}
              >
                {examStatus.statusText}
              </span>
              {exam.isPremium && (
                <span className="bg-yellow-400 text-yellow-900 text-xs px-2 py-1 rounded-full font-medium">
                  ⭐ Premium
                </span>
              )}
              {(exam.isDemo || exam.isPractice) && (
                <span className="bg-violet-500 text-white text-xs px-2 py-1 rounded-full font-semibold tracking-wide shadow-sm">
                  🎓 Demo
                </span>
              )}
              {isAuthenticated && exam.isRegistered && (
                <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                  ✓ Registered
                </span>
              )}

            </div>
          </div>
        </div>

        <div className="p-5 flex-1 flex flex-col space-y-4">
          {/* Title */}
          <h3 className="text-xl font-bold text-gray-900 line-clamp-2 group-hover:text-blue-700 transition-colors">
            {exam.title}
          </h3>

          {/* Test Type Badge */}
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
              {exam.tags && exam.tags.includes("model-test")
                ? "🎯 Model Test"
                : exam.tags && exam.tags.includes("subject-wise")
                ? "📖 Subject Wise"
                : "📝 General"}
            </span>
            {exam.password && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                🔒 Protected
              </span>
            )}
          </div>

          {/* Exam Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Duration</p>
                  <p className="text-sm font-bold text-gray-900">
                    {exam.duration}m
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Questions</p>
                  <p className="text-sm font-bold text-gray-900">
                    {exam.totalQuestions}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Subjects Button */}
          <button
            onClick={() => setSelectedExamForSubjects(exam)}
            className="w-full flex items-center justify-center space-x-2 p-3 bg-gradient-to-r from-gray-100 to-gray-200 rounded-lg hover:from-blue-100 hover:to-blue-200 transition-all duration-300 group-hover:shadow-md"
          >
            <svg
              className="w-5 h-5 text-gray-600 group-hover:text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
            <span className="text-sm font-medium text-gray-700 group-hover:text-blue-700">
              View Subjects ({exam.subjects.length})
            </span>
          </button>

          {/* Date */}
          <div className="space-y-2">
            <div className="flex items-center text-gray-600">
              <svg
                className="w-5 h-5 mr-2 text-blue-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <span className="text-sm font-medium">
                {formatDate(exam.startTime)}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-auto space-y-2">

            {/* ── UPCOMING ─────────────────────────────────────────── */}
            {examStatus.status === "upcoming" && (
              <>
                {/* Countdown / reminder strip */}
                {examStatus.isMoreThanOneHour ? (
                  !exam.isDemo && (
                    <button
                      onClick={handleReminderClick}
                      className={`w-full font-semibold py-3 px-4 rounded-xl transition-all duration-300 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] ${
                        hasReminder
                          ? "bg-amber-500 text-white hover:bg-amber-600"
                          : `bg-gradient-to-r ${examStatus.buttonColor} text-white`
                      }`}
                    >
                      {hasReminder ? "🔕 Remove Reminder" : "🔔 Set Reminder"}
                    </button>
                  )
                ) : (
                  <div className={`w-full bg-gradient-to-r ${examStatus.buttonColor} text-white font-semibold py-3 px-4 rounded-xl text-center`}>
                    ⏳ Starts in {formatCountdown(examStatus.hours, examStatus.minutes, examStatus.seconds)}
                  </div>
                )}

                {/* Registration row — for non-demo exams only */}
                {!exam.isDemo && (
                  <>
                    {/* Not logged in */}
                    {!isAuthenticated && (
                      <button
                        onClick={() => navigate("/login")}
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-300 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
                      >
                        🔑 Login to Register
                      </button>
                    )}

                    {/* Logged in but not registered */}
                    {isAuthenticated && !exam.isRegistered && (
                      <button
                        onClick={handleOpenRegistration}
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-300 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
                      >
                        📝 Register for Exam
                      </button>
                    )}

                    {/* Already registered */}
                    {isAuthenticated && exam.isRegistered && (
                      <div className="w-full bg-green-100 border border-green-300 text-green-800 font-semibold py-2 px-4 rounded-xl text-center text-sm">
                        ✅ Registered
                      </div>
                    )}
                  </>
                )}
              </>
            )}

            {/* ── RUNNING ──────────────────────────────────────────── */}
            {examStatus.status === "running" && (
              <>
                {/* Not logged in */}
                {!isAuthenticated ? (
                  <button
                    onClick={() => navigate("/login")}
                    className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-300 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
                  >
                    🔑 Login to Enter
                  </button>
                ) : (
                  <button
                    onClick={handleEnterExam}
                    className={`w-full bg-gradient-to-r ${examStatus.buttonColor} text-white font-semibold py-3 px-4 rounded-xl transition-all duration-300 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]`}
                  >
                    🚀 Enter Exam
                  </button>
                )}

                {/* Not registered hint for non-demo running exams */}
                {!exam.isDemo && isAuthenticated && !exam.isRegistered && (
                  <p className="text-xs text-center text-amber-700 bg-amber-50 border border-amber-200 rounded-lg py-1.5 px-3">
                    ⚠️ Not registered — you will be prompted on entry
                  </p>
                )}
                {!exam.isDemo && isAuthenticated && exam.isRegistered && (
                  <div className="w-full bg-green-100 border border-green-300 text-green-800 font-semibold py-1.5 px-4 rounded-xl text-center text-xs">
                    ✅ Registered
                  </div>
                )}
              </>
            )}

            {/* ── ENDED ────────────────────────────────────────────── */}
            {examStatus.status === "ended" && (
              <button
                disabled
                className="w-full bg-gradient-to-r from-gray-400 to-gray-500 text-white font-semibold py-3 px-4 rounded-xl opacity-50 cursor-not-allowed"
              >
                ⏰ Exam Ended
              </button>
            )}

          </div>
        </div>
      </div>
    );
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading live exams...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Error Loading Exams
          </h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 bg-clip-text text-transparent mb-2">
                🔴 Live Exams
              </h1>
              <p className="text-gray-600 text-lg">
                Join live exams and test your knowledge
              </p>
            </div>
            <div className="hidden sm:flex items-center space-x-4">
              <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-lg shadow-sm">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-gray-700">
                  {filteredExams.length} Live Exams
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="mb-8">
          <div className="flex items-center space-x-4">
            {/* Search Bar */}
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg
                  className="h-5 w-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search by exam code or title..."
                value={searchCode}
                onChange={(e) => setSearchCode(e.target.value)}
                className="block w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white shadow-sm text-gray-900 placeholder-gray-500"
              />
            </div>

            {/* Filter Button */}
            <button
              onClick={() => setIsFilterOpen(true)}
              className="relative flex items-center space-x-2 px-6 py-3 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all hover:scale-105 active:scale-95 font-medium"
            >
              <svg
                className="w-5 h-5 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4"
                />
              </svg>
              <span className="text-gray-700">Filters</span>
              {activeFiltersCount > 0 && (
                <span className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                  {activeFiltersCount}
                </span>
              )}
            </button>
          </div>

          {/* Active Filters Display */}
          {activeFiltersCount > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {selectedCategory !== "all" && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 border border-blue-200">
                  📚 {selectedCategory}
                  <button
                    onClick={() => setSelectedCategory("all")}
                    className="ml-2 text-blue-600 hover:text-blue-800"
                  >
                    ×
                  </button>
                </span>
              )}
              {selectedTestType !== "all" && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800 border border-purple-200">
                  {selectedTestType === "model-test"
                    ? "🎯 Model Test"
                    : "📖 Subject Wise"}
                  <button
                    onClick={() => setSelectedTestType("all")}
                    className="ml-2 text-purple-600 hover:text-purple-800"
                  >
                    ×
                  </button>
                </span>
              )}
              {selectedSubjects.length > 0 && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 border border-green-200">
                  📖 {selectedSubjects.length} Subject
                  {selectedSubjects.length > 1 ? "s" : ""}
                  <button
                    onClick={() => setSelectedSubjects([])}
                    className="ml-2 text-green-600 hover:text-green-800"
                  >
                    ×
                  </button>
                </span>
              )}
            </div>
          )}
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-gray-600 text-lg">
            <span className="font-bold text-gray-900">
              {filteredExams.length}
            </span>{" "}
            exam{filteredExams.length !== 1 ? "s" : ""} found
          </p>
        </div>

        {/* Exam Grid - 3 cards per row */}
        {filteredExams.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredExams.map((exam) => (
              <ExamCard key={exam.id} exam={exam} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-12 h-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No exams found
            </h3>
            <p className="text-gray-600 mb-4">
              Try adjusting your search or filters
            </p>
            <button
              onClick={clearFilters}
              className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Clear all filters
            </button>
          </div>
        )}

        {/* Filter Drawer */}
        <FilterDrawer
          isOpen={isFilterOpen}
          onClose={() => setIsFilterOpen(false)}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          selectedTestType={selectedTestType}
          setSelectedTestType={setSelectedTestType}
          selectedSubjects={selectedSubjects}
          setSelectedSubjects={setSelectedSubjects}
          categories={categories}
          testTypes={testTypes}
          subjects={subjects}
          activeFiltersCount={activeFiltersCount}
          clearFilters={clearFilters}
        />

        {/* Subjects Overlay */}
        <SubjectsOverlay
          isOpen={!!selectedExamForSubjects}
          onClose={() => setSelectedExamForSubjects(null)}
          subjects={selectedExamForSubjects?.subjects || []}
          examTitle={selectedExamForSubjects?.title || ""}
        />

        {/* Registration Modal */}
        <ExamRegistrationModal
          isOpen={registrationModal.isOpen}
          onClose={() => setRegistrationModal({ isOpen: false, exam: null })}
          exam={registrationModal.exam}
          onRegister={handleRegister}
        />
      </div>
    </div>
  );
};

export default LiveExamsPage;

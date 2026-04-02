import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import ExamHeader from "./components/ExamHeader";
import QuestionDisplay from "./components/QuestionDisplay";
import NavigationSidebar from "./components/NavigationSidebar";
import StartConfirmation from "./screens/StartConfirmation";
import SubmitConfirmation from "./screens/SubmitConfirmation";
import ExamReview from "./ExamReview";

const OthersExamRoom = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [examData, setExamData] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentSubjectIndex, setCurrentSubjectIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [reviewMarked, setReviewMarked] = useState(new Set());
  const [visitedQuestions, setVisitedQuestions] = useState(new Set());
  const [timeLeft, setTimeLeft] = useState(0);
  const [examStarted, setExamStarted] = useState(false);
  const [showStartConfirm, setShowStartConfirm] = useState(true);
  const [examCompleted, setExamCompleted] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // State for exam metadata
  const [examType, setExamType] = useState("Other");
  const [examCategory, setExamCategory] = useState("full");
  const [examTitle, setExamTitle] = useState("Practice Exam");

  const getStorageKey = (key) => {
    return examData ? `practice_exam_${examData._id}_${key}` : null;
  };

  useEffect(() => {
    const passedExamData = location.state?.examData;
    const passedExamType = location.state?.examType;
    const passedCategory = location.state?.category;
    const passedTitle = location.state?.title;
    const passedYear = location.state?.year;

    if (!passedExamData) {
      navigate("/exams");
      return;
    }

    // Set examType, category, and title from navigation state
    setExamType(passedExamType || "Other");
    setExamCategory(passedCategory || "full");
    setExamTitle(
      passedTitle || `${passedExamData.subjects[0]?.name || "Practice"} Exam`
    );

    // Enrich exam data with year if passed
    const enrichedExamData = {
      ...passedExamData,
      examYear: passedYear || passedExamData.examYear,
    };

    setExamData(enrichedExamData);

    const subjects = Array.isArray(enrichedExamData.subjects)
      ? enrichedExamData.subjects
      : [];

    const savedStartTime = localStorage.getItem(
      `practice_exam_${passedExamData._id}_startTime`
    );
    const savedAnswers = localStorage.getItem(
      `practice_exam_${passedExamData._id}_answers`
    );
    const savedReviewMarked = localStorage.getItem(
      `practice_exam_${passedExamData._id}_reviewMarked`
    );
    const savedVisitedQuestions = localStorage.getItem(
      `practice_exam_${passedExamData._id}_visitedQuestions`
    );
    const savedCurrentSubject = localStorage.getItem(
      `practice_exam_${passedExamData._id}_currentSubject`
    );
    const savedCurrentQuestion = localStorage.getItem(
      `practice_exam_${passedExamData._id}_currentQuestion`
    );

    if (savedAnswers) setAnswers(JSON.parse(savedAnswers));
    if (savedReviewMarked)
      setReviewMarked(new Set(JSON.parse(savedReviewMarked)));
    if (savedVisitedQuestions)
      setVisitedQuestions(new Set(JSON.parse(savedVisitedQuestions)));

    const maxSubjectIndex = subjects.length - 1;
    const initSubjectIndex = savedCurrentSubject
      ? Math.min(parseInt(savedCurrentSubject), maxSubjectIndex)
      : 0;
    setCurrentSubjectIndex(initSubjectIndex);

    const currentSubjectQuestions = subjects[initSubjectIndex]?.questions || [];
    const maxQuestionIndex = currentSubjectQuestions.length - 1;
    const initQuestionIndex = savedCurrentQuestion
      ? Math.min(parseInt(savedCurrentQuestion), maxQuestionIndex)
      : 0;
    setCurrentQuestionIndex(initQuestionIndex);

    // Calculate duration: 1 question = 1 minute
    const totalQuestions = subjects.reduce(
      (total, subject) => total + (subject.questions?.length || 0),
      0
    );

    const totalDuration = enrichedExamData.duration
      ? enrichedExamData.duration * 60
      : totalQuestions * 60;

    if (savedStartTime) {
      const elapsed = Math.floor(
        (Date.now() - parseInt(savedStartTime)) / 1000
      );
      const remaining = Math.max(0, totalDuration - elapsed);
      setTimeLeft(remaining);
      if (remaining === 0) setExamCompleted(true);
    } else {
      setTimeLeft(totalDuration);
    }
  }, [location.state, navigate]);

  useEffect(() => {
    if (!examStarted || timeLeft <= 0 || examCompleted) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setExamCompleted(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [examStarted, timeLeft, examCompleted]);

  useEffect(() => {
    if (!examData || !examStarted) return;
    localStorage.setItem(getStorageKey("answers"), JSON.stringify(answers));
    localStorage.setItem(
      getStorageKey("reviewMarked"),
      JSON.stringify([...reviewMarked])
    );
    localStorage.setItem(
      getStorageKey("visitedQuestions"),
      JSON.stringify([...visitedQuestions])
    );
    localStorage.setItem(
      getStorageKey("currentSubject"),
      currentSubjectIndex.toString()
    );
    localStorage.setItem(
      getStorageKey("currentQuestion"),
      currentQuestionIndex.toString()
    );
  }, [
    answers,
    reviewMarked,
    visitedQuestions,
    currentSubjectIndex,
    currentQuestionIndex,
    examData,
    examStarted,
  ]);

  const requestFullscreen = async () => {
    if (examCompleted) return setIsFullscreen(false);
    try {
      const elem = document.documentElement;
      if (elem.requestFullscreen) await elem.requestFullscreen();
      else if (elem.webkitRequestFullscreen)
        await elem.webkitRequestFullscreen();
      else if (elem.mozRequestFullScreen) await elem.mozRequestFullScreen();
      else if (elem.msRequestFullscreen) await elem.msRequestFullscreen();
      setIsFullscreen(true);
    } catch {
      setIsFullscreen(false);
    }
  };

  const exitFullscreen = async () => {
    try {
      if (document.exitFullscreen) await document.exitFullscreen();
      else if (document.webkitExitFullscreen)
        await document.webkitExitFullscreen();
      else if (document.mozCancelFullScreen)
        await document.mozCancelFullScreen();
      else if (document.msExitFullscreen) await document.msExitFullscreen();
      setIsFullscreen(false);
    } catch {}
  };

  useEffect(() => {
    if (!examCompleted) requestFullscreen();
    else exitFullscreen();

    const handleChange = () => {
      const fs = !!(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement
      );
      setIsFullscreen(fs);
    };

    document.addEventListener("fullscreenchange", handleChange);
    document.addEventListener("webkitfullscreenchange", handleChange);
    document.addEventListener("mozfullscreenchange", handleChange);
    document.addEventListener("MSFullscreenChange", handleChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleChange);
      document.removeEventListener("webkitfullscreenchange", handleChange);
      document.removeEventListener("mozfullscreenchange", handleChange);
      document.removeEventListener("MSFullscreenChange", handleChange);
    };
  }, [examCompleted]);

  const clearExamStorage = () => {
    if (!examData) return;
    localStorage.removeItem(getStorageKey("answers"));
    localStorage.removeItem(getStorageKey("reviewMarked"));
    localStorage.removeItem(getStorageKey("visitedQuestions"));
    localStorage.removeItem(getStorageKey("currentSubject"));
    localStorage.removeItem(getStorageKey("currentQuestion"));
    localStorage.removeItem(getStorageKey("startTime"));
  };

  // Calculate exam results
  const calculateExamResults = (examData, answers) => {
    let correctCount = 0;
    let wrongCount = 0;
    let totalMarks = 0;
    let negativeMarksDeducted = 0;

    const difficultyStats = {
      easy: { correct: 0, wrong: 0, skipped: 0 },
      medium: { correct: 0, wrong: 0, skipped: 0 },
      hard: { correct: 0, wrong: 0, skipped: 0 },
    };

    const subjectPerformance = [];
    let totalPossibleMarks = 0;

    examData.subjects.forEach((subject, subjectIndex) => {
      let subjectCorrect = 0;
      let subjectWrong = 0;
      let subjectSkipped = 0;
      let subjectAttempted = 0;
      let subjectMarks = 0;
      let subjectMaxMarks = 0;

      subject.questions.forEach((question, questionIndex) => {
        const questionKey = `${subjectIndex}-${questionIndex}`;
        const userAnswer = answers[questionKey];
        const difficulty = question.difficulty || "medium";
        const marks = question.marks || 1;

        subjectMaxMarks += marks;
        totalPossibleMarks += marks;

        if (userAnswer !== undefined) {
          subjectAttempted++;

          if (userAnswer === question.correctAnswer) {
            correctCount++;
            subjectCorrect++;
            totalMarks += marks;
            subjectMarks += marks;
            difficultyStats[difficulty].correct++;
          } else {
            wrongCount++;
            subjectWrong++;
            difficultyStats[difficulty].wrong++;

            if (question.negativeMarks) {
              totalMarks -= question.negativeMarks;
              subjectMarks -= question.negativeMarks;
              negativeMarksDeducted += question.negativeMarks;
            }
          }
        } else {
          subjectSkipped++;
          difficultyStats[difficulty].skipped++;
        }
      });

      subjectPerformance.push({
        subjectName: subject.name,
        totalQuestions: subject.questions.length,
        attempted: subjectAttempted,
        correct: subjectCorrect,
        wrong: subjectWrong,
        skipped: subjectSkipped,
        marksObtained: Math.max(0, subjectMarks),
        maxMarks: subjectMaxMarks,
      });
    });

    totalMarks = Math.max(0, totalMarks);
    const percentage =
      totalPossibleMarks > 0
        ? parseFloat(((totalMarks / totalPossibleMarks) * 100).toFixed(2))
        : 0;

    return {
      correctAnswers: correctCount,
      wrongAnswers: wrongCount,
      totalMarksObtained: totalMarks,
      totalPossibleMarks: totalPossibleMarks,
      percentage: percentage,
      negativeMarksDeducted: negativeMarksDeducted,
      difficultyStats,
      subjectPerformance,
    };
  };

  const handleStartExam = () => {
    setShowStartConfirm(false);
    setExamStarted(true);
    markQuestionVisited(0, 0);
    localStorage.setItem(getStorageKey("startTime"), Date.now().toString());
  };

  const handleSubmitClick = () => setShowSubmitConfirm(true);

  const handleSubmitConfirm = async () => {
    setShowSubmitConfirm(false);
    setExamCompleted(true);

    // Get user data from localStorage
    const userInfo = JSON.parse(localStorage.getItem("userInfo"));
    const userId = userInfo?._id || userInfo?.id;
    const username = userInfo?.username;
    const email = userInfo?.email;

    if (!userId || !username || !email) {
      console.error("User data not found in localStorage");
      clearExamStorage();
      return;
    }

    // Calculate statistics
    const totalQuestions = examData.subjects.reduce(
      (total, subject) => total + subject.questions.length,
      0
    );
    const attemptedCount = Object.keys(answers).length;
    const skippedCount = totalQuestions - attemptedCount;
    const markedForReviewCount = reviewMarked.size;

    const durationInMinutes = examData.duration || totalQuestions;
    const timeConsumed = durationInMinutes * 60 - timeLeft;
    const startTime = new Date(Date.now() - timeConsumed * 1000);

    const results = calculateExamResults(examData, answers);

    // Build examSnapshot using state variables
    const examSnapshot = {
      title: examTitle,
      examType: examType,
      duration: durationInMinutes,
      tags: examData.tags || [],
      category: examCategory,
      subjects: examData.subjects, // ✅ Include full subjects with questions for review
    };

    // ✅ Add conditional fields based on examType AND category
    if (examCategory === "full") {
      if (examType === "HSC") {
        // ✅ For full HSC exams, add all required fields
        examSnapshot.examYear = examData.examYear;
        examSnapshot.hscGroup = examData.group;
        examSnapshot.hscBoard = examData.board;

        // Validate before sending
      } else if (examType === "BCS") {
        // ✅ For full BCS exams
        examSnapshot.examYear = examData.examYear;
        examSnapshot.batch = examData.batch;

        // Validate before sending
        if (!examSnapshot.examYear || !examSnapshot.batch) {
          console.error("❌ Missing BCS fields:", {
            examYear: examSnapshot.examYear,
            batch: examSnapshot.batch,
          });
          alert("Missing BCS exam information. Please check exam data.");
          return;
        }
      } else if (examType === "Bank") {
        // ✅ For full Bank exams
        examSnapshot.examYear = examData.examYear;

        // Validate before sending
        if (!examSnapshot.examYear) {
          console.error("❌ Missing Bank examYear:", examSnapshot.examYear);
          alert("Missing Bank exam year. Please check exam data.");
          return;
        }
      }
    }
    // For subject-wise exams, no year/batch/group needed

    const submissionData = {
      examId: examData._id,
      userId: userId,
      username: username,
      email: email,
      examSnapshot: examSnapshot,
      answers: answers,
      questionStats: {
        totalQuestions: totalQuestions,
        attempted: attemptedCount,
        skipped: skippedCount,
        markedForReview: markedForReviewCount,
      },
      resultMetrics: {
        correctAnswers: results.correctAnswers,
        wrongAnswers: results.wrongAnswers,
        totalMarksObtained: results.totalMarksObtained,
        totalPossibleMarks: results.totalPossibleMarks,
        percentage: results.percentage,
        negativeMarksDeducted: results.negativeMarksDeducted,
      },
      difficultyStats: results.difficultyStats,
      subjectWisePerformance: results.subjectPerformance,
      timeTracking: {
        timeAllocated: durationInMinutes * 60,
        timeConsumed: timeConsumed,
        timeRemaining: timeLeft,
        startedAt: startTime,
        submittedAt: new Date(),
      },
    };

    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/practice-exam/submit`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(submissionData),
        }
      );

      if (response.ok) {
        const result = await response.json();
        clearExamStorage();
      } else {
        const error = await response.json();
        console.error("❌ Submission failed:", error);
        alert(`Submission failed: ${error.message}`);
        clearExamStorage();
      }
    } catch (error) {
      console.error("❌ Submission error:", error);
      alert("Network error. Please try again.");
      clearExamStorage();
    }
  };

  const handleSubmitCancel = () => setShowSubmitConfirm(false);

  const handleAnswerSelect = (optionIndex) => {
    const key = `${currentSubjectIndex}-${currentQuestionIndex}`;
    setAnswers((prev) => ({ ...prev, [key]: optionIndex }));
  };

  const toggleReviewMark = () => {
    const key = `${currentSubjectIndex}-${currentQuestionIndex}`;
    setReviewMarked((prev) => {
      const newSet = new Set(prev);
      newSet.has(key) ? newSet.delete(key) : newSet.add(key);
      return newSet;
    });
  };

  const markQuestionVisited = (subjectIndex, questionIndex) => {
    const key = `${subjectIndex}-${questionIndex}`;
    setVisitedQuestions((prev) => new Set([...prev, key]));
  };

  const goToQuestion = (subjectIndex, questionIndex) => {
    setCurrentSubjectIndex(subjectIndex);
    setCurrentQuestionIndex(questionIndex);
    markQuestionVisited(subjectIndex, questionIndex);
    setShowMobileSidebar(false);
  };

  const goToNextQuestion = () => {
    if (!examData) return;
    const subjects = Array.isArray(examData.subjects) ? examData.subjects : [];
    if (subjects.length === 0) return;

    const currentSubject = subjects[currentSubjectIndex] || { questions: [] };
    if (currentQuestionIndex < currentSubject.questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      markQuestionVisited(currentSubjectIndex, currentQuestionIndex + 1);
    } else if (currentSubjectIndex < subjects.length - 1) {
      setCurrentSubjectIndex((prev) => prev + 1);
      setCurrentQuestionIndex(0);
      markQuestionVisited(currentSubjectIndex + 1, 0);
    }
  };

  const goToPreviousQuestion = () => {
    if (!examData) return;
    const subjects = Array.isArray(examData.subjects) ? examData.subjects : [];
    if (subjects.length === 0) return;

    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
      markQuestionVisited(currentSubjectIndex, currentQuestionIndex - 1);
    } else if (currentSubjectIndex > 0) {
      const prevSubject = subjects[currentSubjectIndex - 1] || {
        questions: [],
      };
      setCurrentSubjectIndex((prev) => prev - 1);
      setCurrentQuestionIndex(prevSubject.questions.length - 1);
      markQuestionVisited(
        currentSubjectIndex - 1,
        prevSubject.questions.length - 1
      );
    }
  };

  const isLastQuestion = () => {
    if (!examData) return true;
    const subjects = Array.isArray(examData.subjects) ? examData.subjects : [];
    if (subjects.length === 0) return true;
    const lastSubjectIndex = subjects.length - 1;
    const lastQuestionIndex = subjects[lastSubjectIndex].questions.length - 1;
    return (
      currentSubjectIndex === lastSubjectIndex &&
      currentQuestionIndex === lastQuestionIndex
    );
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  if (!examData) return <div>Loading...</div>;

  const subjects = Array.isArray(examData.subjects) ? examData.subjects : [];
  const currentSubject = subjects[currentSubjectIndex] || { questions: [] };
  const currentQuestion =
    currentSubject.questions[currentQuestionIndex] || null;

  if (showStartConfirm) {
    return (
      <StartConfirmation
        examData={examData}
        onStart={handleStartExam}
        isLive={false}
      />
    );
  }

  if (examCompleted) {
    return <ExamReview examData={examData} answers={answers} />;
  }

  return (
    <div className="h-screen flex flex-col lg:flex-row overflow-hidden bg-white relative">
      {/* Fullscreen Toggle */}
      <button
        onClick={() => (isFullscreen ? exitFullscreen() : requestFullscreen())}
        className={`fixed right-4 z-50 p-3 bg-blue-600 text-white rounded-lg shadow-lg hover:bg-blue-700 transition-colors ${
          isFullscreen ? "top-16" : "top-4"
        }`}
        title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
        disabled={examCompleted}
      >
        {isFullscreen ? (
          <svg
            className="w-5 h-5"
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
        ) : (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
            />
          </svg>
        )}
      </button>

      {/* Mobile Sidebar Overlay */}
      {showMobileSidebar && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setShowMobileSidebar(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed lg:relative inset-y-0 left-0 z-50 lg:z-auto w-80 transform transition-transform duration-300 ease-in-out lg:transform-none ${
          showMobileSidebar
            ? "translate-x-0"
            : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <NavigationSidebar
          examData={examData}
          currentSubjectIndex={currentSubjectIndex}
          currentQuestionIndex={currentQuestionIndex}
          answers={answers}
          reviewMarked={reviewMarked}
          visitedQuestions={visitedQuestions}
          timeLeft={timeLeft}
          goToQuestion={goToQuestion}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Mobile Header */}
        <div className="lg:hidden bg-white border-b shadow-sm">
          <div className="flex items-center justify-between p-3">
            <button
              onClick={() => setShowMobileSidebar(!showMobileSidebar)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <svg
                className="w-6 h-6 text-gray-700"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
            <div className="flex flex-col items-center bg-blue-600 px-4 py-2 rounded-lg">
              <span className="text-2xl font-mono font-bold text-white">
                {formatTime(timeLeft)}
              </span>
              <span className="text-xs text-blue-100">Time Remaining</span>
            </div>
            <button
              onClick={handleSubmitClick}
              className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors"
            >
              Submit
            </button>
          </div>
          <div className="px-3 py-2 bg-gray-50 border-t flex items-center justify-between text-sm">
            <span className="text-gray-600 font-medium">
              Question {currentQuestionIndex + 1} of{" "}
              {subjects.reduce(
                (sum, sub) => sum + (sub.questions?.length || 0),
                0
              )}
            </span>
            <span className="text-gray-500 text-xs">
              {currentSubject.name || ""}
            </span>
          </div>
        </div>

        {/* Desktop Header */}
        <div className="hidden lg:block">
          <ExamHeader
            examData={examData}
            currentSubjectIndex={currentSubjectIndex}
            currentQuestionIndex={currentQuestionIndex}
            onSubmit={handleSubmitClick}
            showSubmit={true}
          />
        </div>

        {currentQuestion ? (
          <QuestionDisplay
            question={currentQuestion}
            answers={answers}
            currentSubjectIndex={currentSubjectIndex}
            currentQuestionIndex={currentQuestionIndex}
            onAnswerSelect={handleAnswerSelect}
            onToggleReview={toggleReviewMark}
            onNext={goToNextQuestion}
            onPrevious={goToPreviousQuestion}
            reviewMarked={reviewMarked}
            isLastQuestion={isLastQuestion()}
          />
        ) : (
          <div className="p-4 text-center text-gray-600">
            No questions available
          </div>
        )}
      </div>

      {showSubmitConfirm && (
        <SubmitConfirmation
          onConfirm={handleSubmitConfirm}
          onCancel={handleSubmitCancel}
        />
      )}
    </div>
  );
};

export default OthersExamRoom;

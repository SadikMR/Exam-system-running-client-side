import { useState, useEffect, useCallback, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import ExamHeader from "./components/ExamHeader";
import QuestionDisplay from "./components/QuestionDisplay";
import NavigationSidebar from "./components/NavigationSidebar";
import StartConfirmation from "./screens/StartConfirmation";
import ViolationWarning from "./screens/ViolationWarning";
import ExpelledScreen from "./screens/ExpelledScreen";
import SubmitConfirmation from "./screens/SubmitConfirmation";
import ExamCompletedScreen from "./screens/ExamCompletedScreen";
import useExamTimer from "../../hooks/useExamTimer";
import useExamMonitoring from "../../hooks/useExamMonitoring";
import useFullscreen from "../../hooks/useFullscreen";
import useWebcamMonitoring from "../../hooks/useWebcamMonitoring";
import WebcamMonitoringPanel from "../../components/WebcamMonitoringPanel";

const LiveExamRoom = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [examData, setExamData] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentSubjectIndex, setCurrentSubjectIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [reviewMarked, setReviewMarked] = useState(new Set());
  const [visitedQuestions, setVisitedQuestions] = useState(new Set());
  const [examStarted, setExamStarted] = useState(false);
  const [showStartConfirm, setShowStartConfirm] = useState(true);
  const [examCompleted, setExamCompleted] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [submissionLoading, setSubmissionLoading] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [verificationImages, setVerificationImages] = useState(null);
  const [webcamMonitoringEnabled, setWebcamMonitoringEnabled] = useState(false);
  
  // Common violation counter - increments for both web focus and webcam violations
  const [commonViolationCount, setCommonViolationCount] = useState(() => {
    if (location.state?.examData?._id) {
      const saved = localStorage.getItem(`exam_${location.state.examData._id}_commonViolations`);
      return saved ? parseInt(saved, 10) : 0;
    }
    return 0;
  });

  const { isFullscreen, setIsFullscreen, enterFullscreen } = useFullscreen();

  const getStorageKey = (key) => {
    return examData ? `exam_${examData._id}_${key}` : null;
  };

  useEffect(() => {
    const passedExamData = location.state?.examData;

    // Check registration before allowing exam entry
    const checkRegistration = async () => {
      if (!passedExamData) return;

      // For demo exams, check verification but skip registration
      if (passedExamData.isDemo) {
        console.log("✅ Demo exam detected - checking verification...");
        
        const token = localStorage.getItem("userToken");
        if (!token) {
          await Swal.fire({
            icon: "warning",
            title: "Login Required",
            text: "Please login to enter the demo exam",
            confirmButtonText: "Go to Login",
          }).then(() => {
            navigate("/login");
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
                } else {
                  navigate("/LiveExams");
                }
              });
              return;
            }
          }
        } catch (error) {
          console.error("Verification check error:", error);
        }
        
        // Verification passed, allow demo exam entry
        return;
      }

      const token = localStorage.getItem("userToken");
      if (!token) {
        await Swal.fire({
          icon: "warning",
          title: "Login Required",
          text: "Please login to enter the exam",
          confirmButtonText: "Go to Login",
        }).then(() => {
          navigate("/login");
        });
        return;
      }

      try {
        const response = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/liveExam/registration/${
            passedExamData._id || passedExamData.id
          }`,
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
            html:
              data.message ||
              "Only verified users can access live exams. Please complete your verification first.",
            confirmButtonText: "Go to Verification",
            showCancelButton: true,
            cancelButtonText: "Cancel",
          }).then((result) => {
            if (result.isConfirmed) {
              navigate("/profile");
            } else {
              navigate("/LiveExams");
            }
          });
          return;
        }

        if (!data.success || !data.isRegistered) {
          await Swal.fire({
            icon: "warning",
            title: "Registration Required",
            text: "You must register for this exam before entering. Please register first.",
            confirmButtonText: "Go to Exams",
          }).then(() => {
            navigate("/LiveExams");
          });
          return;
        }
      } catch (error) {
        console.error("Check registration error:", error);
        await Swal.fire({
          icon: "error",
          title: "Error",
          text: "Error checking registration status. Please try again.",
          confirmButtonText: "OK",
        }).then(() => {
          navigate("/live-exams");
        });
        return;
      }
    };

    checkRegistration();
    if (passedExamData) {
      setExamData(passedExamData);

      const savedAnswers = localStorage.getItem(
        `exam_${passedExamData._id}_answers`
      );
      const savedReviewMarked = localStorage.getItem(
        `exam_${passedExamData._id}_reviewMarked`
      );
      const savedVisitedQuestions = localStorage.getItem(
        `exam_${passedExamData._id}_visitedQuestions`
      );
      const savedCurrentSubject = localStorage.getItem(
        `exam_${passedExamData._id}_currentSubject`
      );
      const savedCurrentQuestion = localStorage.getItem(
        `exam_${passedExamData._id}_currentQuestion`
      );
      const savedCommonViolations = localStorage.getItem(
        `exam_${passedExamData._id}_commonViolations`
      );

      if (savedAnswers) {
        setAnswers(JSON.parse(savedAnswers));
      }
      if (savedReviewMarked) {
        setReviewMarked(new Set(JSON.parse(savedReviewMarked)));
      }
      if (savedVisitedQuestions) {
        setVisitedQuestions(new Set(JSON.parse(savedVisitedQuestions)));
      }
      if (savedCurrentSubject) {
        setCurrentSubjectIndex(parseInt(savedCurrentSubject));
      }
      if (savedCurrentQuestion) {
        setCurrentQuestionIndex(parseInt(savedCurrentQuestion));
      }
      if (savedCommonViolations) {
        setCommonViolationCount(parseInt(savedCommonViolations, 10));
      }
    } else {
      navigate("/LiveExams");
    }
  }, [location.state, navigate]);

  const { timeLeft, setTimeLeft } = useExamTimer(
    examStarted,
    examCompleted,
    examData,
    handleAutoSubmit
  );

  const {
    showViolationWarning,
    violationType,
    isExpelled,
    violationCounts,
    handleReturnToExam,
    incrementViolation,
  } = useExamMonitoring(
    examStarted,
    examCompleted,
    enterFullscreen,
    examData?._id
  );

  // Get user info for webcam monitoring
  const userInfo = JSON.parse(localStorage.getItem("userInfo") || "{}");
  const userId = userInfo?.id;

  // Callback for webcam violation reaching 10 seconds - increment common violation counter
  const handleWebcamViolationReached = useCallback((violationType) => {
    console.log(`🎥 Webcam violation reached 10s: ${violationType} - Incrementing common violation counter`);
    setCommonViolationCount((prev) => prev + 1);
  }, []);

  // Webcam monitoring hook
  const {
    videoRef,
    canvasRef,
    cameraActive,
    startCamera,
    stopCamera,
    faceDetected,
    headPosition,
    detectionErrors,
    violationStatus,
    violationLogs,
    cameraError,
    modelsLoaded,
    logKeyboardViolation,
    clearViolationLogs,
  } = useWebcamMonitoring(
    examStarted,
    examCompleted,
    userId,
    verificationImages,
    handleWebcamViolationReached
  );

  // Track previous violationCounts.total to detect increases (web focus violations)
  const prevViolationCountsTotalRef = useRef(0);

  // Reset ref when exam starts
  useEffect(() => {
    if (examStarted && !examCompleted) {
      prevViolationCountsTotalRef.current = violationCounts.total;
    }
  }, [examStarted]);

  // Increment common violation counter when web focus violations occur
  useEffect(() => {
    if (!examStarted || examCompleted) {
      return;
    }

    const currentTotal = violationCounts.total;
    const prevTotal = prevViolationCountsTotalRef.current;

    if (currentTotal > prevTotal) {
      // Web focus violation occurred - increment common counter
      const increment = currentTotal - prevTotal;
      console.log(`🌐 Web focus violation detected - Incrementing common violation counter by ${increment}`);
      setCommonViolationCount((prev) => prev + increment);
      prevViolationCountsTotalRef.current = currentTotal;
    }
  }, [violationCounts.total, examStarted, examCompleted]);

  // Persist common violation count to localStorage
  useEffect(() => {
    if (examData && examStarted && !examCompleted) {
      localStorage.setItem(
        getStorageKey("commonViolations"),
        commonViolationCount.toString()
      );
    }
  }, [commonViolationCount, examData, examStarted, examCompleted]);

  // Ban user and auto-submit if common violation count reaches 5
  useEffect(() => {
    if (
      examStarted &&
      !examCompleted &&
      commonViolationCount >= 5 &&
      examData
    ) {
      console.log(
        `🚫 User banned: Common violation count reached ${commonViolationCount} (limit: 5)`
      );
      
      // Show warning before auto-submitting
      Swal.fire({
        icon: "error",
        title: "You Have Been Banned",
        html: `
          <p style="font-size: 16px; margin-bottom: 10px;">
            <strong>Violation Limit Exceeded</strong>
          </p>
          <p style="font-size: 14px;">
            You have exceeded the maximum violation limit (5 violations).<br/>
            Your exam will be automatically submitted.
          </p>
          <p style="font-size: 12px; color: #666; margin-top: 15px;">
            Total Violations: <strong>${commonViolationCount}</strong>
          </p>
        `,
        confirmButtonText: "OK",
        allowOutsideClick: false,
        allowEscapeKey: false,
        showCancelButton: false,
        confirmButtonColor: "#dc2626",
      }).then(() => {
        // Auto-submit after user acknowledges the warning
        // Note: handleAutoSubmit is stable enough as it checks examCompleted internally
        // eslint-disable-next-line react-hooks/exhaustive-deps
        handleAutoSubmit("expelled", true, "Exceeded maximum violation limit (5 violations)");
      });
    }
  }, [commonViolationCount, examStarted, examCompleted, examData]);

  // Fetch verification images when exam starts
  useEffect(() => {
    const fetchVerificationImages = async () => {
      if (!examStarted || examCompleted) return;

      const token = localStorage.getItem("userToken");
      if (!token) return;

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
          if (data.success && data.data?.verificationImages) {
            console.log(
              "✅ Verification images fetched successfully:",
              Object.keys(data.data.verificationImages).filter(
                (k) => data.data.verificationImages[k]
              )
            );
            console.log(
              "📊 Verification images data:",
              data.data.verificationImages
            );
            setVerificationImages(data.data.verificationImages);
            setWebcamMonitoringEnabled(true);
          } else {
            console.warn("❌ No verification images found for user");
            console.log("Response data:", data);
            setWebcamMonitoringEnabled(false);
          }
        } else {
          console.error(
            "❌ Failed to fetch verification images. Status:",
            response.status
          );
          setWebcamMonitoringEnabled(false);
        }
      } catch (error) {
        console.error("Error fetching verification images:", error);
        setWebcamMonitoringEnabled(false);
      }
    };

    if (examStarted && !examCompleted) {
      fetchVerificationImages();
    }
  }, [examStarted, examCompleted]);

  // Debug: Log verification images when they change
  useEffect(() => {
    if (verificationImages) {
      console.log("📸 verificationImages state updated:", verificationImages);
      const availableAngles = Object.keys(verificationImages).filter(
        (k) => verificationImages[k]
      );
      console.log("📸 Available verification angles:", availableAngles);
    } else {
      console.log("📸 verificationImages is null or undefined");
    }
  }, [verificationImages]);

  // Start camera when exam starts (always, regardless of verification images)
  useEffect(() => {
    if (examStarted && !examCompleted && modelsLoaded) {
      startCamera();
    } else if (examCompleted || !examStarted) {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [
    examStarted,
    examCompleted,
    modelsLoaded,
    startCamera,
    stopCamera,
  ]);

  // Stop camera and clear storage when expelled
  useEffect(() => {
    if (isExpelled) {
      stopCamera();
      clearExamStorage();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isExpelled]);

  // Log webcam violations to backend
  useEffect(() => {
    const logViolationsToBackend = async () => {
      if (violationLogs.length === 0 || !examData || !userId) return;

      const token = localStorage.getItem("userToken");
      if (!token) return;

      try {
        const response = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/liveExam/webcam-violation`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              examId: examData._id,
              userId: userId,
              violations: violationLogs,
            }),
          }
        );

        if (response.ok) {
          console.log("Webcam violations logged successfully");
          clearViolationLogs();
        } else {
          console.error("Failed to log webcam violations");
        }
      } catch (error) {
        console.error("Error logging webcam violations:", error);
      }
    };

    if (violationLogs.length > 0) {
      logViolationsToBackend();
    }
  }, [violationLogs, examData, userId, clearViolationLogs]);

  useEffect(() => {
    if (examData && examStarted && !examCompleted) {
      localStorage.setItem(getStorageKey("answers"), JSON.stringify(answers));
    }
  }, [answers, examData, examStarted, examCompleted]);

  useEffect(() => {
    if (examData && examStarted && !examCompleted) {
      localStorage.setItem(
        getStorageKey("reviewMarked"),
        JSON.stringify([...reviewMarked])
      );
    }
  }, [reviewMarked, examData, examStarted, examCompleted]);

  useEffect(() => {
    if (examData && examStarted && !examCompleted) {
      localStorage.setItem(
        getStorageKey("visitedQuestions"),
        JSON.stringify([...visitedQuestions])
      );
    }
  }, [visitedQuestions, examData, examStarted, examCompleted]);

  useEffect(() => {
    if (examData && examStarted && !examCompleted) {
      localStorage.setItem(
        getStorageKey("currentSubject"),
        currentSubjectIndex.toString()
      );
      localStorage.setItem(
        getStorageKey("currentQuestion"),
        currentQuestionIndex.toString()
      );
    }
  }, [
    currentSubjectIndex,
    currentQuestionIndex,
    examData,
    examStarted,
    examCompleted,
  ]);

  const clearExamStorage = () => {
    if (examData) {
      localStorage.removeItem(getStorageKey("answers"));
      localStorage.removeItem(getStorageKey("reviewMarked"));
      localStorage.removeItem(getStorageKey("visitedQuestions"));
      localStorage.removeItem(getStorageKey("currentSubject"));
      localStorage.removeItem(getStorageKey("currentQuestion"));
      localStorage.removeItem(`exam_${examData._id}_violations`);
      localStorage.removeItem(getStorageKey("commonViolations"));
    }
  };

  const exitFullscreen = async () => {
    try {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        await document.webkitExitFullscreen();
      } else if (document.mozCancelFullScreen) {
        await document.mozCancelFullScreen();
      } else if (document.msExitFullscreen) {
        await document.msExitFullscreen();
      }
    } catch (error) {
      console.error("Exit fullscreen error:", error);
    }
  };

  // ✅ NEW: Calculate exam results
  const calculateExamResults = (examData, answers, reviewMarked) => {
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
        const difficulty = question.difficulty;
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

  // ✅ UPDATED: handleAutoSubmit with calculations and proper structure
  async function handleAutoSubmit(reason, isBanned = false, banReason = null) {
    if (examCompleted) return;

    // Get user data from localStorage
    const userInfo = JSON.parse(localStorage.getItem("userInfo"));
    const userId = userInfo?.id;
    const username = userInfo?.username;
    const email = userInfo?.email;

    // If userId is missing, alert and stop
    if (!userId || !username) {
      await Swal.fire({
        icon: "warning",
        title: "Session Expired",
        text: "User not logged in. Please login again.",
        confirmButtonText: "Go to Login",
      }).then(() => {
        navigate("/login");
      });
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

    const timeConsumed = examData.duration * 60 - timeLeft;
    const startTime = new Date(Date.now() - timeConsumed * 1000);

    const results = calculateExamResults(examData, answers, reviewMarked);

    const submissionData = {
      examId: examData._id,
      userId: userId,
      username: username,
      email: email,

      examSnapshot: {
        title: examData.title,
        examType: examData.examType,
        duration: examData.duration,
        tags: examData.tags || [],
      },

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
        timeAllocated: examData.duration * 60,
        timeConsumed: timeConsumed,
        timeRemaining: timeLeft,
        startedAt: startTime,
        submittedAt: new Date(),
      },

      violations: {
        total: violationCounts.total,
        fullscreenExit: violationCounts.fullscreenExit,
        tabSwitching: violationCounts.tabSwitching,
        escapeKey: violationCounts.escapeKey,
        windowBlur: violationCounts.windowBlur,
      },

      commonViolationCount: commonViolationCount,

      isBanned: isBanned,
      banReason: banReason,

      completionReason: reason,

      metadata: {
        userAgent: navigator.userAgent,
        deviceType: /Mobile|Android|iPhone/i.test(navigator.userAgent)
          ? "mobile"
          : "desktop",
      },
    };

    // ✅ Log what we're sending
    console.log(
      "📤 Sending submission data:",
      JSON.stringify(submissionData, null, 2)
    );

    // Stop webcam BEFORE setting exam as completed to ensure it stops properly
    console.log("📹 Stopping webcam before exam completion...");
    stopCamera();
    
    setExamCompleted(true);

    try {
      setSubmissionLoading(true);
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/liveExam/submit`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(submissionData),
        }
      );

      if (response.ok) {
        const result = await response.json();
        console.log("✅ Success:", result);
        clearExamStorage();
        await exitFullscreen();
        setTimeout(() => {
          navigate("/");
        }, 2000);
      } else {
        const error = await response.json();
        console.error("❌ Backend error:", error);
        await Swal.fire({
          icon: "error",
          title: "Submission Failed",
          text: error.message || "Failed to submit exam. Please try again.",
          confirmButtonText: "OK",
        });
        stopCamera(); // Stop webcam on error
        await exitFullscreen();
      }
    } catch (error) {
      console.error("❌ Network error:", error);
      await Swal.fire({
        icon: "error",
        title: "Network Error",
        text: "Network error. Please try again.",
        confirmButtonText: "OK",
      });
      stopCamera(); // Stop webcam on network error
      await exitFullscreen();
    } finally {
      setSubmissionLoading(false);
    }
  }

  const handleStartExam = async () => {
    setShowStartConfirm(false);
    await enterFullscreen();
    setExamStarted(true);
    markQuestionVisited(0, 0);
  };

  const handleSubmitClick = () => {
    setShowSubmitConfirm(true);
  };

  const handleSubmitConfirm = () => {
    setShowSubmitConfirm(false);
    handleAutoSubmit("manual");
  };

  const handleSubmitCancel = () => {
    setShowSubmitConfirm(false);
  };

  const handleAnswerSelect = (optionIndex) => {
    const questionKey = `${currentSubjectIndex}-${currentQuestionIndex}`;
    setAnswers((prev) => ({ ...prev, [questionKey]: optionIndex }));
  };

  const toggleReviewMark = () => {
    const questionKey = `${currentSubjectIndex}-${currentQuestionIndex}`;
    setReviewMarked((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(questionKey)) newSet.delete(questionKey);
      else newSet.add(questionKey);
      return newSet;
    });
  };

  const markQuestionVisited = (subjectIndex, questionIndex) => {
    const questionKey = `${subjectIndex}-${questionIndex}`;
    setVisitedQuestions((prev) => new Set([...prev, questionKey]));
  };

  const goToQuestion = (subjectIndex, questionIndex) => {
    setCurrentSubjectIndex(subjectIndex);
    setCurrentQuestionIndex(questionIndex);
    markQuestionVisited(subjectIndex, questionIndex);
  };

  const handleQuestionSelect = (subjectIndex, questionIndex) => {
    goToQuestion(subjectIndex, questionIndex);
    setShowMobileSidebar(false);
  };

  const toggleMobileSidebar = () => {
    setShowMobileSidebar(!showMobileSidebar);
  };

  const goToNextQuestion = () => {
    const currentSubject = examData.subjects[currentSubjectIndex];
    if (currentQuestionIndex < currentSubject.questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      markQuestionVisited(currentSubjectIndex, currentQuestionIndex + 1);
    } else if (currentSubjectIndex < examData.subjects.length - 1) {
      setCurrentSubjectIndex((prev) => prev + 1);
      setCurrentQuestionIndex(0);
      markQuestionVisited(currentSubjectIndex + 1, 0);
    }
  };

  const goToPreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
      markQuestionVisited(currentSubjectIndex, currentQuestionIndex - 1);
    } else if (currentSubjectIndex > 0) {
      const prevSubject = examData.subjects[currentSubjectIndex - 1];
      setCurrentSubjectIndex((prev) => prev - 1);
      setCurrentQuestionIndex(prevSubject.questions.length - 1);
      markQuestionVisited(
        currentSubjectIndex - 1,
        prevSubject.questions.length - 1
      );
    }
  };

  const isLastQuestion = () => {
    const lastSubjectIndex = examData.subjects.length - 1;
    const lastQuestionIndex =
      examData.subjects[lastSubjectIndex].questions.length - 1;
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

  if (showStartConfirm) {
    return <StartConfirmation examData={examData} onStart={handleStartExam} />;
  }

  if (isExpelled) {
    return <ExpelledScreen onOk={() => navigate("/")} />;
  }

  if (examCompleted) {
    return <ExamCompletedScreen loading={submissionLoading} />;
  }

  return (
    <div className="fixed inset-0 bg-white">
      <div className="h-screen flex flex-col lg:flex-row overflow-hidden">
        {/* Mobile Sidebar Overlay */}
        {showMobileSidebar && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={toggleMobileSidebar}
          ></div>
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
            goToQuestion={handleQuestionSelect}
          />
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col">
          {/* Mobile Header with Timer (only visible on mobile) */}
          <div className="lg:hidden bg-white border-b shadow-sm">
            <div className="flex items-center justify-between p-3">
              <button
                onClick={toggleMobileSidebar}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0"
                aria-label="Toggle navigation"
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

              {/* Timer - Larger Size to Match Sidebar */}
              <div className="flex flex-col items-center bg-red-600 px-4 py-2 rounded-lg">
                <span className="text-2xl font-mono font-bold text-white">
                  {formatTime(timeLeft)}
                </span>
                <span className="text-xs text-red-100">Time Remaining</span>
              </div>

              <button
                onClick={handleSubmitClick}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors flex-shrink-0"
              >
                Submit
              </button>
            </div>

            {/* Question Info Bar */}
            <div className="px-3 py-2 bg-gray-50 border-t">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 font-medium">
                  Question {currentQuestionIndex + 1} of{" "}
                  {examData.subjects.reduce(
                    (total, subject) => total + subject.questions.length,
                    0
                  )}
                </span>
                <span className="text-gray-500 text-xs">
                  {examData.subjects[currentSubjectIndex].name}
                </span>
              </div>
            </div>
          </div>

          {/* Desktop Header (hidden on mobile) */}
          <div className="hidden lg:block">
            <ExamHeader
              examData={examData}
              currentSubjectIndex={currentSubjectIndex}
              currentQuestionIndex={currentQuestionIndex}
              onSubmit={handleSubmitClick}
              showSubmit={true}
              commonViolationCount={commonViolationCount}
            />
          </div>

          <QuestionDisplay
            question={
              examData.subjects[currentSubjectIndex].questions[
                currentQuestionIndex
              ]
            }
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

          {/* Webcam Monitoring Panel */}
          {examStarted && !examCompleted && (
            <WebcamMonitoringPanel
              videoRef={videoRef}
              canvasRef={canvasRef}
              cameraActive={cameraActive}
              startCamera={startCamera}
              stopCamera={stopCamera}
              faceDetected={faceDetected}
              headPosition={headPosition}
              detectionErrors={detectionErrors}
              violationStatus={violationStatus}
              violationLogs={violationLogs}
              cameraError={cameraError}
              modelsLoaded={modelsLoaded}
              commonViolationCount={commonViolationCount}
            />
          )}
        </div>

        {showViolationWarning && (
          <ViolationWarning
            violationType={violationType}
            onReturn={handleReturnToExam}
            onViolationCounted={() => {
              // Increment both the type-specific and common counters on each restart cycle
              incrementViolation("tabSwitching");
              setCommonViolationCount((prev) => prev + 1);
            }}
          />
        )}

        {showSubmitConfirm && (
          <SubmitConfirmation
            onConfirm={handleSubmitConfirm}
            onCancel={handleSubmitCancel}
          />
        )}
      </div>
    </div>
  );
};

export default LiveExamRoom;

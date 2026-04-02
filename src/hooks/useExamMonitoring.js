import { useState, useEffect } from "react";

const useExamMonitoring = (
  examStarted,
  examCompleted,
  enterFullscreen,
  examId
) => {
  const [showViolationWarning, setShowViolationWarning] = useState(false);
  const [violationType, setViolationType] = useState("");
  const [isExpelled, setIsExpelled] = useState(false);
  const [isMobileDevice, setIsMobileDevice] = useState(false);

  // Initialize violation counts from localStorage if available (exam-specific)
  const [violationCounts, setViolationCounts] = useState(() => {
    if (examId) {
      const saved = localStorage.getItem(`exam_${examId}_violations`);
      if (saved) {
        return JSON.parse(saved);
      }
    }
    return {
      fullscreenExit: 0,
      tabSwitching: 0,
      escapeKey: 0,
      windowBlur: 0,
      total: 0,
    };
  });

  useEffect(() => {
    const mobileRegex =
      /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
    setIsMobileDevice(mobileRegex.test(navigator.userAgent));
  }, []);

  // Save violation counts to localStorage whenever they change (exam-specific)
  useEffect(() => {
    if (examStarted && !examCompleted && examId) {
      localStorage.setItem(
        `exam_${examId}_violations`,
        JSON.stringify(violationCounts)
      );
    }
  }, [violationCounts, examStarted, examCompleted, examId]);

  const incrementViolation = (type) => {
    setViolationCounts((prev) => ({
      ...prev,
      [type]: prev[type] + 1,
      total: prev.total + 1,
    }));
  };

  useEffect(() => {
    if (!examStarted || examCompleted || showViolationWarning) return;

    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement
      );

      if (
        !isCurrentlyFullscreen &&
        examStarted &&
        !examCompleted &&
        !showViolationWarning
      ) {
        incrementViolation("fullscreenExit");
        setViolationType("fullscreen exit");
        setShowViolationWarning(true);
      }
    };

    const handleVisibilityChange = () => {
      if (
        document.hidden &&
        examStarted &&
        !examCompleted &&
        !showViolationWarning
      ) {
        incrementViolation("tabSwitching");
        setViolationType(isMobileDevice ? "app switching" : "tab switching");
        setShowViolationWarning(true);
      }
    };

    const handleBlur = () => {
      if (examStarted && !examCompleted && !showViolationWarning) {
        incrementViolation("windowBlur");
        setViolationType("window focus lost");
        setShowViolationWarning(true);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === "Escape" && !showViolationWarning) {
        e.preventDefault();
        e.stopPropagation();
        incrementViolation("escapeKey");
        setViolationType("escape key pressed");
        setShowViolationWarning(true);
        return false;
      }

      if (
        (e.ctrlKey && (e.key === "w" || e.key === "W")) ||
        (e.ctrlKey && (e.key === "t" || e.key === "T")) ||
        (e.ctrlKey && (e.key === "n" || e.key === "N")) ||
        (e.altKey && e.key === "Tab") ||
        e.key === "F11" ||
        (e.metaKey && (e.key === "w" || e.key === "W")) ||
        (e.metaKey && (e.key === "t" || e.key === "T")) ||
        (e.metaKey && (e.key === "n" || e.key === "N"))
      ) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };

    const handleContextMenu = (e) => {
      e.preventDefault();
      return false;
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("mozfullscreenchange", handleFullscreenChange);
    document.addEventListener("MSFullscreenChange", handleFullscreenChange);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("keydown", handleKeyDown, true);
    document.addEventListener("contextmenu", handleContextMenu);
    window.addEventListener("blur", handleBlur);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener(
        "webkitfullscreenchange",
        handleFullscreenChange
      );
      document.removeEventListener(
        "mozfullscreenchange",
        handleFullscreenChange
      );
      document.removeEventListener(
        "MSFullscreenChange",
        handleFullscreenChange
      );
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("keydown", handleKeyDown, true);
      document.removeEventListener("contextmenu", handleContextMenu);
      window.removeEventListener("blur", handleBlur);
    };
  }, [examStarted, examCompleted, isMobileDevice, showViolationWarning]);

  const handleReturnToExam = async () => {
    setShowViolationWarning(false);
    await enterFullscreen();
  };

  return {
    showViolationWarning,
    violationType,
    isExpelled,
    violationCounts,
    handleReturnToExam,
    incrementViolation,
  };
};

export default useExamMonitoring;

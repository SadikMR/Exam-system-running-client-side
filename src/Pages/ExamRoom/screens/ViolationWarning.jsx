import { useState, useEffect, useRef } from "react";
import { AlertTriangle } from "lucide-react";

const ViolationWarning = ({ violationType, onReturn, onViolationCounted }) => {
  const [countdown, setCountdown] = useState(10);
  const [counted, setCounted] = useState(false);
  const restartTimerRef = useRef(null);

  useEffect(() => {
    // Clear any pending restart
    if (restartTimerRef.current) clearTimeout(restartTimerRef.current);

    setCounted(false);
    setCountdown(10);
  }, [violationType]);

  useEffect(() => {
    if (counted) {
      // Notify parent to increment violation count
      if (onViolationCounted) onViolationCounted();

      // After 2s showing "counted", auto-restart the countdown
      restartTimerRef.current = setTimeout(() => {
        setCounted(false);
        setCountdown(10);
      }, 2000);

      return () => clearTimeout(restartTimerRef.current);
    }

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setCounted(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [counted]);

  const getViolationLabel = (type) => {
    const labels = {
      "fullscreen exit": "Fullscreen Exit",
      "tab switching": "Tab Switching",
      "app switching": "App Switching",
      "window focus lost": "Window Focus Lost",
      "escape key pressed": "Escape Key Pressed",
    };
    return labels[type] || type;
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div
        className={`bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border-4 ${
          counted ? "border-red-500" : "border-yellow-500 animate-pulse"
        }`}
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className={`p-3 rounded-full ${counted ? "bg-red-100" : "bg-yellow-100"}`}>
            <AlertTriangle size={32} className={counted ? "text-red-600" : "text-yellow-600"} />
          </div>
          <div>
            <h3 className={`text-xl font-bold ${counted ? "text-red-600" : "text-yellow-600"}`}>
              {counted ? "✓ VIOLATION COUNTED" : "⏳ VIOLATION WARNING"}
            </h3>
            <p className="text-sm text-gray-600">{getViolationLabel(violationType)}</p>
          </div>
        </div>

        {/* Countdown Timer */}
        <div className="mb-4 p-4 bg-gradient-to-r from-yellow-50 to-red-50 rounded-lg border border-yellow-300">
          {counted ? (
            <div className="text-center">
              <p className="text-3xl font-bold text-red-600 mb-2">✓</p>
              <p className="text-lg font-semibold text-red-700">Violation Counted!</p>
              <p className="text-sm text-red-600 mt-1">Restarting countdown…</p>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Violation will be recorded in:</p>
              <p className="text-4xl font-bold text-red-600 mb-2">{countdown}s</p>
              <p className="text-sm text-gray-700">
                Return to the exam to stop the timer
              </p>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-700 font-semibold mb-2">Instructions:</p>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>✓ Stay in fullscreen mode during the exam</li>
            <li>✓ Do not switch tabs or windows</li>
            <li>✓ Do not press Escape</li>
            {!counted && (
              <li className="text-red-600 font-semibold">
                ⚡ Click "Return to Exam" to stop the countdown!
              </li>
            )}
          </ul>
        </div>

        {/* Return Button */}
        <button
          onClick={onReturn}
          className={`w-full px-8 py-3 rounded-lg font-semibold transition-colors ${
            counted
              ? "bg-blue-600 hover:bg-blue-700 text-white"
              : "bg-yellow-500 hover:bg-yellow-600 text-white"
          }`}
        >
          Return to Exam
        </button>

        <p className="text-center text-xs text-gray-500 mt-3">
          {counted
            ? "Restarting countdown in 2s…"
            : "Click the button above before time runs out!"}
        </p>
      </div>
    </div>
  );
};

export default ViolationWarning;

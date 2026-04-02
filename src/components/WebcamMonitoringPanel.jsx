import React, { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";

const WebcamMonitoringPanel = ({
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
  commonViolationCount = 0,
}) => {
  const [showViolationModal, setShowViolationModal] = useState(false);

  // Start camera when models are loaded
  useEffect(() => {
    if (!cameraActive && modelsLoaded) {
      startCamera();
    }
  }, [modelsLoaded, cameraActive, startCamera]);

  // Handle violation modal - show for violations and warnings
  useEffect(() => {
    if (violationStatus.isViolating || (violationStatus.type && violationStatus.type !== null)) {
      setShowViolationModal(true);
    } else {
      setShowViolationModal(false);
    }
  }, [violationStatus.isViolating, violationStatus.type]);

  const getViolationLabel = (type) => {
    const labels = {
      missing_face: "Missing Face",
      multiple_faces: "Multiple Faces Detected",
      face_mismatch: "Face Not Matching",
      head_position_warning: "Head Position Warning",
      tab_key_pressed: "Tab Key Pressed",
      escape_key_pressed: "Escape Key Pressed",
    };
    return labels[type] || type?.replace(/_/g, " ");
  };

  const isWarning = () => false; // All violations now show countdown timer

  const timeRemainingToCount =
    violationStatus.duration > 0
      ? Math.max(0, 10 - violationStatus.duration)
      : 10;
  const hasViolationCounted = violationStatus.duration >= 10;

  return (
    <>
      {/* Webcam Feed - Small Corner Container */}
      <div className="fixed bottom-4 right-4 w-64 h-48 bg-black rounded-lg overflow-hidden shadow-2xl border-2 border-gray-600 z-40">
        {/* Video */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />
        <canvas ref={canvasRef} className="hidden" />

        {/* Loading State */}
        {!modelsLoaded && (
          <div className="absolute inset-0 bg-black/90 flex items-center justify-center">
            <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        {/* Status Indicator */}
        {modelsLoaded && (
          <div
            className={`absolute top-2 left-2 right-2 px-2 py-1 rounded text-xs font-semibold text-white backdrop-blur-sm ${
              violationStatus.isViolating
                ? hasViolationCounted
                  ? "bg-red-600/90"
                  : "bg-yellow-600/90"
                : violationStatus.type
                ? "bg-yellow-600/90"
                : faceDetected
                ? "bg-green-600/90"
                : "bg-gray-600/90"
            }`}
          >
            {violationStatus.isViolating
              ? hasViolationCounted
                ? `❌ VIOLATION (${timeRemainingToCount}s)`
                : `⏱️ ${timeRemainingToCount}s`
              : violationStatus.type === "head_position_warning"
              ? "⚠️ Head Position"
              : violationStatus.type === "face_mismatch"
              ? "❌ Face Mismatch"
              : violationStatus.type === "multiple_faces"
              ? "❌ Multiple Faces"
              : faceDetected
              ? "✓ Face OK"
              : "❌ No Face"}
          </div>
        )}

        {/* Violation Count Badge */}
        {modelsLoaded && (
          <div
            className={`absolute bottom-2 left-2 px-2 py-1 rounded text-xs font-bold text-white backdrop-blur-sm ${
              commonViolationCount > 0 ? "bg-red-600/90" : "bg-green-600/90"
            }`}
          >
            Violations: {commonViolationCount}
          </div>
        )}

        {/* Detection Errors/Warnings Display */}
        {detectionErrors && detectionErrors.length > 0 && (
          <div className="absolute bottom-12 left-2 right-2 bg-yellow-600/95 backdrop-blur-sm rounded px-2 py-1 text-xs text-white font-semibold border border-yellow-400">
            {detectionErrors[detectionErrors.length - 1]}
          </div>
        )}

        {/* Camera Error Display */}
        {cameraError && (
          <div className="absolute inset-0 bg-red-900/95 flex items-center justify-center">
            <div className="text-center">
              <div className="text-white text-xl mb-1">⚠️</div>
              <span className="text-white text-xs text-center px-2 block">
                {cameraError.substring(0, 20)}...
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Violation Warning Modal */}
      {showViolationModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div
            className={`bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border-4 border-yellow-500 ${
              hasViolationCounted ? "" : "animate-pulse"
            }`}
          >
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-full bg-yellow-100">
                <AlertTriangle size={32} className="text-yellow-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-yellow-600">
                  {hasViolationCounted
                    ? "✓ VIOLATION COUNTED"
                    : "⏳ VIOLATION WARNING"}
                </h3>
                <p className="text-sm text-gray-600">
                  {getViolationLabel(violationStatus.type)}
                </p>
              </div>
            </div>

            {/* Countdown Timer - Shown for all violation types */}
            <div className="mb-4 p-4 bg-gradient-to-r from-yellow-50 to-red-50 rounded-lg border border-yellow-300">
              {hasViolationCounted ? (
                <div className="text-center">
                  <p className="text-3xl font-bold text-red-600 mb-2">10s</p>
                  <p className="text-lg font-semibold text-red-700">
                    ✓ Violation Counted!
                  </p>
                  <p className="text-sm text-red-600 mt-1">
                    This violation has been recorded.
                  </p>
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-1">
                    {violationStatus.type === "head_position_warning"
                      ? "Violation will be recorded if you don't correct in:"
                      : "Violation will be recorded in:"}
                  </p>
                  <p className="text-4xl font-bold text-red-600 mb-2">
                    {timeRemainingToCount}s
                  </p>
                  <p className="text-sm text-gray-700">
                    {violationStatus.type === "head_position_warning"
                      ? "Please face the camera directly"
                      : "Return to normal position to avoid violation"}
                  </p>
                </div>
              )}
            </div>

            {/* Violation Count */}
            <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-center text-gray-800">
                <span className="font-bold text-lg text-blue-600">
                  {commonViolationCount}
                </span>
                <span className="text-gray-600"> Total Violations</span>
              </p>
            </div>

            {/* Instructions */}
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-700 font-semibold mb-2">
                Instructions:
              </p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>✓ Keep your face in front of the camera</li>
                <li>✓ No turning your head away</li>
                <li>✓ Ensure proper lighting</li>
                <li>✓ Don't cover your face</li>
                {!hasViolationCounted && (
                  <li className="text-red-600 font-semibold">
                    ⚡ Fix position quickly to avoid violation!
                  </li>
                )}
              </ul>
            </div>

            {/* Auto Close Info */}
            <p className="text-center text-xs text-gray-500">
              {hasViolationCounted
                ? "This modal will auto-close when violation is no longer detected"
                : "This modal will auto-close if you return to normal position"}
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default WebcamMonitoringPanel;

import React, { useEffect, useState, useRef, useCallback } from "react";
import { AlertTriangle, Minimize2, Maximize2, Move } from "lucide-react";

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
  const [isMinimized, setIsMinimized] = useState(
    () => window.innerWidth < 768 // minimized by default on mobile
  );
  const [position, setPosition] = useState({ x: null, y: null }); // null = use default CSS position
  const isDragging = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const panelRef = useRef(null);

  // Start camera when models are loaded
  useEffect(() => {
    if (!cameraActive && modelsLoaded) {
      startCamera();
    }
  }, [modelsLoaded, cameraActive, startCamera]);

  // Handle violation modal
  useEffect(() => {
    if (violationStatus.isViolating || (violationStatus.type && violationStatus.type !== null)) {
      setShowViolationModal(true);
    } else {
      setShowViolationModal(false);
    }
  }, [violationStatus.isViolating, violationStatus.type]);

  // ── Drag logic (pointer events — works on touch + mouse) ──────────────
  const onPointerDown = useCallback((e) => {
    // Only drag from the drag handle (not the minimize button)
    if (e.target.closest("[data-no-drag]")) return;
    e.preventDefault();
    isDragging.current = true;
    const rect = panelRef.current.getBoundingClientRect();
    dragOffset.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
    panelRef.current.setPointerCapture(e.pointerId);
  }, []);

  const onPointerMove = useCallback((e) => {
    if (!isDragging.current) return;
    const newX = e.clientX - dragOffset.current.x;
    const newY = e.clientY - dragOffset.current.y;
    // Clamp within viewport
    const panelW = panelRef.current.offsetWidth;
    const panelH = panelRef.current.offsetHeight;
    const clampedX = Math.max(0, Math.min(window.innerWidth - panelW, newX));
    const clampedY = Math.max(0, Math.min(window.innerHeight - panelH, newY));
    setPosition({ x: clampedX, y: clampedY });
  }, []);

  const onPointerUp = useCallback(() => {
    isDragging.current = false;
  }, []);

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

  const timeRemainingToCount =
    violationStatus.duration > 0
      ? Math.max(0, 10 - violationStatus.duration)
      : 10;
  const hasViolationCounted = violationStatus.duration >= 10;

  // Panel style: use absolute x/y when dragged, else default fixed bottom-right
  const panelStyle =
    position.x !== null
      ? { position: "fixed", left: position.x, top: position.y, bottom: "auto", right: "auto" }
      : { position: "fixed", bottom: "1rem", right: "1rem" };

  // Status color & text
  const statusColor = violationStatus.isViolating
    ? hasViolationCounted
      ? "bg-red-600/90"
      : "bg-yellow-600/90"
    : violationStatus.type
    ? "bg-yellow-600/90"
    : faceDetected
    ? "bg-green-600/90"
    : "bg-gray-600/90";

  const statusText = violationStatus.isViolating
    ? hasViolationCounted
      ? `❌ VIOLATION (${timeRemainingToCount}s)`
      : `⏱️ ${timeRemainingToCount}s`
    : violationStatus.type === "head_position_warning"
    ? "⚠️ Head"
    : violationStatus.type === "face_mismatch"
    ? "❌ Mismatch"
    : violationStatus.type === "multiple_faces"
    ? "❌ Multi"
    : faceDetected
    ? "✓ OK"
    : "❌ No Face";

  // Alert dot color for minimized state
  const alertDotColor = violationStatus.isViolating
    ? "bg-red-500"
    : violationStatus.type
    ? "bg-yellow-500"
    : faceDetected
    ? "bg-green-500"
    : "bg-gray-400";

  return (
    <>
      {/* ── Webcam Panel ─────────────────────────────────────────────── */}
      <div
        ref={panelRef}
        style={panelStyle}
        className="z-40 select-none touch-none"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        {isMinimized ? (
          /* ── MINIMIZED: small pill badge ─────────────────────────── */
          <div
            className={`flex items-center gap-1.5 px-3 py-2 rounded-full shadow-2xl border-2 border-gray-600 bg-gray-900 cursor-grab active:cursor-grabbing`}
          >
            {/* Alert dot */}
            <span className={`w-2.5 h-2.5 rounded-full ${alertDotColor} ${violationStatus.isViolating ? "animate-pulse" : ""}`} />
            <span className="text-white text-xs font-semibold whitespace-nowrap">{statusText}</span>
            {commonViolationCount > 0 && (
              <span className="bg-red-600 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                {commonViolationCount}
              </span>
            )}
            {/* Expand button */}
            <button
              data-no-drag="true"
              onClick={() => setIsMinimized(false)}
              className="ml-1 text-gray-300 hover:text-white transition"
              title="Expand webcam"
            >
              <Maximize2 size={14} />
            </button>
          </div>
        ) : (
          /* ── EXPANDED: full webcam feed ──────────────────────────── */
          <div className="w-52 sm:w-64 bg-black rounded-lg overflow-hidden shadow-2xl border-2 border-gray-600">
            {/* Drag handle bar */}
            <div className="flex items-center justify-between bg-gray-800 px-2 py-1 cursor-grab active:cursor-grabbing">
              <Move size={12} className="text-gray-400" />
              <span className="text-gray-400 text-xs">Webcam</span>
              <button
                data-no-drag="true"
                onClick={() => setIsMinimized(true)}
                className="text-gray-400 hover:text-white transition"
                title="Minimize"
              >
                <Minimize2 size={14} />
              </button>
            </div>

            {/* Video */}
            <div className="relative h-36 sm:h-48">
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
                  <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                </div>
              )}

              {/* Status Bar */}
              {modelsLoaded && (
                <div className={`absolute top-1 left-1 right-1 px-2 py-0.5 rounded text-xs font-semibold text-white backdrop-blur-sm ${statusColor}`}>
                  {statusText}
                </div>
              )}

              {/* Violation Count Badge */}
              {modelsLoaded && (
                <div className={`absolute bottom-1 left-1 px-2 py-0.5 rounded text-xs font-bold text-white backdrop-blur-sm ${commonViolationCount > 0 ? "bg-red-600/90" : "bg-green-600/90"}`}>
                  V: {commonViolationCount}
                </div>
              )}

              {/* Detection Errors */}
              {detectionErrors && detectionErrors.length > 0 && (
                <div className="absolute bottom-8 left-1 right-1 bg-yellow-600/95 backdrop-blur-sm rounded px-1.5 py-0.5 text-xs text-white font-semibold border border-yellow-400 line-clamp-1">
                  {detectionErrors[detectionErrors.length - 1]}
                </div>
              )}

              {/* Camera Error */}
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
          </div>
        )}
      </div>

      {/* ── Violation Warning Modal ───────────────────────────────────── */}
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
                  {hasViolationCounted ? "✓ VIOLATION COUNTED" : "⏳ VIOLATION WARNING"}
                </h3>
                <p className="text-sm text-gray-600">{getViolationLabel(violationStatus.type)}</p>
              </div>
            </div>

            {/* Countdown Timer */}
            <div className="mb-4 p-4 bg-gradient-to-r from-yellow-50 to-red-50 rounded-lg border border-yellow-300">
              {hasViolationCounted ? (
                <div className="text-center">
                  <p className="text-3xl font-bold text-red-600 mb-2">10s</p>
                  <p className="text-lg font-semibold text-red-700">✓ Violation Counted!</p>
                  <p className="text-sm text-red-600 mt-1">This violation has been recorded.</p>
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-1">
                    {violationStatus.type === "head_position_warning"
                      ? "Violation will be recorded if you don't correct in:"
                      : "Violation will be recorded in:"}
                  </p>
                  <p className="text-4xl font-bold text-red-600 mb-2">{timeRemainingToCount}s</p>
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
                <span className="font-bold text-lg text-blue-600">{commonViolationCount}</span>
                <span className="text-gray-600"> Total Violations</span>
              </p>
            </div>

            {/* Instructions */}
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-700 font-semibold mb-2">Instructions:</p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>✓ Keep your face in front of the camera</li>
                <li>✓ No turning your head away</li>
                <li>✓ Ensure proper lighting</li>
                <li>✓ Don't cover your face</li>
                {!hasViolationCounted && (
                  <li className="text-red-600 font-semibold">⚡ Fix position quickly to avoid violation!</li>
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

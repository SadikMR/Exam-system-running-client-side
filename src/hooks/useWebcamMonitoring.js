import { useState, useEffect, useRef, useCallback } from "react";

const useWebcamMonitoring = (
  examStarted,
  examCompleted,
  userId,
  verificationImages,
  onWebcamViolationReached // NEW: Callback when webcam violation reaches 10 seconds
) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const faceApiLoadedRef = useRef(false);
  const detectionIntervalRef = useRef(null);
  const violationTimersRef = useRef({});

  const [cameraActive, setCameraActive] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [headPosition, setHeadPosition] = useState(null);
  const [detectionErrors, setDetectionErrors] = useState([]);
  const [violationStatus, setViolationStatus] = useState({
    type: null,
    duration: 0,
    isViolating: false,
    hasReachedThreshold: false,
  });
  const [violationLogs, setViolationLogs] = useState([]);
  const [cameraError, setCameraError] = useState(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);

  // Load face-api models
  useEffect(() => {
    const loadFaceApi = async () => {
      try {
        if (faceApiLoadedRef.current) return;

        if (!window.faceapi?.nets?.tinyFaceDetector?.params) {
          const script = document.createElement("script");
          script.src =
            "https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.12/dist/face-api.js";
          script.async = true;

          await new Promise((resolve, reject) => {
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
          });
        }

        const MODEL_URL =
          "https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/";

        await Promise.all([
          window.faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          window.faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          window.faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
          window.faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ]);

        faceApiLoadedRef.current = true;
        setModelsLoaded(true);
      } catch (error) {
        console.error("Error loading face-api:", error);
        setDetectionErrors((prev) => [
          ...prev,
          "Failed to load face detection models",
        ]);
      }
    };

    if (examStarted && !examCompleted) {
      loadFaceApi();
    }
  }, [examStarted, examCompleted]);

  // Start camera
  const startCamera = useCallback(async () => {
    try {
      setCameraError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 320 }, height: { ideal: 240 } },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
      }
    } catch (error) {
      console.error("Camera error:", error);
      setCameraError(error.message || "Failed to access camera");
    }
  }, []);

  // Stop camera
  const stopCamera = useCallback(() => {
    console.log("📹 Stopping camera...");
    if (videoRef.current?.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach((track) => {
        track.stop();
        console.log(`🛑 Stopped track: ${track.kind}`);
      });
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
    console.log("✅ Camera stopped successfully");
  }, []);

  // Detect head position based on facial landmarks
  const detectHeadPosition = (landmarks) => {
    if (!landmarks) return "front";

    const nose = landmarks.getNose();
    const leftEye = landmarks.getLeftEye();
    const rightEye = landmarks.getRightEye();
    const jaw = landmarks.getJawOutline();

    if (!nose || !leftEye || !rightEye || !jaw) return "front";

    // Calculate nose position relative to eyes (for left/right detection)
    const leftEyeCenter = {
      x: leftEye.reduce((sum, p) => sum + p.x, 0) / leftEye.length,
      y: leftEye.reduce((sum, p) => sum + p.y, 0) / leftEye.length,
    };
    const rightEyeCenter = {
      x: rightEye.reduce((sum, p) => sum + p.x, 0) / rightEye.length,
      y: rightEye.reduce((sum, p) => sum + p.y, 0) / rightEye.length,
    };
    const noseCenter = {
      x: nose.reduce((sum, p) => sum + p.x, 0) / nose.length,
      y: nose.reduce((sum, p) => sum + p.y, 0) / nose.length,
    };

    const eyeCenterX = (leftEyeCenter.x + rightEyeCenter.x) / 2;
    const noseOffsetX = noseCenter.x - eyeCenterX;
    const eyeDistance = Math.abs(rightEyeCenter.x - leftEyeCenter.x);

    // Calculate vertical angle (for up detection)
    const jawBottom = jaw[jaw.length - 1];
    const jawTop = jaw[Math.floor(jaw.length / 2)];
    const verticalAngle = Math.atan2(
      jawBottom.y - jawTop.y,
      Math.abs(jawBottom.x - jawTop.x)
    );

    // Thresholds
    const LEFT_THRESHOLD = -0.15; // Negative offset means turned left
    const RIGHT_THRESHOLD = 0.15; // Positive offset means turned right
    const UP_THRESHOLD = -0.3; // Negative angle means looking up

    // Normalize offset by eye distance for better accuracy
    const normalizedOffset = noseOffsetX / eyeDistance;

    // Detect head position
    if (normalizedOffset < LEFT_THRESHOLD) {
      return "left";
    } else if (normalizedOffset > RIGHT_THRESHOLD) {
      return "right";
    } else if (verticalAngle < UP_THRESHOLD) {
      return "up";
    } else {
      return "front";
    }
  };

  // Compare face with verification image using face descriptors
  const compareFaceWithVerification = async (
    detections,
    verificationImageUrl
  ) => {
    if (!verificationImageUrl) {
      console.warn(
        "❌ compareFaceWithVerification: No verification image URL provided"
      );
      return true; // If no verification image, allow (for backward compatibility)
    }

    console.log("🔍 Starting face comparison...");
    console.log("📷 Verification image URL:", verificationImageUrl);

    try {
      const currentDescriptor = detections[0].descriptor;
      if (!currentDescriptor) {
        console.warn("❌ Could not get descriptor from current detection");
        return false;
      }

      console.log(
        "✅ Current face descriptor extracted. Length:",
        currentDescriptor.length
      );
      console.log(
        "📊 Descriptor sample (first 5 values):",
        currentDescriptor.slice(0, 5)
      );

      // Load verification image from Cloudinary URL
      const img = new Image();
      img.crossOrigin = "anonymous";

      console.log("⏳ Loading verification image from URL...");

      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          console.error("❌ Image load timeout after 10 seconds");
          reject(new Error("Image load timeout"));
        }, 10000);

        img.onload = () => {
          clearTimeout(timeout);
          console.log("✅ Verification image loaded successfully");
          resolve();
        };
        img.onerror = () => {
          clearTimeout(timeout);
          console.warn(
            "❌ Failed to load verification image from Cloudinary URL:",
            verificationImageUrl
          );
          reject(new Error("Image load failed"));
        };
        img.src = verificationImageUrl;
      });

      const verificationDetections = await window.faceapi
        .detectAllFaces(img, new window.faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptors();

      console.log(
        "📊 Verification image detection completed. Faces found:",
        verificationDetections.length
      );

      if (verificationDetections.length === 0) {
        console.error("❌ No face detected in verification image");
        return false;
      }

      const verificationDescriptor = verificationDetections[0].descriptor;
      console.log(
        "✅ Verification face descriptor extracted. Length:",
        verificationDescriptor.length
      );
      console.log(
        "📊 Verification descriptor sample (first 5 values):",
        verificationDescriptor.slice(0, 5)
      );

      // Calculate Euclidean distance between face descriptors
      let sumSquaredDiff = 0;
      for (let i = 0; i < currentDescriptor.length; i++) {
        const diff = currentDescriptor[i] - verificationDescriptor[i];
        sumSquaredDiff += diff * diff;
      }
      const distance = Math.sqrt(sumSquaredDiff);

      // Match threshold (lower = stricter)
      // 0.65 = very lenient (accepts family members)
      // 0.5 = strict (only exact match)
      // 0.45 = very strict (perfect match only)
      const MATCH_THRESHOLD = 0.5;
      const isMatch = distance < MATCH_THRESHOLD;

      console.log(
        `🔍 Face match distance: ${distance.toFixed(
          3
        )} (threshold: ${MATCH_THRESHOLD}) - ${
          isMatch ? "✅ MATCH - ALLOWED" : "❌ MISMATCH - REJECTED"
        }`
      );

      return isMatch;
    } catch (error) {
      console.error("Error comparing faces:", error);
      return false;
    }
  };

  // Main detection loop
  useEffect(() => {
    if (
      !examStarted ||
      examCompleted ||
      !cameraActive ||
      !modelsLoaded ||
      !faceApiLoadedRef.current
    ) {
      return;
    }

    const detectFaces = async () => {
      try {
        if (!videoRef.current || !canvasRef.current) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;

        if (video.readyState !== video.HAVE_ENOUGH_DATA) return;

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const detections = await window.faceapi
          .detectAllFaces(video, new window.faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks()
          .withFaceDescriptors();

        // Check for missing face
        if (detections.length === 0) {
          setFaceDetected(false);
          setHeadPosition(null);
          setDetectionErrors((prev) => {
            const newErrors = [
              ...prev,
              "❌ No face detected! Please position your face in front of the camera.",
            ];
            return newErrors.slice(-3); // Keep only last 3 errors
          });
          updateViolationStatus("missing_face");
          return;
        }

        // Check for multiple faces - VIOLATION
        if (detections.length > 1) {
          setFaceDetected(true);
          setHeadPosition(null);
          setDetectionErrors((prev) => {
            const newErrors = [
              ...prev,
              `❌ Multiple faces detected (${detections.length}) - This is a violation!`,
            ];
            return newErrors.slice(-3); // Keep only last 3 errors
          });
          updateViolationStatus("multiple_faces");
          return;
        }

        // Single face detected
        setFaceDetected(true);

        // Detect head position based on facial landmarks
        const landmarks = detections[0].landmarks;
        const detectedHeadPosition = detectHeadPosition(landmarks);
        setHeadPosition(detectedHeadPosition);

        // Check for left/right head position - WARNING
        if (
          detectedHeadPosition === "left" ||
          detectedHeadPosition === "right"
        ) {
          setDetectionErrors((prev) => {
            const newErrors = [
              ...prev,
              `⚠️ Warning: Head turned ${detectedHeadPosition}. Please face the camera directly.`,
            ];
            return newErrors.slice(-3); // Keep only last 3 errors
          });
          updateViolationStatus("head_position_warning");
        }

        // If verification images are not available, skip comparison
        if (
          !verificationImages ||
          Object.keys(verificationImages).length === 0
        ) {
          console.warn("❌ No verification images available for comparison");
          console.log("verificationImages prop:", verificationImages);
          // If head is left/right, still show warning
          if (
            detectedHeadPosition === "left" ||
            detectedHeadPosition === "right"
          ) {
            return; // Already handled above
          }
          setDetectionErrors([]);
          updateViolationStatus(null);
          return;
        }

        // Log when we have verification images
        console.log(
          "✅ Verification images available:",
          Object.keys(verificationImages).filter((k) => verificationImages[k])
        );
        console.log(
          "Current face descriptor available:",
          !!detections[0].descriptor
        );

        // Get the appropriate verification image based on head position
        // For left/right, we still compare with front image for face matching
        let verificationImageKey = detectedHeadPosition;

        // If head is left/right, compare with front image for face verification
        // but still show the head position warning
        if (
          detectedHeadPosition === "left" ||
          detectedHeadPosition === "right"
        ) {
          verificationImageKey = "front"; // Always compare with front for face matching
        }

        // Get the Cloudinary URL for the verification image
        const verificationImageUrl = verificationImages[verificationImageKey];

        // If specific angle image not available, try front as fallback
        const imageUrlToUse = verificationImageUrl || verificationImages.front;

        // Compare with verification image
        const isMatching = imageUrlToUse
          ? await compareFaceWithVerification(detections, imageUrlToUse)
          : true;

        // Face mismatch - VIOLATION
        if (!isMatching && imageUrlToUse) {
          setDetectionErrors((prev) => {
            const newErrors = [
              ...prev,
              `❌ Face mismatch detected! Your face does not match the verification image.`,
            ];
            return newErrors.slice(-3); // Keep only last 3 errors
          });
          updateViolationStatus("face_mismatch");
        } else if (
          detectedHeadPosition === "left" ||
          detectedHeadPosition === "right"
        ) {
          // Head position warning but face matches - keep warning status
          // Already set above, don't clear it
        } else {
          // Everything is good - clear errors and violations
          setDetectionErrors([]);
          updateViolationStatus(null);
        }
      } catch (error) {
        console.error("Detection error:", error);
        setDetectionErrors((prev) => [...prev, error.message]);
      }
    };

    detectionIntervalRef.current = setInterval(detectFaces, 1000);

    return () => {
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
      }
    };
  }, [
    examStarted,
    examCompleted,
    cameraActive,
    modelsLoaded,
    verificationImages,
  ]);

  // Handle violation status updates
  const updateViolationStatus = (violationType) => {
    setViolationStatus((prev) => {
      const isNewViolation =
        violationType !== null && prev.type !== violationType;
      const isViolationEnded = violationType === null && prev.type !== null;
      const isSameViolation =
        violationType === prev.type && violationType !== null;

      if (isViolationEnded) {
        clearViolationTimer(prev.type);
        return {
          type: null,
          duration: 0,
          isViolating: false,
          hasReachedThreshold: false,
        };
      }

      if (isNewViolation) {
        clearViolationTimer(prev.type);
        startViolationTimer(violationType);
        return {
          type: violationType,
          duration: 0,
          isViolating: false,
          hasReachedThreshold: false,
        };
      }

      if (isSameViolation) {
        return prev;
      }

      return prev;
    });
  };

  const startViolationTimer = (violationType) => {
    if (violationTimersRef.current[violationType]) {
      clearInterval(violationTimersRef.current[violationType]);
    }

    // Head position warning is just a warning, not a violation - don't start timer
    if (violationType === "head_position_warning") {
      setViolationStatus((prev) => {
        if (prev.type === violationType) {
          return {
            ...prev,
            duration: 0,
            isViolating: false,
            hasReachedThreshold: false,
          };
        }
        return prev;
      });
      return;
    }

    let elapsed = 0;
    const interval = setInterval(() => {
      elapsed += 1;

      if (elapsed === 3) {
        setViolationStatus((prev) => {
          if (prev.type === violationType) {
            return {
              ...prev,
              duration: elapsed,
              isViolating: true,
              hasReachedThreshold: false,
            };
          }
          return prev;
        });
      } else if (elapsed < 3) {
        setViolationStatus((prev) => {
          if (prev.type === violationType) {
            return {
              ...prev,
              duration: elapsed,
              isViolating: false,
            };
          }
          clearInterval(interval);
          return prev;
        });
      } else if (elapsed > 3 && elapsed < 10) {
        setViolationStatus((prev) => {
          if (prev.type === violationType) {
            return {
              ...prev,
              duration: elapsed,
              isViolating: true,
              hasReachedThreshold: false,
            };
          }
          return prev;
        });
      }

      if (elapsed >= 10) {
        clearInterval(interval);

        setViolationStatus((prev) => {
          if (prev.type === violationType) {
            return {
              ...prev,
              hasReachedThreshold: true,
              duration: elapsed,
            };
          }
          return prev;
        });

        logViolation(violationType, elapsed);

        // 🚨 CALL CALLBACK: Notify parent component that violation reached 10 seconds
        if (onWebcamViolationReached) {
          console.log(`🎥 Webcam violation reached 10s: ${violationType}`);
          onWebcamViolationReached(violationType);
        }

        clearViolationTimer(violationType);

        // 🔄 AUTO-RESTART TIMER: Automatically restart for next violation
        startViolationTimer(violationType);
      }
    }, 1000);

    violationTimersRef.current[violationType] = interval;
  };

  const clearViolationTimer = (violationType) => {
    if (violationTimersRef.current[violationType]) {
      clearInterval(violationTimersRef.current[violationType]);
      delete violationTimersRef.current[violationType];
    }
  };

  const logViolation = (type, duration) => {
    const violation = {
      type,
      timestamp: new Date(),
      duration,
      headPosition: headPosition,
    };
    setViolationLogs((prev) => [...prev, violation]);
  };

  const logKeyboardViolation = (type) => {
    const violation = {
      type,
      timestamp: new Date(),
      duration: 0,
      headPosition: null,
    };
    setViolationLogs((prev) => [...prev, violation]);
  };

  const clearViolationLogs = useCallback(() => {
    setViolationLogs([]);
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      stopCamera();
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
      }
      Object.keys(violationTimersRef.current).forEach((key) => {
        clearInterval(violationTimersRef.current[key]);
      });
    };
  }, [stopCamera]);

  return {
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
  };
};

export default useWebcamMonitoring;

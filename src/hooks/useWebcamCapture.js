import { useState, useRef, useCallback } from "react";

/**
 * Hook to manage webcam stream and image capture
 * Handles camera access, stream management, and multi-angle captures
 * Mobile-optimized with better constraints and error handling
 */
export const useWebcamCapture = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const [cameraAccessGranted, setCameraAccessGranted] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [capturedImages, setCapturedImages] = useState({
    front: null,
    left: null,
    right: null,
  });
  const [currentAngle, setCurrentAngle] = useState(null);
  const [isCapturing, setIsCapturing] = useState(false);

  /**
   * Detect if device is mobile
   */
  const isMobileDevice = useCallback(() => {
    return (
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      ) || window.innerWidth < 768
    );
  }, []);

  /**
   * Request camera permission and start video stream
   * Mobile-optimized with adaptive constraints
   */
  const startCamera = useCallback(async () => {
    try {
      setCameraError(null);
      setIsCapturing(true);

      const isMobile = isMobileDevice();

      // Mobile-optimized constraints
      const constraints = {
        video: {
          facingMode: "user", // Front camera
          width: {
            ideal: isMobile ? 720 : 1280,
            max: isMobile ? 1280 : 1920,
          },
          height: {
            ideal: isMobile ? 1280 : 720,
            max: isMobile ? 1920 : 1080,
          },
          aspectRatio: isMobile ? { ideal: 9 / 16 } : { ideal: 16 / 9 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;

        // Wait for video to be ready
        await new Promise((resolve, reject) => {
          const timeoutId = setTimeout(() => {
            reject(new Error("Video loading timeout"));
          }, 10000);

          videoRef.current.onloadedmetadata = () => {
            clearTimeout(timeoutId);
            videoRef.current
              .play()
              .then(() => {
                setCameraAccessGranted(true);
                setIsCapturing(false);
                resolve();
              })
              .catch((err) => {
                clearTimeout(timeoutId);
                console.error("Error playing video:", err);
                reject(err);
              });
          };
        });
      }
    } catch (error) {
      console.error("Camera access error:", error);

      let errorMessage = "Failed to access camera. Please try again.";

      if (error.name === "NotAllowedError") {
        errorMessage =
          "Camera permission denied. Please allow camera access in your browser settings.";
      } else if (error.name === "NotFoundError") {
        errorMessage = "No camera found on this device.";
      } else if (error.name === "NotReadableError") {
        errorMessage = "Camera is already in use by another application.";
      } else if (error.name === "OverconstrainedError") {
        errorMessage = "Camera doesn't support the required settings.";
      } else if (error.message === "Video loading timeout") {
        errorMessage =
          "Camera is taking too long to load. Please refresh and try again.";
      }

      setCameraError(errorMessage);
      setIsCapturing(false);
      setCameraAccessGranted(false);
    }
  }, [isMobileDevice]);

  /**
   * Stop camera stream and clean up resources
   */
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
      });
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setCameraAccessGranted(false);
    setIsCapturing(false);
  }, []);

  /**
   * Capture image from video stream with compression
   * @param {string} angle - The angle being captured (front, left, right)
   * @returns {Promise} Resolves with captured image data
   */
  const captureImage = useCallback(
    async (angle) => {
      return new Promise((resolve, reject) => {
        if (!videoRef.current || !canvasRef.current) {
          reject(new Error("Camera not initialized"));
          return;
        }

        if (!cameraAccessGranted) {
          reject(new Error("Camera access not granted"));
          return;
        }

        try {
          const video = videoRef.current;
          const canvas = canvasRef.current;
          const context = canvas.getContext("2d");

          // Set canvas dimensions to match video
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;

          if (canvas.width === 0 || canvas.height === 0) {
            reject(new Error("Video dimensions not ready"));
            return;
          }

          // Draw current video frame to canvas
          context.drawImage(video, 0, 0, canvas.width, canvas.height);

          // Convert canvas to blob with compression
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error("Failed to create image blob"));
                return;
              }

              const imageData = {
                blob,
                url: URL.createObjectURL(blob),
                angle,
                timestamp: new Date().toISOString(),
                size: blob.size,
              };

              setCapturedImages((prev) => ({
                ...prev,
                [angle]: imageData,
              }));

              resolve(imageData);
            },
            "image/webp",
            0.85 // 85% quality for good compression with quality balance
          );
        } catch (error) {
          console.error("Image capture error:", error);
          reject(error);
        }
      });
    },
    [cameraAccessGranted]
  );

  /**
   * Capture image with face detection validation
   * Used by WebcamCaptureModal with face-api.js
   * @param {string} angle - The angle being captured
   * @returns {Promise} Resolves with captured image data
   */
  const captureWithFaceDetection = useCallback(
    async (angle) => {
      if (!window.faceapi) {
        console.warn("face-api not loaded, capturing without detection");
        return captureImage(angle);
      }

      try {
        // Detect faces before capturing
        const detections = await window.faceapi
          .detectAllFaces(
            videoRef.current,
            new window.faceapi.TinyFaceDetectorOptions({
              inputSize: 416, // Increased for better detection
              scoreThreshold: 0.3, // Lower threshold for better detection
            })
          )
          .withFaceLandmarks();

        if (detections.length === 0) {
          throw new Error(
            "No face detected. Please position your face in the frame."
          );
        }

        if (detections.length > 1) {
          console.warn("Multiple faces detected, using first detection");
        }

        // Capture the image
        return await captureImage(angle);
      } catch (error) {
        console.error("Face detection capture error:", error);
        throw error;
      }
    },
    [captureImage]
  );

  /**
   * Capture all three angles sequentially
   * @returns {Promise} Resolves when all images are captured
   */
  const captureAllAngles = useCallback(async () => {
    const angles = ["front", "left", "right"];
    const results = {};

    for (const angle of angles) {
      try {
        setCurrentAngle(angle);
        // Wait a bit between captures for better results
        await new Promise((resolve) => setTimeout(resolve, 500));
        const imageData = await captureImage(angle);
        results[angle] = imageData;
      } catch (error) {
        console.error(`Error capturing ${angle} angle:`, error);
        setCameraError(`Failed to capture ${angle} angle. Please try again.`);
        throw error;
      }
    }

    return results;
  }, [captureImage]);

  /**
   * Clear a specific captured image and revoke URL
   */
  const clearCapturedImage = useCallback((angle) => {
    setCapturedImages((prev) => {
      // Revoke object URL to free memory
      if (prev[angle]?.url) {
        URL.revokeObjectURL(prev[angle].url);
      }

      return {
        ...prev,
        [angle]: null,
      };
    });
  }, []);

  /**
   * Clear all captured images and revoke all URLs
   */
  const clearAllImages = useCallback(() => {
    setCapturedImages((prev) => {
      // Revoke all object URLs
      Object.values(prev).forEach((imageData) => {
        if (imageData?.url) {
          URL.revokeObjectURL(imageData.url);
        }
      });

      return {
        front: null,
        left: null,
        right: null,
      };
    });
  }, []);

  /**
   * Get formatted captured images for sending to server
   * @returns {FormData} FormData object with images
   */
  const getFormattedImages = useCallback(() => {
    const formData = new FormData();

    Object.entries(capturedImages).forEach(([angle, imageData]) => {
      if (imageData?.blob) {
        const file = new File([imageData.blob], `${angle}-${Date.now()}.webp`, {
          type: "image/webp",
        });
        formData.append(angle, file);
      }
    });

    return formData;
  }, [capturedImages]);

  /**
   * Get images as blobs object
   * @returns {Object} Images organized by angle as blobs
   */
  const getImageBlobs = useCallback(() => {
    const blobs = {};
    Object.entries(capturedImages).forEach(([angle, imageData]) => {
      if (imageData?.blob) {
        blobs[angle] = imageData.blob;
      }
    });
    return blobs;
  }, [capturedImages]);

  /**
   * Check if all angles are captured
   */
  const areAllAnglesCaptured = useCallback(() => {
    return Object.values(capturedImages).every((img) => img !== null);
  }, [capturedImages]);

  /**
   * Get capture progress
   * @returns {Object} Progress information
   */
  const getCaptureProgress = useCallback(() => {
    const total = 3;
    const captured = Object.values(capturedImages).filter(
      (img) => img !== null
    ).length;

    return {
      total,
      captured,
      percentage: (captured / total) * 100,
      isComplete: captured === total,
    };
  }, [capturedImages]);

  /**
   * Retry camera access
   */
  const retryCamera = useCallback(async () => {
    stopCamera();
    await new Promise((resolve) => setTimeout(resolve, 500));
    await startCamera();
  }, [startCamera, stopCamera]);

  return {
    // Refs
    videoRef,
    canvasRef,

    // State
    cameraAccessGranted,
    cameraError,
    capturedImages,
    currentAngle,
    isCapturing,

    // Camera control
    startCamera,
    stopCamera,
    retryCamera,

    // Capture methods
    captureImage,
    captureWithFaceDetection,
    captureAllAngles,

    // Image management
    clearCapturedImage,
    clearAllImages,
    getFormattedImages,
    getImageBlobs,

    // Utilities
    areAllAnglesCaptured,
    getCaptureProgress,
    setCurrentAngle,
    setCameraError,
    isMobileDevice,
  };
};

export default useWebcamCapture;

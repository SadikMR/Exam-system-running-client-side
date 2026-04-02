import { useState } from "react";
import Swal from "sweetalert2";
import WebcamCaptureModal from "./WebcamCaptureModal";
import {
  submitVerificationImagesWithRetry,
  getImageStatistics,
  isUserVerified,
} from "../services/imageStorageService";

/**
 * Example component showing how to use WebcamCaptureModal
 * This demonstrates:
 * - Opening the modal
 * - Handling captured images
 * - Submitting images to server
 * - Marking user as verified
 */
const WebcamCaptureExample = ({ onSuccess }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [capturedImages, setCapturedImages] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState(null);
  const [userVerified, setUserVerified] = useState(isUserVerified());

  /**
   * Handle completion of webcam capture
   */
  const handleWebcamComplete = async (images) => {
    // Close modal
    setIsModalOpen(false);

    // Store images
    setCapturedImages(images);

    // Get image statistics
    const stats = getImageStatistics(images);

    // Show success message
    Swal.fire({
      icon: "success",
      title: "Capture Complete",
      text: "Your face images have been captured. Click 'Submit' to verify your identity.",
      confirmButtonColor: "#10B981",
    });
  };

  /**
   * Submit captured images to server and mark user as verified
   */
  const handleSubmitImages = async () => {
    if (!capturedImages) {
      Swal.fire({
        icon: "error",
        title: "No Images",
        text: "Please capture images first",
        confirmButtonColor: "#EF4444",
      });
      return;
    }

    setIsSubmitting(true);
    setSubmissionStatus("uploading");

    try {
      const result = await submitVerificationImagesWithRetry(
        capturedImages,
        3 // Max retries
      );

      if (result.success && result.verified) {
        setSubmissionStatus("success");
        setUserVerified(true);

        Swal.fire({
          icon: "success",
          title: "Verification Successful",
          text: "Your identity has been verified! You can now proceed with exams.",
          confirmButtonColor: "#10B981",
        });

        // Callback after successful verification
        if (onSuccess) {
          onSuccess(result.data);
        }

        // Reset
        setCapturedImages(null);
      } else {
        setSubmissionStatus("failed");
        Swal.fire({
          icon: "error",
          title: "Verification Failed",
          text:
            result.error || "Failed to verify your identity. Please try again.",
          confirmButtonColor: "#EF4444",
        });
      }
    } catch (error) {
      setSubmissionStatus("failed");
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "An error occurred while verifying your identity.",
        confirmButtonColor: "#EF4444",
      });
      console.error("Submission error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Retake images
   */
  const handleRetake = () => {
    setCapturedImages(null);
    setSubmissionStatus(null);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-4">
      {/* Modal */}
      <WebcamCaptureModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onComplete={handleWebcamComplete}
      />

      {/* Verification Status Banner */}
      {userVerified && (
        <div className="alert alert-success">
          <div>
            <h3 className="font-bold">✓ Identity Verified</h3>
            <p className="text-sm">
              Your face has been successfully verified. You can now access exams
              and monitoring features.
            </p>
          </div>
        </div>
      )}

      {/* Before Capture */}
      {!capturedImages && !userVerified && (
        <div className="card bg-base-100 shadow-md">
          <div className="card-body">
            <h2 className="card-title">Identity Verification</h2>
            <p className="text-gray-600">
              We need to capture your face from different angles for exam
              monitoring and identity verification. This is a one-time
              verification process.
            </p>

            <div className="alert alert-info mt-4">
              <div>
                <p className="font-semibold">How it works:</p>
                <ul className="list-disc list-inside mt-2 text-sm">
                  <li>Click the button to start the camera</li>
                  <li>Face detection will guide you to correct positions</li>
                  <li>
                    Images will be captured automatically (left, right, up,
                    down)
                  </li>
                  <li>Your images will be stored securely on the server</li>
                  <li>Takes about 30-45 seconds</li>
                </ul>
              </div>
            </div>

            <div className="card-actions justify-end mt-4">
              <button
                onClick={() => setIsModalOpen(true)}
                className="btn btn-primary text-white gap-2"
              >
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
                    d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                Start Face Verification
              </button>
            </div>
          </div>
        </div>
      )}

      {/* After Capture - Preview */}
      {capturedImages && !userVerified && (
        <div className="card bg-base-100 shadow-md">
          <div className="card-body">
            <h2 className="card-title">Captured Face Images</h2>
            <p className="text-sm text-gray-600">
              Review your captured images before submitting for verification.
            </p>

            {/* Image Preview Grid */}
            <div className="grid grid-cols-4 gap-3 my-4">
              {Object.entries(capturedImages).map(([angle, imageData]) => (
                <div key={angle} className="text-center">
                  <img
                    src={imageData.url}
                    alt={angle}
                    className="w-full h-24 object-cover rounded-lg border-2 border-green-500"
                  />
                  <p className="text-xs font-medium mt-1 capitalize text-gray-700">
                    {angle}
                  </p>
                  <p className="text-xs text-gray-500">
                    {(imageData.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              ))}
            </div>

            {/* Capture Details */}
            <details className="my-2 border rounded-lg p-3">
              <summary className="cursor-pointer font-semibold">
                Capture Details
              </summary>
              <div className="bg-gray-50 p-3 mt-2 rounded text-sm space-y-1">
                {Object.entries(capturedImages).map(([angle, imageData]) => (
                  <div key={angle} className="flex justify-between">
                    <span className="capitalize font-medium">{angle}:</span>
                    <span className="text-gray-600">
                      {new Date(imageData.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            </details>

            {/* Status Messages */}
            {submissionStatus === "success" && (
              <div className="alert alert-success mt-4">
                <svg
                  className="stroke-current shrink-0 h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div>
                  <p className="font-semibold">Verification Successful!</p>
                  <p className="text-sm">
                    Your identity has been verified and stored securely.
                  </p>
                </div>
              </div>
            )}

            {submissionStatus === "failed" && (
              <div className="alert alert-error mt-4">
                <svg
                  className="stroke-current shrink-0 h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 14l-2-2m0 0l-2-2m2 2l2-2m-2 2l-2 2"
                  />
                </svg>
                <div>
                  <p className="font-semibold">Verification Failed</p>
                  <p className="text-sm">
                    Please check your connection and try again.
                  </p>
                </div>
              </div>
            )}

            {submissionStatus === "uploading" && (
              <div className="alert alert-info mt-4">
                <svg
                  className="animate-spin h-5 w-5"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <div>
                  <p className="font-semibold">Uploading...</p>
                  <p className="text-sm">
                    Securely uploading your verification images.
                  </p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="card-actions justify-between mt-4">
              <button
                onClick={handleRetake}
                disabled={isSubmitting}
                className="btn btn-outline"
              >
                Retake Images
              </button>
              <button
                onClick={handleSubmitImages}
                disabled={isSubmitting || submissionStatus === "success"}
                className="btn btn-primary text-white"
              >
                {isSubmitting ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    Verifying...
                  </>
                ) : submissionStatus === "success" ? (
                  "Verified"
                ) : (
                  "Submit for Verification"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WebcamCaptureExample;

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Eye,
  EyeOff,
  Camera,
} from "lucide-react";
import Swal from "sweetalert2";
import useProfile from "../hooks/useProfile";
import ProfileDisplay from "../components/ProfileDisplay";
import PasswordVerificationModal from "../components/PasswordVerificationModal";
import WebcamCaptureModal from "../components/WebcamCaptureModal";
import {
  submitVerificationImagesWithRetry,
  isUserVerified,
} from "../services/imageStorageService";

const Profile = () => {
  const {
    profile,
    verificationStatus,
    loading,
    error,
    refetchVerificationStatus,
  } = useProfile();

  const [showVerification, setShowVerification] = useState(false);
  const [showVerificationDetails, setShowVerificationDetails] = useState(false);
  const [isWebcamModalOpen, setIsWebcamModalOpen] = useState(false);
  const [isSubmittingImages, setIsSubmittingImages] = useState(false);

  // Password gate states
  const [passwordVerified, setPasswordVerified] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  // Determine initial verification state
  useEffect(() => {
    if (verificationStatus) {
      const isVerified =
        verificationStatus.status === "verified" ||
        verificationStatus.isVerified === true;
      setShowVerification(!isVerified);
      // Reset password gate when verification status changes
      setPasswordVerified(false);
    }
  }, [verificationStatus]);

  const handleVerificationComplete = async () => {
    try {
      await refetchVerificationStatus();
      setShowVerification(false);
      setPasswordVerified(false);
    } catch (err) {
      console.error("Error refreshing verification status:", err);
    }
  };

  const getVerificationInfo = () => {
    const status = verificationStatus?.status || verificationStatus?.isVerified;

    if (status === "verified" || status === true) {
      return {
        icon: CheckCircle,
        title: "Verified",
        description: "Your identity has been verified successfully",
        color: "text-green-600",
        bgColor: "bg-green-50",
        borderColor: "border-green-500",
      };
    } else if (status === "pending") {
      return {
        icon: Clock,
        title: "Verification Pending",
        description:
          "Your verification is being reviewed. Please check back later.",
        color: "text-yellow-600",
        bgColor: "bg-yellow-50",
        borderColor: "border-yellow-500",
      };
    } else {
      return {
        icon: AlertCircle,
        title: "Not Verified",
        description: "Please complete verification to access exam features",
        color: "text-red-600",
        bgColor: "bg-red-50",
        borderColor: "border-red-500",
      };
    }
  };

  const verificationInfo = getVerificationInfo();
  const VerificationIcon = verificationInfo.icon;

  // Handle "Verify Now" button - navigate to photo verification
  const handleVerifyNow = () => {
    // First verify password, then show webcam modal
    setShowPasswordModal(true);
  };

  // Password verified successfully: open webcam modal
  const handlePasswordVerified = () => {
    setPasswordVerified(true);
    setShowPasswordModal(false);
    setIsWebcamModalOpen(true);
  };

  // Modal cancelled/closed: keep verification locked
  const handlePasswordModalClose = () => {
    setShowPasswordModal(false);
    // Do NOT set passwordVerified=true on cancel
  };

  // Handle webcam capture completion
  const handleWebcamCapture = async (images) => {
    setIsWebcamModalOpen(false);
    setIsSubmittingImages(true);

    try {
      const result = await submitVerificationImagesWithRetry(images, 3);

      if (result.success && result.verified) {
        Swal.fire({
          icon: "success",
          title: "Verification Successful!",
          text: "Your identity has been verified. You can now access all exam features.",
          confirmButtonColor: "#10B981",
        });

        // Refresh verification status
        await refetchVerificationStatus();
        setPasswordVerified(false);
      } else {
        Swal.fire({
          icon: "error",
          title: "Verification Failed",
          text:
            result.error || "Failed to verify your identity. Please try again.",
          confirmButtonColor: "#EF4444",
        });
      }
    } catch (error) {
      console.error("Verification error:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "An error occurred during verification.",
        confirmButtonColor: "#EF4444",
      });
    } finally {
      setIsSubmittingImages(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-8 space-y-4">
            <div className="skeleton h-12 w-48"></div>
            <div className="skeleton h-40 w-full"></div>
            <div className="skeleton h-40 w-full"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-background py-8 px-4 md:px-6">
        <div className="max-w-6xl mx-auto">
          {/* Page Title */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-2">
              My Profile
            </h1>
            <p className="text-muted-foreground text-lg">
              Manage your account and verification status
            </p>
          </motion.div>

          {/* Verification Status Alert */}
          {verificationStatus && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`border-l-4 ${verificationInfo.borderColor} ${verificationInfo.bgColor} rounded-lg p-4 md:p-6 mb-8 shadow-md`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 flex-1">
                  <VerificationIcon
                    className={`w-6 h-6 ${verificationInfo.color} flex-shrink-0 mt-1`}
                  />
                  <div className="flex-1">
                    <h2
                      className={`text-xl font-bold ${verificationInfo.color} mb-2`}
                    >
                      {verificationInfo.title}
                    </h2>
                    <p
                      className={`${verificationInfo.color
                        .replace("text-", "text-")
                        .replace("-600", "-700")}`}
                    >
                      {verificationInfo.description}
                    </p>
                    {verificationStatus?.status === "pending" &&
                      verificationStatus?.submittedAt && (
                        <p className="text-sm text-gray-600 mt-2">
                          Submitted on:{" "}
                          {new Date(
                            verificationStatus.submittedAt
                          ).toLocaleDateString()}
                        </p>
                      )}
                    {(verificationStatus?.status === "verified" ||
                      verificationStatus?.isVerified) &&
                      verificationStatus?.verifiedAt && (
                        <p className="text-sm text-gray-600 mt-2">
                          Verified on:{" "}
                          {new Date(
                            verificationStatus.verifiedAt
                          ).toLocaleDateString()}
                        </p>
                      )}
                  </div>
                </div>

                {/* Verify Now Button - Show when not verified */}
                {verificationStatus?.status !== "verified" &&
                  !verificationStatus?.isVerified && (
                    <button
                      onClick={handleVerifyNow}
                      disabled={isSubmittingImages}
                      className={`inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-white transition-all duration-300 transform hover:scale-105 hover:shadow-lg flex-shrink-0 ${
                        isSubmittingImages
                          ? "opacity-50 cursor-not-allowed"
                          : verificationInfo.color === "text-red-600"
                          ? "bg-accent hover:bg-accent/90"
                          : "bg-amber-500 hover:bg-amber-600"
                      }`}
                    >
                      {isSubmittingImages ? (
                        <>
                          <span className="loading loading-spinner loading-sm"></span>
                          Verifying...
                        </>
                      ) : (
                        <>
                          <Camera className="w-5 h-5" />
                          Verify Now
                        </>
                      )}
                    </button>
                  )}
              </div>
            </motion.div>
          )}

          {/* Profile and Verification Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Profile Section */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="lg:col-span-2"
            >
              <ProfileDisplay verificationStatus={verificationStatus} />
            </motion.div>

            {/* Sidebar - Verification */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              {/* Verification Status Card */}
              <div className="bg-card rounded-xl shadow-lg p-6 border-t-4 border-accent">
                <h3 className="text-xl font-bold text-foreground mb-4">
                  Verification Status
                </h3>

                <div className="space-y-3">
                  {/* Status Badge */}
                  <div>
                    <p className="text-sm text-gray-600 font-semibold mb-2">
                      Current Status
                    </p>
                    <div className="flex items-center gap-2">
                      <VerificationIcon
                        className={`w-5 h-5 ${verificationInfo.color}`}
                      />
                      <span className={`font-bold ${verificationInfo.color}`}>
                        {verificationInfo.title}
                      </span>
                    </div>
                  </div>

                  {/* Details */}
                  {verificationStatus?.details && (
                    <div className="pt-3 border-t">
                      <p className="text-sm text-gray-600 font-semibold mb-2">
                        Details
                      </p>
                      <p className="text-sm text-gray-700">
                        {verificationStatus.details}
                      </p>
                    </div>
                  )}

                  {/* Info Box */}
                  <div className="pt-3 border-t">
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {verificationStatus?.status === "verified" ||
                      verificationStatus?.isVerified ? (
                        <span className="text-green-700">
                          ✓ Your identity has been verified. You can now
                          participate in all exams and monitoring features.
                        </span>
                      ) : verificationStatus?.status === "pending" ? (
                        <span className="text-yellow-700">
                          ⏳ Your verification is being reviewed. This usually
                          takes 24-48 hours.
                        </span>
                      ) : (
                        <span className="text-red-700">
                          Complete the verification process to access exams.
                          Click "Verify Now" above to get started.
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Security Tips */}
              <div className="bg-muted rounded-xl shadow-lg p-6 border border-border">
                <h3 className="text-lg font-bold text-foreground mb-4">
                  Security Tips
                </h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex gap-2">
                    <span>✓</span>
                    <span>Keep your email secure</span>
                  </li>
                  <li className="flex gap-2">
                    <span>✓</span>
                    <span>Update profile regularly</span>
                  </li>
                  <li className="flex gap-2">
                    <span>✓</span>
                    <span>Complete verification for exams</span>
                  </li>
                  <li className="flex gap-2">
                    <span>✓</span>
                    <span>Clear photos for verification</span>
                  </li>
                </ul>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Password Verification Modal */}
      <PasswordVerificationModal
        isOpen={showPasswordModal}
        onVerified={handlePasswordVerified}
        onClose={handlePasswordModalClose}
      />

      {/* Webcam Capture Modal */}
      <WebcamCaptureModal
        isOpen={isWebcamModalOpen}
        onClose={() => {
          setIsWebcamModalOpen(false);
          setPasswordVerified(false);
        }}
        onComplete={handleWebcamCapture}
      />
    </>
  );
};

export default Profile;

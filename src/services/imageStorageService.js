/**
 * Image Storage and Submission Service
 * Handles storing and uploading captured verification images to server
 * Images are stored server-side and user is marked as verified
 */

const API_BASE_URL =
  (import.meta.env.VITE_BACKEND_URL || "http://localhost:5000") + "/api";

// ==================== TOKEN HELPERS ====================

/**
 * Get authentication token from storage
 * @returns {string|null} Authentication token
 */
const getAuthToken = () => {
  return (
    localStorage.getItem("userToken") ||
    localStorage.getItem("authToken") ||
    localStorage.getItem("token") ||
    sessionStorage.getItem("userToken")
  );
};

// ==================== SERVER SUBMISSION ====================

/**
 * Submit captured images to the server and mark user as verified
 * @param {Object} images - Captured images (front, left, right)
 * @returns {Promise} Result with success status and verification data
 */
export const submitVerificationImages = async (images) => {
  try {
    const formData = new FormData();

    // Get authentication token
    const token = getAuthToken();

    if (!token) {
      throw new Error("No authentication token found. Please login again.");
    }

    // Add images with proper field names (front, left, right)
    const angles = ["front", "left", "right"];
    let imageCount = 0;

    angles.forEach((angle) => {
      const imageData = images[angle];
      if (imageData?.blob) {
        const file = new File([imageData.blob], `${angle}-${Date.now()}.webp`, {
          type: "image/webp",
        });
        formData.append(angle, file);
        imageCount++;
      }
    });

    // Validate all images are present
    if (imageCount !== 3) {
      throw new Error(
        `Missing images. Expected 3 images, got ${imageCount}. Please capture all angles.`
      );
    }

    // Submit to backend
    const response = await fetch(`${API_BASE_URL}/profile/verify`, {
      method: "POST",
      body: formData,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));

      // Handle authentication errors
      if (response.status === 401) {
        localStorage.removeItem("userToken");
        localStorage.removeItem("authToken");
        localStorage.removeItem("token");
        throw new Error("Session expired. Please login again.");
      }

      throw new Error(errorData.message || `Server error: ${response.status}`);
    }

    const result = await response.json();

    // Mark user as verified in local state
    if (result.success && result.data?.isVerified) {
      localStorage.setItem("isVerified", "true");
      localStorage.setItem("verificationTime", new Date().toISOString());
      localStorage.setItem(
        "verificationStatus",
        result.data.verificationStatus
      );
    }

    return {
      success: true,
      data: result.data,
      verified: result.data?.isVerified || false,
      message: result.message || "Verification submitted successfully",
    };
  } catch (error) {
    console.error("Error submitting images:", error);

    return {
      success: false,
      error: error.message,
      verified: false,
    };
  }
};

/**
 * Submit images with retry logic and user verification
 * @param {Object} images - Captured images
 * @param {number} maxRetries - Maximum retry attempts (default: 3)
 */
export const submitVerificationImagesWithRetry = async (
  images,
  maxRetries = 3
) => {
  let lastError = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await submitVerificationImages(images);

      if (result.success && result.verified) {
        return result;
      }

      // Don't retry on authentication errors
      if (
        result.error?.includes("authentication") ||
        result.error?.includes("login")
      ) {
        return result;
      }

      lastError = result;

      // If last attempt, return error
      if (attempt === maxRetries) {
        return result;
      }

      // Wait before retry with exponential backoff (1s, 2s, 4s)
      const delay = Math.pow(2, attempt - 1) * 1000;
      await new Promise((resolve) => setTimeout(resolve, delay));
    } catch (error) {
      lastError = {
        success: false,
        error: error.message,
        verified: false,
      };

      if (attempt === maxRetries) {
        return lastError;
      }
    }
  }

  return (
    lastError || {
      success: false,
      error: "Failed after all retry attempts",
      verified: false,
    }
  );
};

// ==================== HELPER FUNCTIONS ====================

/**
 * Get image statistics
 * @param {Object} images - Captured images
 */
export const getImageStatistics = (images) => {
  const stats = {
    totalSize: 0,
    imageCount: 0,
    captureTimeRange: null,
    angles: {},
  };

  let minTime = null;
  let maxTime = null;

  Object.entries(images).forEach(([angle, imageData]) => {
    if (imageData?.blob) {
      stats.imageCount++;
      stats.totalSize += imageData.size;
      stats.angles[angle] = {
        size: imageData.size,
        timestamp: imageData.timestamp,
      };

      // Track time range
      const time = new Date(imageData.timestamp).getTime();
      if (!minTime || time < minTime) minTime = time;
      if (!maxTime || time > maxTime) maxTime = time;
    }
  });

  if (minTime && maxTime) {
    stats.captureTimeRange = {
      start: new Date(minTime).toISOString(),
      end: new Date(maxTime).toISOString(),
      durationSeconds: (maxTime - minTime) / 1000,
    };
  }

  return stats;
};

/**
 * Check if user is verified
 */
export const isUserVerified = () => {
  return localStorage.getItem("isVerified") === "true";
};

/**
 * Get verification status
 */
export const getVerificationStatus = () => {
  return localStorage.getItem("verificationStatus") || "unverified";
};

/**
 * Get verification timestamp
 */
export const getVerificationTime = () => {
  return localStorage.getItem("verificationTime");
};

/**
 * Clear verification status (for re-verification)
 */
export const clearVerificationStatus = () => {
  localStorage.removeItem("isVerified");
  localStorage.removeItem("verificationTime");
  localStorage.removeItem("verificationStatus");
};

export default {
  submitVerificationImages,
  submitVerificationImagesWithRetry,
  getImageStatistics,
  isUserVerified,
  getVerificationStatus,
  getVerificationTime,
  clearVerificationStatus,
};

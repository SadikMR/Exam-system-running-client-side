const express = require("express");
const multer = require("multer");
const router = express.Router();
const { authenticateToken } = require("../middleware/auth"); // Adjust path as needed
const { uploadToCloudinary } = require("../utils/cloudinary"); // We'll create this
const User = require("../models/User"); // Adjust path as needed

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max per file
  },
  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"), false);
    }
  },
});

/**
 * POST /api/profile/verify
 * Upload verification images to Cloudinary and save URLs to user model
 */
router.post(
  "/verify",
  authenticateToken,
  upload.fields([
    { name: "front", maxCount: 1 },
    { name: "left", maxCount: 1 },
    { name: "right", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const userId = req.user.id || req.user._id; // Adjust based on your auth middleware
      const { email } = req.body;

      // Validate all 3 images are present
      if (!req.files?.front || !req.files?.left || !req.files?.right) {
        return res.status(400).json({
          success: false,
          message: "All 3 verification images are required (front, left, right)",
        });
      }

      // Upload images to Cloudinary
      const uploadPromises = [
        uploadToCloudinary(req.files.front[0].buffer, `verification/${userId}/front`),
        uploadToCloudinary(req.files.left[0].buffer, `verification/${userId}/left`),
        uploadToCloudinary(req.files.right[0].buffer, `verification/${userId}/right`),
      ];

      const [frontUrl, leftUrl, rightUrl] = await Promise.all(uploadPromises);

      // Prepare verification images object
      const verificationImages = {
        front: frontUrl,
        left: leftUrl,
        right: rightUrl,
      };

      // Update user model with verification images and status
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        {
          verificationImages,
          verificationStatus: "pending", // or "submitted"
          verificationSubmittedAt: new Date(),
          email: email || undefined, // Update email if provided
        },
        { new: true, runValidators: true }
      );

      if (!updatedUser) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      res.json({
        success: true,
        message: "Verification images uploaded successfully",
        data: {
          verificationImages,
          verificationStatus: updatedUser.verificationStatus,
          submittedAt: updatedUser.verificationSubmittedAt,
        },
      });
    } catch (error) {
      console.error("Error uploading verification images:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to upload verification images",
      });
    }
  }
);

module.exports = router;


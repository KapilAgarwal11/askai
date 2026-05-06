const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { sendOTPEmail } = require("../utils/sendEmail");

const router = express.Router();

// POST /api/password/forgot — send reset OTP
router.post("/forgot", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email required" });

  try {
    const user = await User.findOne({ email });
    // Always return success to prevent email enumeration
    if (!user || !user.password) {
      return res.json({ message: "If this email exists, a reset code has been sent." });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    // Store OTP in user doc temporarily (expires 10 min)
    user.resetOtp = otp;
    user.resetOtpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    await sendOTPEmail(email, otp, "password reset");
    res.json({ message: "If this email exists, a reset code has been sent." });
  } catch (err) {
    res.status(500).json({ error: "Failed to send reset email" });
  }
});

// POST /api/password/reset — verify OTP + set new password
router.post("/reset", async (req, res) => {
  const { email, otp, newPassword } = req.body;
  if (!email || !otp || !newPassword) {
    return res.status(400).json({ error: "All fields required" });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters" });
  }

  try {
    const user = await User.findOne({ email });
    if (!user || user.resetOtp !== otp || new Date() > user.resetOtpExpiry) {
      return res.status(400).json({ error: "Invalid or expired reset code" });
    }

    user.password = newPassword;
    user.resetOtp = undefined;
    user.resetOtpExpiry = undefined;
    await user.save();

    res.json({ message: "Password reset successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to reset password" });
  }
});

module.exports = router;

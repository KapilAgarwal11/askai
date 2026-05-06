const express = require("express");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/User");
const OTP = require("../models/OTP");
const { sendOTPEmail } = require("../utils/sendEmail");

const router = express.Router();

function generateToken(user) {
  return jwt.sign(
    { id: user._id, name: user.name, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

function generateOTP() {
  return crypto.randomInt(100000, 999999).toString();
}

// ─── Email/Password Register ───────────────────────────────────────────────

// Step 1: Send OTP
router.post("/send-otp", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email required" });

  try {
    const otp = generateOTP();
    await OTP.deleteMany({ email }); // clear old OTPs
    await OTP.create({ email, otp });
    await sendOTPEmail(email, otp);
    res.json({ message: "OTP sent" });
  } catch (err) {
    console.error("OTP send error:", err.message);
    res.status(500).json({ error: "Failed to send OTP", details: err.message });
  }
});

// Step 2: Verify OTP + complete registration
router.post("/register", async (req, res) => {
  const { name, email, password, otp } = req.body;

  if (!name || !email || !password || !otp) {
    return res.status(400).json({ error: "All fields required" });
  }

  try {
    const otpRecord = await OTP.findOne({ email, otp });
    if (!otpRecord) {
      return res.status(400).json({ error: "Invalid or expired OTP" });
    }

    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ error: "Email already registered" });

    const user = await User.create({ name, email, password });
    await OTP.deleteMany({ email });

    const token = generateToken(user);
    res.status(201).json({ token, user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    console.error("Register error:", err.message);
    res.status(500).json({ error: "Registration failed", details: err.message });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "Email and password required" });

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: "Invalid email or password" });

    // Google-only user — no password set
    if (!user.password) {
      return res.status(401).json({ 
        error: "This account was created with Google. Please login with Google, or set a password first.",
        isGoogleUser: true
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ error: "Invalid email or password" });

    const token = generateToken(user);
    res.json({ token, user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    res.status(500).json({ error: "Login failed", details: err.message });
  }
});

// ─── Google OAuth ──────────────────────────────────────────────────────────

router.post("/google", async (req, res) => {
  const { userInfo } = req.body;
  if (!userInfo || !userInfo.email) return res.status(400).json({ error: "Google user info required" });

  try {
    const { name, email, picture, sub: googleId } = userInfo;

    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({ name, email, googleId, avatar: picture });
    } else if (!user.googleId) {
      user.googleId = googleId;
      user.avatar = picture;
      await user.save();
    }

    const token = generateToken(user);
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, avatar: user.avatar } });
  } catch (err) {
    console.error("Google auth error:", err.message);
    res.status(500).json({ error: "Google authentication failed", details: err.message });
  }
});

// ─── Set password for Google users ────────────────────────────────────────

router.post("/set-password", require("../middleware/authMiddleware"), async (req, res) => {
  const { password } = req.body;
  if (!password || password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters" });
  }

  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    user.password = password;
    await user.save();
    res.json({ message: "Password set successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to set password" });
  }
});

router.get("/me", require("../middleware/authMiddleware"), (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;

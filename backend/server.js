require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const rateLimit = require("express-rate-limit");
const Groq = require("groq-sdk");

const authRoutes = require("./routes/auth");
const chatRoutes = require("./routes/chat");
const historyRoutes = require("./routes/history");
const passwordRoutes = require("./routes/password");

const app = express();
const PORT = process.env.PORT || 3001;

// MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB error:", err.message));

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Rate limiters
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 100,
  message: { error: "Too many requests, please try again later." },
});

const chatLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 min
  max: 20,
  message: { error: "Too many messages, slow down a bit." },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: "Too many auth attempts, try again later." },
});

app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json({ limit: "10mb" }));
app.use(generalLimiter);

app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/chat", chatLimiter, chatRoutes(groq));
app.use("/api/history", historyRoutes);
app.use("/api/password", passwordRoutes);

app.get("/health", (req, res) => res.json({ status: "ok" }));

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});

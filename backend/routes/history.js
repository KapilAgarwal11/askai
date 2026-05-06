const express = require("express");
const Chat = require("../models/Chat");
const auth = require("../middleware/authMiddleware");

const router = express.Router();

// GET /api/history — get all chats for user
router.get("/", auth, async (req, res) => {
  try {
    const chats = await Chat.find({ userId: req.user.id })
      .select("title model createdAt updatedAt")
      .sort({ updatedAt: -1 });
    res.json({ chats });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch chats" });
  }
});

// GET /api/history/:id — get single chat with messages
router.get("/:id", auth, async (req, res) => {
  try {
    const chat = await Chat.findOne({ _id: req.params.id, userId: req.user.id });
    if (!chat) return res.status(404).json({ error: "Chat not found" });
    res.json({ chat });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch chat" });
  }
});

// POST /api/history — create new chat
router.post("/", auth, async (req, res) => {
  try {
    const chat = await Chat.create({ userId: req.user.id, title: "New Chat" });
    res.status(201).json({ chat });
  } catch (err) {
    res.status(500).json({ error: "Failed to create chat" });
  }
});

// PATCH /api/history/:id — update title or messages
router.patch("/:id", auth, async (req, res) => {
  try {
    const { title, messages, model } = req.body;
    const update = {};
    if (title) update.title = title;
    if (messages) update.messages = messages;
    if (model) update.model = model;

    const chat = await Chat.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      update,
      { new: true }
    );
    if (!chat) return res.status(404).json({ error: "Chat not found" });
    res.json({ chat });
  } catch (err) {
    res.status(500).json({ error: "Failed to update chat" });
  }
});

// DELETE /api/history/:id
router.delete("/:id", auth, async (req, res) => {
  try {
    await Chat.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    res.json({ message: "Chat deleted" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete chat" });
  }
});

module.exports = router;

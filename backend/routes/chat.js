const express = require("express");
const multer = require("multer");
const auth = require("../middleware/authMiddleware");
const Chat = require("../models/Chat");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

async function parsePDF(buffer) {
  const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(buffer) });
  const pdf = await loadingTask.promise;
  let text = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    text += content.items.map((item) => item.str).join(" ") + "\n";
  }
  return text.slice(0, 8000);
}

const GROQ_MODELS = [
  { id: "llama-3.3-70b-versatile", name: "Llama 3.3 70B", description: "Best quality" },
  { id: "llama-3.1-8b-instant", name: "Llama 3.1 8B", description: "Fastest" },
  { id: "llama3-70b-8192", name: "Llama 3 70B", description: "Balanced" },
  { id: "llama3-8b-8192", name: "Llama 3 8B", description: "Fast & light" },
  { id: "mixtral-8x7b-32768", name: "Mixtral 8x7B", description: "Long context" },
  { id: "gemma2-9b-it", name: "Gemma 2 9B", description: "Google model" },
  { id: "gemma-7b-it", name: "Gemma 7B", description: "Compact" },
  { id: "llama-3.2-90b-vision-preview", name: "Llama 3.2 90B Vision", description: "Vision capable" },
  { id: "llama-3.2-11b-vision-preview", name: "Llama 3.2 11B Vision", description: "Vision fast" },
];

const DEFAULT_MODEL = "llama-3.3-70b-versatile";

router.get("/models", (req, res) => {
  res.json({ models: GROQ_MODELS });
});

module.exports = function chatRoutes(groq) {

  // POST /api/chat — stream AI response + save to DB
  router.post("/", auth, async (req, res) => {
    const { messages, model, chatId } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "messages array required" });
    }

    const selectedModel = GROQ_MODELS.find((m) => m.id === model) ? model : DEFAULT_MODEL;

    // Clean messages — only role & content allowed by Groq
    const cleanMessages = messages.map(({ role, content }) => ({ role, content }));

    try {
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      const stream = await groq.chat.completions.create({
        model: selectedModel,
        messages: [
          {
            role: "system",
            content: "You are AskAI, a helpful AI assistant. You can help with coding, writing, analysis, and general questions. When writing code, always use proper formatting with code blocks.",
          },
          ...cleanMessages,
        ],
        stream: true,
      });

      let accumulated = "";
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || "";
        if (content) {
          accumulated += content;
          res.write(`data: ${JSON.stringify({ content })}\n\n`);
        }
      }

      // Save messages to DB if chatId provided and user is authenticated
      if (chatId && req.user?.id) {
        const lastUserMsg = messages[messages.length - 1];
        await Chat.findOneAndUpdate(
          { _id: chatId, userId: req.user.id },
          {
            $push: {
              messages: {
                $each: [
                  { role: lastUserMsg.role, content: lastUserMsg.content },
                  { role: "assistant", content: accumulated },
                ],
              },
            },
            model: selectedModel,
          }
        );
      }

      res.write("data: [DONE]\n\n");
      res.end();
    } catch (error) {
      console.error("Groq error:", error.message);
      res.status(500).json({ error: "AI request failed", details: error.message });
    }
  });

  // POST /api/chat/title — auto generate title from first message
  router.post("/title", auth, async (req, res) => {
    const { message, chatId } = req.body;
    if (!message || !chatId) return res.status(400).json({ error: "message and chatId required" });

    try {
      const completion = await groq.chat.completions.create({
        model: "llama-3.1-8b-instant",
        messages: [
          {
            role: "user",
            content: `Generate a short title (max 5 words, no quotes) for a chat that starts with: "${message}"`,
          },
        ],
        max_tokens: 20,
      });

      const title = completion.choices[0]?.message?.content?.trim() || "New Chat";
      await Chat.findOneAndUpdate(
        { _id: chatId, userId: req.user.id },
        { title }
      );
      res.json({ title });
    } catch (err) {
      res.status(500).json({ error: "Failed to generate title" });
    }
  });

  // POST /api/chat/upload — parse PDF/text file
  router.post("/upload", auth, upload.single("file"), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    try {
      let text = "";
      const mime = req.file.mimetype;

      if (mime === "application/pdf") {
        text = await parsePDF(req.file.buffer);
      } else if (mime.startsWith("text/")) {
        text = req.file.buffer.toString("utf-8").slice(0, 8000);
      } else {
        return res.status(400).json({ error: "Only PDF and text files supported" });
      }

      res.json({ text, filename: req.file.originalname });
    } catch (err) {
      res.status(500).json({ error: "Failed to parse file", details: err.message });
    }
  });

  return router;
};

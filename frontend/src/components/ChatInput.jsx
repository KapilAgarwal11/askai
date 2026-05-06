import { useState, useRef, useEffect } from "react";

const MODELS = [
  { id: "llama-3.3-70b-versatile", name: "Llama 3.3 70B", tag: "Best" },
  { id: "llama-3.1-8b-instant", name: "Llama 3.1 8B", tag: "Fast" },
  { id: "llama3-70b-8192", name: "Llama 3 70B", tag: "" },
  { id: "llama3-8b-8192", name: "Llama 3 8B", tag: "" },
  { id: "mixtral-8x7b-32768", name: "Mixtral 8x7B", tag: "Long ctx" },
  { id: "gemma2-9b-it", name: "Gemma 2 9B", tag: "Google" },
  { id: "gemma-7b-it", name: "Gemma 7B", tag: "" },
  { id: "llama-3.2-90b-vision-preview", name: "Llama 3.2 90B Vision", tag: "Vision" },
  { id: "llama-3.2-11b-vision-preview", name: "Llama 3.2 11B Vision", tag: "Vision" },
];

export default function ChatInput({ onSend, disabled }) {
  const [text, setText] = useState("");
  const [selectedModel, setSelectedModel] = useState(MODELS[0].id);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [attachedFile, setAttachedFile] = useState(null); // { name, size, file }
  const [uploading, setUploading] = useState(false);
  const textareaRef = useRef(null);
  const dropdownRef = useRef(null);
  const fileRef = useRef(null);

  const currentModel = MODELS.find((m) => m.id === selectedModel) || MODELS[0];

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 200) + "px";
  }, [text]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }
  async function submit() {
    if ((!text.trim() && !attachedFile) || disabled) return;

    if (attachedFile) {
      // Upload file first, then send with parsed content as context
      setUploading(true);
      try {
        const token = localStorage.getItem("ai-chat-token");
        const formData = new FormData();
        formData.append("file", attachedFile.file);
        const res = await fetch("http://localhost:3001/api/chat/upload", {
          method: "POST",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: formData,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        const userText = text.trim()
          ? `${text}\n\n[Attached: ${attachedFile.name}]\n\`\`\`\n${data.text}\n\`\`\``
          : `Analyze this file "${attachedFile.name}":\n\`\`\`\n${data.text}\n\`\`\``;

        onSend(userText, selectedModel, attachedFile.name);
        setText("");
        setAttachedFile(null);
      } catch (err) {
        alert("File upload failed: " + err.message);
      } finally {
        setUploading(false);
      }
    } else {
      onSend(text, selectedModel);
      setText("");
    }
  }

  function handleFileSelect(e) {
    const file = e.target.files[0];
    if (!file) return;
    setAttachedFile({ name: file.name, size: file.size, file });
    e.target.value = "";
  }

  return (
    <div style={{ padding: "12px 24px 20px", background: "#0d0d0d", borderTop: "1px solid #1a1a1a" }}>
      <div style={{ maxWidth: 860, margin: "0 auto" }}>
        {/* Model selector */}
        <div ref={dropdownRef} style={{ position: "relative", marginBottom: 8, display: "inline-block" }}>
          <button
            onClick={() => setDropdownOpen((o) => !o)}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              background: "#141414", border: "1px solid #2a2a2a",
              borderRadius: 8, padding: "5px 10px", cursor: "pointer",
              color: "#aaa", fontSize: 12,
            }}
          >
            <span style={{ color: "#8b5cf6" }}>✦</span>
            <span>{currentModel.name}</span>
            {currentModel.tag && (
              <span style={{
                background: "#1e1e2e", color: "#818cf8", fontSize: 10,
                padding: "1px 6px", borderRadius: 4,
              }}>{currentModel.tag}</span>
            )}
            <span style={{ fontSize: 10, color: "#555" }}>{dropdownOpen ? "▲" : "▼"}</span>
          </button>

          {dropdownOpen && (
            <div style={{
              position: "absolute", bottom: "calc(100% + 6px)", left: 0,
              background: "#141414", border: "1px solid #2a2a2a",
              borderRadius: 10, overflow: "hidden", zIndex: 100,
              minWidth: 240, boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
            }}>
              <div style={{ padding: "8px 12px 6px", borderBottom: "1px solid #1e1e1e" }}>
                <span style={{ fontSize: 11, color: "#555", fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>
                  Select Model
                </span>
              </div>
              {MODELS.map((m) => (
                <button
                  key={m.id}
                  onClick={() => { setSelectedModel(m.id); setDropdownOpen(false); }}
                  style={{
                    width: "100%", padding: "9px 14px",
                    background: selectedModel === m.id ? "#1e1e2e" : "transparent",
                    border: "none", cursor: "pointer", textAlign: "left",
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    borderBottom: "1px solid #1a1a1a",
                  }}
                  onMouseEnter={(e) => { if (selectedModel !== m.id) e.currentTarget.style.background = "#1a1a1a"; }}
                  onMouseLeave={(e) => { if (selectedModel !== m.id) e.currentTarget.style.background = "transparent"; }}
                >
                  <span style={{ fontSize: 13, color: selectedModel === m.id ? "#e8e8e8" : "#aaa" }}>
                    {m.name}
                  </span>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    {m.tag && (
                      <span style={{
                        background: "#1e1e2e", color: "#818cf8",
                        fontSize: 10, padding: "1px 6px", borderRadius: 4,
                      }}>{m.tag}</span>
                    )}
                    {selectedModel === m.id && (
                      <span style={{ color: "#8b5cf6", fontSize: 14 }}>✓</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* File card preview */}
        {attachedFile && (
          <div style={{
            display: "flex", alignItems: "center", gap: 8, padding: "8px 12px",
            background: "#1a1a2e", border: "1px solid #2d2d4e", borderRadius: 8,
            marginBottom: 6,
          }}>
            <span style={{ fontSize: 18 }}>📄</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: 13, color: "#e8e8e8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {attachedFile.name}
              </p>
              <p style={{ margin: 0, fontSize: 11, color: "#555" }}>
                {(attachedFile.size / 1024).toFixed(1)} KB
              </p>
            </div>
            <button onClick={() => setAttachedFile(null)} style={{
              background: "none", border: "none", color: "#555", cursor: "pointer", fontSize: 16,
            }}>✕</button>
          </div>
        )}

        {/* Input box */}
        <div style={{
          background: "#141414", border: "1px solid #2a2a2a", borderRadius: 12,
          display: "flex", alignItems: "flex-end", gap: 8, padding: "10px 14px",
        }}>
          {/* File upload */}
          <input ref={fileRef} type="file" accept=".pdf,.txt,.md,.js,.py,.ts,.jsx,.tsx,.json,.csv"
            onChange={handleFileSelect} style={{ display: "none" }} />
          <button onClick={() => fileRef.current?.click()} disabled={disabled || uploading}
            title="Attach file (PDF, text, code)"
            style={{
              background: "none", border: "none", color: uploading ? "#6366f1" : "#555",
              cursor: "pointer", fontSize: 18, padding: "2px 4px", flexShrink: 0,
              transition: "color 0.2s",
            }}>
            {uploading ? "⏳" : "📎"}
          </button>
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Message ${currentModel.name}... (Shift+Enter for new line)`}
            disabled={disabled}
            rows={1}
            style={{
              flex: 1, background: "none", border: "none", outline: "none",
              color: "#e8e8e8", fontSize: 15, resize: "none", lineHeight: 1.6,
              maxHeight: 200, overflowY: "auto", fontFamily: "inherit",
            }}
          />
          <button
            onClick={submit}
            disabled={disabled || uploading || (!text.trim() && !attachedFile)}
            style={{
              width: 34, height: 34, borderRadius: 8, flexShrink: 0,
              background: disabled || uploading || (!text.trim() && !attachedFile)
                ? "#1e1e1e"
                : "linear-gradient(135deg, #6366f1, #8b5cf6)",
              border: "none", cursor: disabled || uploading || (!text.trim() && !attachedFile) ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: disabled || uploading || (!text.trim() && !attachedFile) ? "#444" : "#fff",
              fontSize: 16, transition: "all 0.2s",
            }}
            aria-label="Send message"
          >
            {uploading ? "⏳" : "↑"}
          </button>
        </div>
        <p style={{ textAlign: "center", fontSize: 11, color: "#2a2a2a", marginTop: 8 }}>
          AI can make mistakes. Verify important information.
        </p>
      </div>
    </div>
  );
}

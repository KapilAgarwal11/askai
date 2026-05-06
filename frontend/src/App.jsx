import { useState, useRef, useEffect, useCallback } from "react";
import ChatMessage from "./components/ChatMessage.jsx";
import ChatInput from "./components/ChatInput.jsx";
import Sidebar from "./components/Sidebar.jsx";
import AuthScreen from "./components/AuthScreen.jsx";
import SetPasswordModal from "./components/SetPasswordModal.jsx";

const API = import.meta.env.VITE_API_URL || "http://localhost:3001/api";
const USER_KEY = "ai-chat-user";

function getStorageKey(user) {
  const uid = user?.id || user?.email || "guest";
  return `ai-chat-sessions-${uid}`;
}

function createLocalSession() {
  return { id: `local-${Date.now()}`, title: "New Chat", messages: [], isLocal: true };
}

export default function App() {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem(USER_KEY)); } catch { return null; }
  });
  const [sessions, setSessions] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [showSetPassword, setShowSetPassword] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const activeSession = sessions.find((s) => s.id === activeId);
  const token = localStorage.getItem("ai-chat-token");

  // Load chats on login
  useEffect(() => {
    if (!user) return;
    if (user.isGuest) {
      // Guest: use localStorage
      const saved = JSON.parse(localStorage.getItem(getStorageKey(user)) || "null");
      const initial = saved?.length ? saved : [createLocalSession()];
      setSessions(initial);
      setActiveId(initial[0].id);
    } else {
      loadChatsFromDB();
    }
  }, [user]);

  // Save guest sessions to localStorage
  useEffect(() => {
    if (user?.isGuest && sessions.length > 0) {
      localStorage.setItem(getStorageKey(user), JSON.stringify(sessions));
    }
  }, [sessions, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeSession?.messages]);

  async function loadChatsFromDB() {
    setLoading(true);
    try {
      const res = await fetch(`${API}/history`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error();
      if (data.chats.length === 0) {
        // Create first chat
        const newChat = await createChatInDB();
        setSessions([newChat]);
        setActiveId(newChat.id);
      } else {
        const mapped = data.chats.map((c) => ({
          id: c._id, title: c.title, messages: [], model: c.model,
          updatedAt: c.updatedAt, isLocal: false,
        }));
        setSessions(mapped);
        setActiveId(mapped[0].id);
        // Load first chat messages
        loadChatMessages(mapped[0].id);
      }
    } catch {
      const fallback = [createLocalSession()];
      setSessions(fallback);
      setActiveId(fallback[0].id);
    } finally {
      setLoading(false);
    }
  }

  async function loadChatMessages(chatId) {
    if (!token || chatId?.startsWith("local-")) return;
    try {
      const res = await fetch(`${API}/history/${chatId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) return;
      setSessions((prev) =>
        prev.map((s) => s.id === chatId ? { ...s, messages: data.chat.messages } : s)
      );
    } catch {}
  }

  async function createChatInDB() {
    const res = await fetch(`${API}/history`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    });
    const data = await res.json();
    return { id: data.chat._id, title: "New Chat", messages: [], isLocal: false };
  }

  function handleAuth(userData) {
    localStorage.setItem(USER_KEY, JSON.stringify(userData));
    setUser(userData);
  }

  function handleLogout() {
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem("ai-chat-token");
    setUser(null);
    setSessions([]);
    setActiveId(null);
  }

  async function newChat() {
    if (user?.isGuest) {
      const s = createLocalSession();
      setSessions((prev) => [s, ...prev]);
      setActiveId(s.id);
    } else {
      try {
        const chat = await createChatInDB();
        setSessions((prev) => [chat, ...prev]);
        setActiveId(chat.id);
      } catch {
        const s = createLocalSession();
        setSessions((prev) => [s, ...prev]);
        setActiveId(s.id);
      }
    }
  }

  async function deleteSession(id) {
    if (!id.startsWith("local-") && token) {
      await fetch(`${API}/history/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }
    setSessions((prev) => {
      const filtered = prev.filter((s) => s.id !== id);
      if (filtered.length === 0) {
        const fresh = createLocalSession();
        setActiveId(fresh.id);
        return [fresh];
      }
      if (id === activeId) {
        setActiveId(filtered[0].id);
        if (!filtered[0].id.startsWith("local-")) loadChatMessages(filtered[0].id);
      }
      return filtered;
    });
  }

  function handleSelectChat(id) {
    setActiveId(id);
    const session = sessions.find((s) => s.id === id);
    if (session && session.messages.length === 0 && !session.id.startsWith("local-")) {
      loadChatMessages(id);
    }
  }

  async function sendMessage(text, model) {
    if (!text.trim() || isStreaming) return;

    const userMsg = { role: "user", content: text };
    const currentMessages = activeSession?.messages || [];
    const isFirstMessage = currentMessages.length === 0;

    setSessions((prev) =>
      prev.map((s) => {
        if (s.id !== activeId) return s;
        return {
          ...s,
          title: isFirstMessage ? text.slice(0, 40) : s.title,
          messages: [...s.messages, userMsg, { role: "assistant", content: "" }],
        };
      })
    );

    setIsStreaming(true);

    try {
      const response = await fetch(`${API}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          messages: [...currentMessages, userMsg],
          model,
          chatId: activeId?.startsWith("local-") ? undefined : activeId,
        }),
      });

      if (!response.ok) throw new Error("Server error");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const lines = decoder.decode(value).split("\n");
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") break;
            try {
              accumulated += JSON.parse(data).content;
              setSessions((prev) =>
                prev.map((s) => {
                  if (s.id !== activeId) return s;
                  const msgs = [...s.messages];
                  msgs[msgs.length - 1] = { role: "assistant", content: accumulated };
                  return { ...s, messages: msgs };
                })
              );
            } catch {}
          }
        }
      }

      // Auto-generate title for first message
      if (isFirstMessage && !activeId?.startsWith("local-") && token) {
        fetch(`${API}/chat/title`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ message: text, chatId: activeId }),
        })
          .then((r) => r.json())
          .then((data) => {
            if (data.title) {
              setSessions((prev) =>
                prev.map((s) => s.id === activeId ? { ...s, title: data.title } : s)
              );
            }
          })
          .catch(() => {});
      }
    } catch (err) {
      setSessions((prev) =>
        prev.map((s) => {
          if (s.id !== activeId) return s;
          const msgs = [...s.messages];
          msgs[msgs.length - 1] = { role: "assistant", content: `Error: ${err.message}` };
          return { ...s, messages: msgs };
        })
      );
    } finally {
      setIsStreaming(false);
    }
  }

  async function regenerate() {
    if (!activeSession || isStreaming) return;
    const msgs = activeSession.messages;
    // Remove last AI message, resend last user message
    const lastUserIdx = [...msgs].reverse().findIndex((m) => m.role === "user");
    if (lastUserIdx === -1) return;
    const userMsg = msgs[msgs.length - 1 - lastUserIdx];
    const trimmed = msgs.slice(0, msgs.length - 1 - lastUserIdx);

    setSessions((prev) =>
      prev.map((s) => s.id === activeId ? { ...s, messages: trimmed } : s)
    );
    await sendMessage(userMsg.content, activeSession.model || "llama-3.3-70b-versatile");
  }

  if (!user) return <AuthScreen onAuth={handleAuth} />;

  return (
    <div style={{ display: "flex", height: "100vh", position: "relative" }}>
      {showSetPassword && (
        <SetPasswordModal
          onClose={() => setShowSetPassword(false)}
          onSuccess={() => setShowSetPassword(false)}
        />
      )}

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
            zIndex: 40, display: "none",
          }}
          className="mobile-overlay"
        />
      )}

      <Sidebar
        sessions={sessions}
        activeId={activeId}
        onSelect={(id) => { handleSelectChat(id); setSidebarOpen(false); }}
        onNew={() => { newChat(); setSidebarOpen(false); }}
        onDelete={deleteSession}
        user={user}
        onLogout={handleLogout}
        sidebarOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Header */}
        <div style={{
          padding: "12px 16px", borderBottom: "1px solid #1a1a1a",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          background: "#0d0d0d", flexShrink: 0, minWidth: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0, flex: 1 }}>
            {/* Mobile menu button */}
            <button
              onClick={() => setSidebarOpen(true)}
              style={{
                background: "none", border: "none", color: "#666",
                cursor: "pointer", fontSize: 20, padding: "2px 6px",
                display: "none", lineHeight: 1, flexShrink: 0,
              }}
              className="mobile-menu-btn"
              aria-label="Open sidebar"
            >☰</button>
            <div style={{
              width: 26, height: 26, borderRadius: "50%",
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 13, flexShrink: 0,
            }}>✦</div>
            <span style={{
              fontWeight: 600, fontSize: 14,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              {activeSession?.title || "New Chat"}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#555", flexShrink: 0, marginLeft: 8 }}>
            {!user.isGuest && !user.hasPassword && (
              <button onClick={() => setShowSetPassword(true)} style={{
                background: "none", border: "1px solid #2a2a2a", color: "#888",
                padding: "4px 10px", borderRadius: 6, cursor: "pointer", fontSize: 12,
              }}>Set Password</button>
            )}
            {user.isGuest ? "👤 Guest" : `👤 ${user.name}`}
          </div>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: "auto", padding: "24px 0" }}>
          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%", color: "#555" }}>
              Loading chats...
            </div>
          ) : activeSession?.messages.length === 0 ? (
            <EmptyState name={user.isGuest ? "Guest" : user.name} />
          ) : (
            activeSession?.messages.map((msg, i) => (
              <ChatMessage
                key={i}
                message={msg}
                isLast={i === activeSession.messages.length - 1}
                isStreaming={isStreaming}
                onRegenerate={regenerate}
              />
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        <ChatInput onSend={sendMessage} disabled={isStreaming} />
      </div>
    </div>
  );
}

function EmptyState({ name }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", height: "100%", gap: 16,
    }}>
      <div style={{
        width: 60, height: 60, borderRadius: "50%",
        background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26,
      }}>✦</div>
      <div style={{ textAlign: "center" }}>
        <p style={{ fontSize: 22, fontWeight: 700, color: "#e8e8e8", marginBottom: 8 }}>
          Hey {name}, how can I help?
        </p>
        <p style={{ fontSize: 14, color: "#555" }}>
          Ask me anything — code, writing, analysis, or just chat.
        </p>      </div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center", marginTop: 8 }}>
        {["Write a React component", "Explain async/await", "Debug my code", "Write a SQL query"].map((s) => (
          <div key={s} style={{
            padding: "8px 14px", background: "#141414", border: "1px solid #2a2a2a",
            borderRadius: 20, fontSize: 13, color: "#888", cursor: "default",
          }}>{s}</div>
        ))}
      </div>
    </div>
  );
}

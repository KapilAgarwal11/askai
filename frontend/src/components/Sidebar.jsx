import { useState } from "react";

export default function Sidebar({ sessions, activeId, onSelect, onNew, onDelete, user, onLogout, sidebarOpen, onClose }) {
  const [collapsed, setCollapsed] = useState(false);

  // Mobile: slide in/out
  const mobileStyle = {
    position: "fixed", top: 0, left: 0, height: "100vh",
    zIndex: 50, transform: sidebarOpen ? "translateX(0)" : "translateX(-100%)",
    transition: "transform 0.25s ease",
  };

  if (collapsed) {
    return (
      <div style={{
        width: 48, background: "#0a0a0a", borderRight: "1px solid #1a1a1a",
        display: "flex", flexDirection: "column", alignItems: "center", padding: "12px 0", gap: 8,
        flexShrink: 0,
      }}>
        <button onClick={() => setCollapsed(false)} style={iconBtn} title="Expand sidebar">☰</button>
        <button onClick={onNew} style={iconBtn} title="New chat">+</button>
      </div>
    );
  }

  return (
    <div style={{
      width: 240, background: "#0a0a0a", borderRight: "1px solid #1a1a1a",
      display: "flex", flexDirection: "column", flexShrink: 0,
      ...(typeof window !== "undefined" && window.innerWidth <= 640 ? mobileStyle : {}),
    }}>
      {/* Top bar */}
      <div style={{
        padding: "14px 12px", display: "flex", alignItems: "center",
        justifyContent: "space-between", borderBottom: "1px solid #1a1a1a",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 22, height: 22, borderRadius: "50%",
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 11,
          }}>✦</div>
          <span style={{ fontWeight: 700, fontSize: 14, color: "#e8e8e8" }}>AskAI</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button onClick={() => setCollapsed(true)} style={iconBtn} title="Collapse">←</button>
          {onClose && (
            <button onClick={onClose} style={{ ...iconBtn, display: "none" }} className="mobile-close-btn" title="Close">✕</button>
          )}
        </div>
      </div>

      {/* New chat button */}
      <div style={{ padding: "10px 10px 6px" }}>
        <button
          onClick={onNew}
          style={{
            width: "100%", padding: "8px 12px", background: "#1a1a1a",
            border: "1px solid #2a2a2a", borderRadius: 8, color: "#e8e8e8",
            cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center",
            gap: 8, transition: "background 0.15s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#222")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "#1a1a1a")}
        >
          <span style={{ fontSize: 16 }}>+</span> New Chat
        </button>
      </div>

      {/* Sessions list */}
      <div style={{ flex: 1, overflowY: "auto", padding: "4px 8px" }}>
        {sessions.length === 0 && (
          <p style={{ color: "#444", fontSize: 12, padding: "8px 4px" }}>No chats yet</p>
        )}
        {sessions.map((s) => (
          <SessionItem
            key={s.id}
            session={s}
            isActive={s.id === activeId}
            onSelect={() => onSelect(s.id)}
            onDelete={() => onDelete(s.id)}
          />
        ))}
      </div>

      {/* User footer */}
      <div style={{
        padding: "12px 10px", borderTop: "1px solid #1a1a1a",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 28, height: 28, borderRadius: "50%",
            background: user?.isGuest ? "#1e1e1e" : "linear-gradient(135deg, #6366f1, #8b5cf6)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 12, color: "#fff", fontWeight: 700, flexShrink: 0,
          }}>
            {user?.isGuest ? "G" : (user?.name?.[0] || "U").toUpperCase()}
          </div>
          <div>
            <p style={{ fontSize: 12, color: "#e8e8e8", margin: 0, fontWeight: 500 }}>
              {user?.isGuest ? "Guest" : user?.name}
            </p>
            <p style={{ fontSize: 11, color: "#444", margin: 0 }}>
              {user?.isGuest ? "Not signed in" : user?.email}
            </p>
          </div>
        </div>
        <button onClick={onLogout} title="Logout" style={{
          background: "none", border: "none", color: "#555",
          cursor: "pointer", fontSize: 15, padding: 4,
        }}>⏻</button>
      </div>
    </div>
  );
}

function SessionItem({ session, isActive, onSelect, onDelete }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onClick={onSelect}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: "8px 10px", borderRadius: 8, cursor: "pointer",
        background: isActive ? "#1e1e2e" : hovered ? "#141414" : "transparent",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: 2, transition: "background 0.15s",
        border: isActive ? "1px solid #2d2d4e" : "1px solid transparent",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
        <span style={{ fontSize: 13, flexShrink: 0 }}>💬</span>
        <span style={{
          fontSize: 13, color: isActive ? "#e8e8e8" : "#aaa",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {session.title || "New Chat"}
        </span>
      </div>
      {hovered && (
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          style={{
            background: "none", border: "none", color: "#666",
            cursor: "pointer", fontSize: 14, padding: "0 2px", flexShrink: 0,
          }}
          title="Delete chat"
          aria-label="Delete chat"
        >
          ✕
        </button>
      )}
    </div>
  );
}

const iconBtn = {
  background: "none", border: "none", color: "#666",
  cursor: "pointer", fontSize: 16, padding: 6, borderRadius: 6,
  display: "flex", alignItems: "center", justifyContent: "center",
};

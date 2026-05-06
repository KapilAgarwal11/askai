import { useState } from "react";

export default function SetPasswordModal({ onClose, onSuccess }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (password.length < 6) return setError("Password must be at least 6 characters");
    if (password !== confirm) return setError("Passwords don't match");

    setLoading(true);
    try {
      const token = localStorage.getItem("ai-chat-token");
      const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:3001/api"}/auth/set-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) return setError(data.error || "Failed");
      setDone(true);
      setTimeout(() => { onSuccess(); onClose(); }, 1500);
    } catch {
      setError("Cannot connect to server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
    }}>
      <div style={{
        background: "#111", border: "1px solid #2a2a2a", borderRadius: 14,
        padding: "28px 24px", width: "100%", maxWidth: 360,
      }}>
        <h3 style={{ color: "#e8e8e8", margin: "0 0 8px", fontSize: 16 }}>Set a Password</h3>
        <p style={{ color: "#666", fontSize: 13, margin: "0 0 20px" }}>
          Set a password so you can also login with email & password next time.
        </p>

        {done ? (
          <p style={{ color: "#4ade80", textAlign: "center", fontSize: 14 }}>✓ Password set successfully!</p>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <input type="password" placeholder="New password" value={password}
              onChange={(e) => setPassword(e.target.value)} style={inputStyle} required />
            <input type="password" placeholder="Confirm password" value={confirm}
              onChange={(e) => setConfirm(e.target.value)} style={inputStyle} required />
            {error && <p style={{ color: "#f87171", fontSize: 13, margin: 0 }}>{error}</p>}
            <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
              <button type="button" onClick={onClose} style={{
                flex: 1, padding: "10px", borderRadius: 8, border: "1px solid #2a2a2a",
                background: "transparent", color: "#666", cursor: "pointer", fontSize: 13,
              }}>Cancel</button>
              <button type="submit" disabled={loading} style={{
                flex: 1, padding: "10px", borderRadius: 8, border: "none",
                background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 600,
              }}>
                {loading ? "Saving..." : "Set Password"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

const inputStyle = {
  padding: "10px 14px", background: "#0d0d0d", border: "1px solid #2a2a2a",
  borderRadius: 8, color: "#e8e8e8", fontSize: 14, outline: "none",
  fontFamily: "inherit", width: "100%", boxSizing: "border-box",
};

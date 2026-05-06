import { useState } from "react";

const API = (import.meta.env.VITE_API_URL || "http://localhost:3001/api") + "/password";

export default function ForgotPassword({ onBack }) {
  const [step, setStep] = useState(1); // 1=email, 2=otp+newpass
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function sendOTP(e) {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const res = await fetch(`${API}/forgot`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) return setError(data.error);
      setStep(2);
    } catch { setError("Cannot connect to server."); }
    finally { setLoading(false); }
  }

  async function resetPassword(e) {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const res = await fetch(`${API}/reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) return setError(data.error);
      setDone(true);
      setTimeout(onBack, 2000);
    } catch { setError("Cannot connect to server."); }
    finally { setLoading(false); }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <button onClick={onBack} style={{
        background: "none", border: "none", color: "#666", cursor: "pointer",
        fontSize: 13, textAlign: "left", padding: 0,
      }}>← Back to login</button>

      <div>
        <h3 style={{ color: "#e8e8e8", margin: "0 0 6px", fontSize: 16 }}>Reset Password</h3>
        <p style={{ color: "#555", fontSize: 13, margin: 0 }}>
          {step === 1 ? "Enter your email to receive a reset code." : `Enter the code sent to ${email}`}
        </p>
      </div>

      {done ? (
        <p style={{ color: "#4ade80", fontSize: 14 }}>✓ Password reset! Redirecting to login...</p>
      ) : step === 1 ? (
        <form onSubmit={sendOTP} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <input type="email" placeholder="Email address" value={email}
            onChange={(e) => setEmail(e.target.value)} style={inputStyle} required />
          {error && <p style={{ color: "#f87171", fontSize: 13, margin: 0 }}>{error}</p>}
          <button type="submit" disabled={loading} style={btnStyle}>
            {loading ? "Sending..." : "Send Reset Code"}
          </button>
        </form>
      ) : (
        <form onSubmit={resetPassword} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <input type="text" placeholder="6-digit code" value={otp} maxLength={6}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))} style={inputStyle} required />
          <input type="password" placeholder="New password" value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)} style={inputStyle} required />
          {error && <p style={{ color: "#f87171", fontSize: 13, margin: 0 }}>{error}</p>}
          <button type="submit" disabled={loading} style={btnStyle}>
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </form>
      )}
    </div>
  );
}

const inputStyle = {
  padding: "10px 14px", background: "#0d0d0d", border: "1px solid #2a2a2a",
  borderRadius: 8, color: "#e8e8e8", fontSize: 14, outline: "none",
  fontFamily: "inherit", width: "100%", boxSizing: "border-box",
};

const btnStyle = {
  padding: "11px", borderRadius: 8, border: "none",
  background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
  color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer",
};

import { useState, useEffect } from "react";
import { useGoogleLogin } from "@react-oauth/google";
import ForgotPassword from "./ForgotPassword.jsx";

const API = (import.meta.env.VITE_API_URL || "http://localhost:3001/api") + "/auth";

export default function AuthScreen({ onAuth }) {
  const [mode, setMode] = useState("login");
  const [showForgot, setShowForgot] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLoading(true);
      setError("");
      try {
        const userInfo = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        }).then((r) => r.json());

        const res = await fetch(`${API}/google`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userInfo }),
        });
        const data = await res.json();
        if (!res.ok) return setError(data.error || "Google login failed");
        localStorage.setItem("ai-chat-token", data.token);
        onAuth({ ...data.user, isGuest: false });
      } catch {
        setError("Google login failed. Try again.");
      } finally {
        setLoading(false);
      }
    },
    onError: () => setError("Google login failed. Try again."),
  });

  async function sendOTP() {
    if (!email) return setError("Enter your email first");
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API}/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) return setError(data.error || "Failed to send OTP");
      setOtpSent(true);
      setCountdown(60);
    } catch {
      setError("Cannot connect to server.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "login") {
        const res = await fetch(`${API}/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (!res.ok) return setError(data.error || "Login failed");
        localStorage.setItem("ai-chat-token", data.token);
        onAuth({ ...data.user, isGuest: false });
      } else {
        if (!otpSent) return setError("Please send OTP first");
        const res = await fetch(`${API}/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password, otp }),
        });
        const data = await res.json();
        if (!res.ok) return setError(data.error || "Registration failed");
        localStorage.setItem("ai-chat-token", data.token);
        onAuth({ ...data.user, isGuest: false });
      }
    } catch {
      setError("Cannot connect to server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      height: "100vh", background: "#0d0d0d",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <div style={{ width: "100%", maxWidth: 400, padding: "0 24px" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{
            width: 52, height: 52, borderRadius: "50%",
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            fontSize: 22, marginBottom: 12,
          }}>✦</div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#e8e8e8", margin: 0 }}>AskAI</h1>
          <p style={{ fontSize: 13, color: "#555", marginTop: 6 }}>
            {mode === "login" ? "Welcome back" : "Create your account"}
          </p>
        </div>

        <div style={{ background: "#111", border: "1px solid #1e1e1e", borderRadius: 14, padding: "28px 24px" }}>
          {showForgot ? (
            <ForgotPassword onBack={() => setShowForgot(false)} />
          ) : (<>
          {/* Tabs */}
          <div style={{ display: "flex", background: "#0a0a0a", borderRadius: 8, padding: 3, marginBottom: 24 }}>
            {["login", "register"].map((m) => (
              <button key={m} onClick={() => { setMode(m); setError(""); setOtpSent(false); setOtp(""); }}
                style={{
                  flex: 1, padding: "7px 0", borderRadius: 6, border: "none",
                  background: mode === m ? "#1e1e2e" : "transparent",
                  color: mode === m ? "#e8e8e8" : "#555",
                  cursor: "pointer", fontSize: 13, fontWeight: mode === m ? 600 : 400,
                }}>
                {m === "login" ? "Login" : "Sign Up"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {mode === "register" && (
              <input type="text" placeholder="Your name" value={name}
                onChange={(e) => setName(e.target.value)} style={inputStyle} required />
            )}
            <input type="email" placeholder="Email address" value={email}
              onChange={(e) => setEmail(e.target.value)} style={inputStyle} required />
            <input type="password" placeholder="Password" value={password}
              onChange={(e) => setPassword(e.target.value)} style={inputStyle} required />

            {mode === "register" && (
              <div style={{ display: "flex", gap: 8 }}>
                <input type="text" placeholder="Enter OTP" value={otp} maxLength={6}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  style={{ ...inputStyle, flex: 1 }} />
                <button type="button" onClick={sendOTP} disabled={loading || countdown > 0}
                  style={{
                    padding: "10px 14px", borderRadius: 8, border: "1px solid #2a2a2a",
                    background: countdown > 0 ? "#0d0d0d" : "#1a1a1a",
                    color: countdown > 0 ? "#444" : "#888",
                    cursor: countdown > 0 ? "not-allowed" : "pointer",
                    fontSize: 12, whiteSpace: "nowrap", flexShrink: 0,
                  }}>
                  {countdown > 0 ? `${countdown}s` : otpSent ? "Resend" : "Send OTP"}
                </button>
              </div>
            )}

            {otpSent && mode === "register" && (
              <p style={{ fontSize: 12, color: "#4ade80", margin: 0 }}>✓ OTP sent to {email}</p>
            )}
            {error && (
              <p style={{ color: "#f87171", fontSize: 13, margin: 0 }}>
                {error}
                {error.includes("Google login") && (
                  <span onClick={() => googleLogin()}
                    style={{ color: "#818cf8", cursor: "pointer", marginLeft: 6, textDecoration: "underline" }}>
                    Sign in with Google
                  </span>
                )}
              </p>
            )}

            {mode === "login" && (
              <button type="button" onClick={() => setShowForgot(true)} style={{
                background: "none", border: "none", color: "#6366f1",
                cursor: "pointer", fontSize: 12, padding: 0, textAlign: "right",
              }}>Forgot password?</button>
            )}

            <button type="submit" disabled={loading} style={{
              padding: "11px", borderRadius: 8, border: "none",
              background: loading ? "#3730a3" : "linear-gradient(135deg, #6366f1, #8b5cf6)",
              color: "#fff", fontSize: 14, fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer", marginTop: 4,
            }}>
              {loading ? "Please wait..." : mode === "login" ? "Login" : "Create Account"}
            </button>
          </form>

          <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "20px 0" }}>
            <div style={{ flex: 1, height: 1, background: "#1e1e1e" }} />
            <span style={{ fontSize: 12, color: "#444" }}>or</span>
            <div style={{ flex: 1, height: 1, background: "#1e1e1e" }} />
          </div>

          {/* Google Login Button */}
          <button onClick={() => googleLogin()} disabled={loading}
            style={{
              width: "100%", padding: "11px 16px", borderRadius: 8,
              border: "1px solid #2a2a2a", background: "#1a1a1a",
              color: "#e8e8e8", fontSize: 14, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
              transition: "background 0.2s",
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = "#222"}
            onMouseLeave={(e) => e.currentTarget.style.background = "#1a1a1a"}
          >
            <svg width="18" height="18" viewBox="0 0 48 48">
              <path fill="#FFC107" d="M43.6 20H24v8h11.3C33.6 33.1 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 19.7-8 19.7-20 0-1.3-.1-2.7-.1-4z"/>
              <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 15.1 18.9 12 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
              <path fill="#4CAF50" d="M24 44c5.2 0 9.9-1.9 13.5-5l-6.2-5.2C29.4 35.6 26.8 36 24 36c-5.2 0-9.6-2.9-11.3-7.1l-6.5 5C9.5 39.6 16.3 44 24 44z"/>
              <path fill="#1976D2" d="M43.6 20H24v8h11.3c-.9 2.4-2.5 4.4-4.6 5.8l6.2 5.2C40.8 35.5 44 30.2 44 24c0-1.3-.1-2.7-.4-4z"/>
            </svg>
            Continue with Google
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "16px 0" }}>
            <div style={{ flex: 1, height: 1, background: "#1e1e1e" }} />
            <span style={{ fontSize: 12, color: "#444" }}>or</span>
            <div style={{ flex: 1, height: 1, background: "#1e1e1e" }} />
          </div>

          <button onClick={() => onAuth({ name: "Guest", email: null, isGuest: true })}
            style={{
              width: "100%", padding: "11px", borderRadius: 8,
              border: "1px solid #2a2a2a", background: "transparent",
              color: "#666", fontSize: 14, cursor: "pointer",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "#e8e8e8"; e.currentTarget.style.background = "#141414"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "#666"; e.currentTarget.style.background = "transparent"; }}
          >
            Continue as Guest
          </button>
          </>)}
        </div>
      </div>
    </div>
  );
}

const inputStyle = {
  padding: "10px 14px", background: "#0d0d0d",
  border: "1px solid #2a2a2a", borderRadius: 8,
  color: "#e8e8e8", fontSize: 14, outline: "none",
  fontFamily: "inherit", width: "100%", boxSizing: "border-box",
};

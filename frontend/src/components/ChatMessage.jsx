import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { useState } from "react";

export default function ChatMessage({ message, onRegenerate, isLast, isStreaming }) {
  const isUser = message.role === "user";
  const [copied, setCopied] = useState(false);
  const [hovered, setHovered] = useState(false);

  function copyMessage() {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: "12px 16px",
        display: "flex",
        gap: 10,
        alignItems: "flex-start",
        maxWidth: 860,
        margin: "0 auto",
        width: "100%",
        position: "relative",
        boxSizing: "border-box",
      }}
    >
      {/* Avatar */}
      <div style={{
        width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
        background: isUser
          ? "linear-gradient(135deg, #3b82f6, #1d4ed8)"
          : "linear-gradient(135deg, #6366f1, #8b5cf6)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 12, fontWeight: 700, color: "#fff", marginTop: 2,
      }}>
        {isUser ? "U" : "✦"}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: "#666", marginBottom: 5 }}>
          {isUser ? "You" : "AskAI"}
        </div>
        <div style={{ fontSize: 15, lineHeight: 1.7, color: "#e0e0e0" }}>
          {isUser ? (
            <p style={{ whiteSpace: "pre-wrap", margin: 0 }}>{message.content}</p>
          ) : (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code({ node, inline, className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || "");
                  const codeStr = String(children).replace(/\n$/, "");
                  if (!inline && match) {
                    return <CodeBlock language={match[1]} code={codeStr} />;
                  }
                  return (
                    <code style={{
                      background: "#1a1a1a", padding: "2px 6px",
                      borderRadius: 4, fontSize: 13, color: "#e879f9",
                    }} {...props}>{children}</code>
                  );
                },
                p: ({ children }) => <p style={{ marginBottom: 12, marginTop: 0 }}>{children}</p>,
                ul: ({ children }) => <ul style={{ paddingLeft: 20, marginBottom: 12 }}>{children}</ul>,
                ol: ({ children }) => <ol style={{ paddingLeft: 20, marginBottom: 12 }}>{children}</ol>,
                li: ({ children }) => <li style={{ marginBottom: 4 }}>{children}</li>,
                blockquote: ({ children }) => (
                  <blockquote style={{ borderLeft: "3px solid #6366f1", paddingLeft: 12, color: "#888", margin: "12px 0" }}>
                    {children}
                  </blockquote>
                ),
                h1: ({ children }) => <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12, color: "#fff" }}>{children}</h1>,
                h2: ({ children }) => <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 10, color: "#fff" }}>{children}</h2>,
                h3: ({ children }) => <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8, color: "#ddd" }}>{children}</h3>,
                table: ({ children }) => (
                  <div style={{ overflowX: "auto", marginBottom: 12 }}>
                    <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 14 }}>{children}</table>
                  </div>
                ),
                th: ({ children }) => <th style={{ border: "1px solid #333", padding: "8px 12px", background: "#1a1a1a", textAlign: "left" }}>{children}</th>,
                td: ({ children }) => <td style={{ border: "1px solid #222", padding: "8px 12px" }}>{children}</td>,
              }}
            >
              {message.content}
            </ReactMarkdown>
          )}
        </div>

        {/* Action buttons — show on hover */}
        {message.content && !isStreaming && (
          <div style={{
            display: "flex", gap: 6, marginTop: 6,
            opacity: hovered ? 1 : 0, transition: "opacity 0.15s",
          }}>
            <ActionBtn onClick={copyMessage} title="Copy">
              {copied ? "✓ Copied" : "Copy"}
            </ActionBtn>
            {!isUser && isLast && onRegenerate && (
              <ActionBtn onClick={onRegenerate} title="Regenerate response">
                ↺ Regenerate
              </ActionBtn>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ActionBtn({ onClick, title, children }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      title={title}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: hov ? "#1e1e1e" : "transparent",
        border: "1px solid #2a2a2a",
        color: "#666", cursor: "pointer",
        padding: "3px 10px", borderRadius: 6,
        fontSize: 12, transition: "all 0.15s",
      }}
    >
      {children}
    </button>
  );
}

function CodeBlock({ language, code }) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div style={{ borderRadius: 8, overflow: "hidden", marginBottom: 12, border: "1px solid #222" }}>
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "8px 14px", background: "#161616", borderBottom: "1px solid #222",
      }}>
        <span style={{ fontSize: 12, color: "#666", fontFamily: "monospace" }}>{language}</span>
        <button onClick={copy} style={{
          background: "none", border: "1px solid #333",
          color: copied ? "#4ade80" : "#888",
          padding: "3px 10px", borderRadius: 4, cursor: "pointer", fontSize: 12,
        }}>
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <SyntaxHighlighter
        style={oneDark} language={language} PreTag="div"
        customStyle={{ margin: 0, borderRadius: 0, fontSize: 13 }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
}

import React, { useState, useEffect } from "react";

export default function SplashScreen({
  message = "Starting the study workspace…",
  maxWait = 8_000,
  onTimeout,
}) {
  const [dots, setDots]       = useState(".");
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setDots((d) => (d.length >= 3 ? "." : d + ".")), 500);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => { setExpired(true); onTimeout?.(); }, maxWait);
    return () => clearTimeout(t);
  }, [maxWait, onTimeout]);

  if (expired) {
    return (
      <div style={s.root}>
        <div style={s.card}>
          <span style={{ fontSize: "2.5rem" }}>⚠️</span>
          <h2 style={{ margin: 0, color: "var(--theme-error)", fontSize: "1.25rem", fontWeight: 700 }}>
            Unable to load workspace
          </h2>
          <p style={{ color: "var(--theme-text-secondary)", fontSize: "0.9rem", lineHeight: 1.6, margin: 0 }}>
            The app took too long to start. The backend may be unreachable or your session expired.
          </p>
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", justifyContent: "center" }}>
            <button style={s.btn} onClick={() => window.location.reload()}>Refresh</button>
            <button style={{ ...s.btn, background: "transparent", border: "1.5px solid var(--theme-border)", color: "var(--theme-text-secondary)" }}
              onClick={() => { localStorage.clear(); window.location.href = "/login"; }}>
              Go to Login
            </button>
          </div>
          <p style={{ fontSize: "0.75rem", color: "var(--theme-text-muted)", margin: 0 }}>
            Open browser console (F12) for error details.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={s.root}>
      <div style={s.card}>
        <div style={{ filter: "drop-shadow(0 0 24px rgba(34,111,84,0.45))", marginBottom: "0.5rem" }}>
          <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
            <rect width="56" height="56" rx="16" fill="var(--theme-accent)" />
            <path d="M14 38 L22 18 L28 30 L34 22 L42 38" stroke="white" strokeWidth="3"
              strokeLinecap="round" strokeLinejoin="round" fill="none" />
            <circle cx="28" cy="15" r="4" fill="var(--theme-accent-soft)" />
          </svg>
        </div>
        <h1 style={{ margin: 0, fontSize: "1.75rem", fontWeight: 700, color: "var(--theme-text-primary)", letterSpacing: 0 }}>
          AI Study Planner
        </h1>
        <p style={{ margin: 0, color: "var(--theme-text-secondary)", fontSize: "1rem", minHeight: "1.5em" }}>
          {message}<span aria-hidden="true">{dots}</span>
        </p>
        <div style={{ marginTop: "1.5rem", width: 200, height: 3, borderRadius: 99, background: "var(--theme-bg-soft)", overflow: "hidden" }}>
          <div style={{ height: "100%", width: "60%", borderRadius: 99, background: "linear-gradient(90deg,var(--theme-accent),var(--theme-accent-hover))", animation: "barSlide 1.4s ease-in-out infinite" }} />
        </div>
      </div>
      <style>{`
        @keyframes barSlide { 0%{transform:translateX(-100%)} 50%{transform:translateX(0%)} 100%{transform:translateX(100%)} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
      `}</style>
    </div>
  );
}

const s = {
  root: {
    minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
    background: "var(--theme-bg-main)",
    fontFamily: "Inter, system-ui, sans-serif",
  },
  card: {
    display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem",
    padding: "3rem 2rem", animation: "fadeIn 0.4s ease both",
    maxWidth: 420, width: "90%", textAlign: "center", background: "var(--theme-bg-card)",
    border: "1px solid var(--theme-border)", borderRadius: "24px", boxShadow: "var(--theme-shadow-lg)",
  },
  btn: {
    padding: "0.6rem 1.4rem", background: "linear-gradient(135deg,var(--theme-accent),var(--theme-accent-hover))", color: "#fff",
    border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "0.95rem", fontWeight: 600,
  },
};

import { motion } from "framer-motion";
import { RefreshCw, Home, LogIn, AlertCircle, WifiOff, ZapOff, ArrowLeft } from "lucide-react";

export default function ErrorScreen({
  title = "Study session interrupted",
  detail = "Something interrupted your study flow. Let’s recover it.",
  type = "error", // 'error', 'offline', 'timeout', 'sync'
  onRetry,
}) {
  const isOffline = !navigator.onLine || type === "offline";
  
  const variants = {
    initial: { opacity: 0, scale: 0.9, y: 20 },
    animate: { opacity: 1, scale: 1, y: 0 },
  };

  const getIcon = () => {
    if (isOffline) return <WifiOff size={48} className="text-orange-400" />;
    if (type === "timeout") return <ZapOff size={48} className="text-yellow-400" />;
    return <AlertCircle size={48} className="text-red-400" />;
  };

  return (
    <div className="premium-error-overlay" style={s.root}>
      {/* Animated background glow */}
      <div className="error-glow" />
      
      <motion.div 
        variants={variants}
        initial="initial"
        animate="animate"
        transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
        style={s.card}
        className="glass-error-card"
      >
        <motion.div 
          animate={{ rotate: [0, -10, 10, 0] }}
          transition={{ repeat: Infinity, duration: 4 }}
          className="error-icon-wrapper"
        >
          {getIcon()}
        </motion.div>

        <h2 style={s.title}>{isOffline ? "Connection Lost" : title}</h2>
        
        <p style={s.detail}>
          {isOffline 
            ? "You appear to be offline. Your progress is safe, but we can't sync with the AI right now." 
            : detail}
        </p>

        <div className="error-actions" style={s.actions}>
          {onRetry && (
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={s.btnPrimary} 
              onClick={onRetry}
            >
              <RefreshCw size={18} /> Retry Connection
            </motion.button>
          )}
          
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            style={s.btnSecondary}
            onClick={() => window.location.href = "/"}
          >
            <Home size={18} /> Dashboard
          </motion.button>

          <button 
            style={s.btnGhost}
            onClick={() => { localStorage.clear(); window.location.href = "/login"; }}
          >
            <LogIn size={18} /> Go to Login
          </button>
        </div>

        <div style={s.footer}>
          <p>System handling the issue automatically. If persist, check connectivity.</p>
        </div>
      </motion.div>

      <style>{`
        .premium-error-overlay {
          position: relative;
          overflow: hidden;
        }
        .error-glow {
          position: absolute;
          width: 400px;
          height: 400px;
          background: radial-gradient(circle, var(--theme-accent-subtle) 0%, transparent 70%);
          filter: blur(60px);
          z-index: 0;
        }
        .glass-error-card {
          background: color-mix(in srgb, var(--theme-bg-card) 88%, transparent) !important;
          backdrop-filter: blur(12px);
          border: 1px solid var(--theme-border) !important;
          box-shadow: var(--theme-shadow-lg) !important;
        }
      `}</style>
    </div>
  );
}

const s = {
  root: {
    minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", position: "fixed", top: 0, left: 0, width: "100%", zIndex: 9999,
    background: "var(--theme-bg-main)",
    fontFamily: "Inter, system-ui, sans-serif", padding: "1rem",
  },
  card: {
    maxWidth: 480, width: "100%", display: "flex", flexDirection: "column", position: "relative", zIndex: 1,
    alignItems: "center", gap: "1.5rem", textAlign: "center", padding: "3.5rem 2.5rem",
    borderRadius: "28px",
  },
  title: { margin: 0, fontSize: "1.75rem", fontWeight: 800, color: "var(--theme-text-primary)", letterSpacing: 0 },
  detail: { margin: 0, color: "var(--theme-text-secondary)", fontSize: "1rem", lineHeight: 1.6, maxWidth: 360 },
  actions: { display: "flex", flexDirection: "column", gap: "0.75rem", width: "100%", marginTop: "0.5rem" },
  btnPrimary: {
    display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
    padding: "0.85rem", background: "linear-gradient(135deg, var(--theme-accent), var(--theme-accent-hover))", color: "#fff",
    border: "none", borderRadius: "12px", cursor: "pointer", fontSize: "1rem", fontWeight: 700,
  },
  btnSecondary: {
    display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
    padding: "0.85rem", background: "var(--theme-bg-card)", color: "var(--theme-text-primary)",
    border: "1px solid var(--theme-border)", borderRadius: "12px", cursor: "pointer", fontSize: "1rem", fontWeight: 600,
  },
  btnGhost: {
    background: "transparent", border: "none", color: "var(--theme-text-secondary)", cursor: "pointer", fontSize: "0.9rem", marginTop: "0.5rem",
    display: "flex", alignItems: "center", justifyContent: "center", gap: "6px"
  },
  footer: { borderTop: "1px solid var(--theme-border)", paddingTop: "1.25rem", width: "100%", color: "var(--theme-text-muted)", fontSize: "0.75rem" }
  };

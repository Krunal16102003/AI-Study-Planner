import { Component, Fragment, Suspense, lazy, useEffect, useMemo, useState, useRef, useCallback } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Navigate, NavLink, Route, Routes, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { Activity, BarChart3, BatteryCharging, Bell, BookOpen, Bot, Brain, BriefcaseBusiness, CalendarDays, ChevronDown, Clock, Dna, Download, Eye, EyeOff, FileSpreadsheet, FileText, Flame, FlaskConical, Gauge, HeartPulse, Home, Layers, Loader2, LogOut, Medal, Menu, MessageCircle, Mic, Microscope, Moon, Network, Orbit, PanelLeftClose, PanelLeftOpen, Plus, ScanFace, Search, Send, Settings, ShieldCheck, Sparkles, Sun, Swords, TimerReset, Trophy, UserCircle, Users, Vault, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { api, getApiErrorMessage, setAuthToken } from "./services/api";
import ErrorScreen from "./components/ErrorScreen";
import FloatingAIAssistant from "./components/FloatingAIAssistant";
import "./pwa";
import {
  AnalyticsLabPage,
  BrainEnergyPage,
  CareerSimulatorPage,
  ExamWarRoomPage,
  FocusArenaPage,
  HabitLabPage,
  KnowledgeMapPage,
  MemoryVaultPage,
  MentorRoomPage,
  StudyClonePage,
  StudyDnaPage,
  StudyUniversePage,
  TimeMachinePage,
} from "./pages/AiOperatingSystemPages";
import "./styles.css";

const LandingPage = lazy(() => import("./components/LandingPage"));
const FocusModePage = lazy(() => import("./components/focus/FocusModePage"));
const MentorRoomWorkspace = lazy(() => import("./components/mentor/MentorRoomWorkspace"));
const PlanningDashboard = lazy(() => import("./components/planning/PlanningDashboard"));
const SmartScheduleGenerator = lazy(() => import("./components/planning/SmartScheduleGenerator"));
const Resources = lazy(() => import("./components/Resources")); // Removed .jsx for consistency
const ExamCommandCenter = lazy(() => import("./pages/ExamCommandCenter"));

const SUBJECT_SUGGESTIONS = [
  "Mathematics", "Physics", "Chemistry", "Biology", "English",
  "Computer Science", "History", "Geography", "Economics", "Accountancy",
];

const TOPIC_SUGGESTIONS = [
  "Algebra", "Calculus", "Mechanics", "Organic Chemistry", "Human Physiology",
  "Grammar", "Data Structures", "World History", "Maps and Climate", "Microeconomics",
];

const SUBJECT_TOPIC_SUGGESTIONS = {
  Mathematics: ["Algebra", "Geometry", "Trigonometry", "Calculus", "Probability", "Statistics"],
  Physics: ["Mechanics", "Optics", "Thermodynamics", "Electricity", "Magnetism", "Modern Physics"],
  Chemistry: ["Atomic Structure", "Chemical Bonding", "Organic Chemistry", "Thermodynamics", "Equilibrium"],
  Biology: ["Cell Biology", "Genetics", "Human Physiology", "Plant Physiology", "Ecology"],
  English: ["Grammar", "Reading Comprehension", "Essay Writing", "Vocabulary", "Literature"],
  "Computer Science": ["Data Structures", "Algorithms", "Databases", "Operating Systems", "Networking"],
  History: ["Ancient History", "Medieval History", "Modern History", "World History"],
  Geography: ["Maps and Climate", "Physical Geography", "Human Geography", "Resources"],
  Economics: ["Microeconomics", "Macroeconomics", "Demand and Supply", "National Income"],
  Accountancy: ["Journal Entries", "Ledger", "Trial Balance", "Final Accounts", "Cash Flow"],
};

const navGroups = [
  { type: "link", label: "Dashboard", to: "/", icon: Gauge },
  {
    label: "Plan",
    icon: CalendarDays,
    items: [
      { label: "Smart Planner", to: "/planner", icon: CalendarDays },
      { label: "Exam Command", to: "/exam-command", icon: Gauge },
      { label: "Focus Mode", to: "/focus", icon: TimerReset },
    ],
  },
  {
    label: "Study",
    icon: BookOpen,
    items: [
      { label: "Subjects", to: "/subjects", icon: BookOpen },
      { label: "Resources", to: "/resources", icon: FileText },
      { label: "Memory Vault", to: "/memory-vault", icon: Layers },
    ],
  },
  {
    label: "Practice",
    icon: Brain,
    items: [
      { label: "Quizzes", to: "/quiz", icon: Brain },
      { label: "Mock Tests", to: "/mock-tests", icon: ShieldCheck },
      { label: "Focus Arena", to: "/focus-arena", icon: Swords },
    ],
  },
  {
    label: "Insights",
    icon: BarChart3,
    items: [
      { label: "Analytics", to: "/analytics", icon: BarChart3 },
      { label: "Deep Analytics", to: "/analytics-lab", icon: Flame },
      { label: "Wellness", to: "/wellness", icon: HeartPulse },
    ],
  },
  {
    label: "AI Tools",
    icon: Bot,
    items: [
      { label: "AI Chat", to: "/assistant", icon: MessageCircle },
      { label: "Mentor Room", to: "/mentor-room", icon: Bot },
      { label: "Study DNA", to: "/study-dna", icon: Dna },
    ],
  },
  {
    label: "Community",
    icon: Users,
    items: [
      { label: "Study Groups", to: "/groups", icon: Users },
      { label: "Career Simulator", to: "/career-simulator", icon: BriefcaseBusiness },
    ],
  },
];

const mobileNavItems = [
  { label: "Home", to: "/", icon: Gauge },
  { label: "Planner", to: "/planner", icon: CalendarDays },
  { label: "Tasks", to: "/focus", icon: TimerReset },
  { label: "Notes", to: "/memory-vault", icon: FileText },
  { label: "AI", to: "/assistant", icon: Bot },
  { label: "Profile", to: "/analytics", icon: UserCircle },
];

function SparkIcon(props) {
  return <Brain {...props} />;
}

function GridIcon(props) {
  return <BarChart3 {...props} />;
}

function formatApiError(err, fallback) {
  return getApiErrorMessage(err, fallback);
}

function isErrorMessage(message) {
  const text = message.toLowerCase();
  return text.includes("error") || text.includes("invalid") || text.includes("failed") || text.includes("unable") || text.includes("not valid") || text.includes("unexpected") || text.includes(":");
}

// ── Startup splash screen ────────────────────────────────────────────────────

function SplashScreen({ expired, onRetry }) {
  const [dots, setDots] = useState(".");

  useEffect(() => {
    const id = setInterval(() => setDots(d => (d.length >= 3 ? "." : d + ".")), 500);
    return () => clearInterval(id);
  }, []);

  if (expired) {
    return (
      <div className="route-skeleton">
        <p className="error" style={{ marginBottom: 12 }}>⚠ Unable to load workspace</p>
        <p style={{ color: "#94a3b8", fontSize: "0.9rem", marginBottom: 16 }}>
          The backend may be unreachable or your session expired.
          Check the browser console (F12) for details.
        </p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
          {onRetry && <button onClick={onRetry}>↺ Retry</button>}
          <button className="secondary" onClick={() => window.location.reload()}>⟳ Refresh</button>
          <button className="secondary" onClick={() => { localStorage.clear(); window.location.href = "/login"; }}>
            → Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="route-skeleton">
      <div className="route-skeleton__pulse" />
      <p>AI Study Planner — Starting the study workspace{dots}</p>
    </div>
  );
}

// ── App ──────────────────────────────────────────────────────────────────────

function App() {
  const [token, setToken] = useState(localStorage.getItem("access"));
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");
  const [username, setUsername] = useState(localStorage.getItem("username") || "");
  const [startupState, setStartupState] = useState({ status: "booting" });
  const [splashExpired, setSplashExpired] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => setAuthToken(token), [token]);

  useEffect(() => {
    localStorage.setItem("theme", theme);
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
  }, [theme]);

  useEffect(() => {
    function expireSession() { setToken(null); }
    window.addEventListener("auth-expired", expireSession);
    return () => window.removeEventListener("auth-expired", expireSession);
  }, []);

  // ── Startup gate ───────────────────────────────────────────────────────────
  // Fix 1: every code path now calls setStartupState (no more infinite loading).
  // Fix 2: hard 5s timeout — never blocks forever even if backend is down.
  // Fix 3: client-side JWT expiry check skips the network call when token is stale.

  const runBootstrap = useCallback(async () => {
    if (mountedRef.current) {
      setStartupState({ status: "booting" });
      setSplashExpired(false);
    }

    const access = localStorage.getItem("access");
    const refresh = localStorage.getItem("refresh");

    // Fast path — no tokens at all
    if (!access || !refresh) {
      console.debug("[Startup] No tokens found → logged out");
      if (mountedRef.current) setStartupState({ status: "logged_out" });
      return;
    }

    // Fast path — token is clearly expired, skip the network call
    try {
      const payload = JSON.parse(atob(access.split(".")[1]));
      const isExpired = Date.now() / 1000 > payload.exp - 30;
      if (isExpired) {
        console.debug("[Startup] Access token expired (client check) → clearing");
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
        if (mountedRef.current) {
          setToken(null);
          setStartupState({ status: "logged_out" });
        }
        return;
      }
    } catch {
      // Malformed token — treat as expired
      localStorage.removeItem("access");
      localStorage.removeItem("refresh");
      if (mountedRef.current) {
        setToken(null);
        setStartupState({ status: "logged_out" });
      }
      return;
    }

    const controller = new AbortController();

    // Hard 5s timeout — if backend doesn't respond, don't block forever
    const hardTimeout = setTimeout(() => {
      console.warn("[Startup] Bootstrap timed out after 5s → treating as logged out");
      controller.abort();
      if (mountedRef.current) {
        setSplashExpired(true);
        setStartupState({ status: "error", message: "Backend did not respond in time." });
      }
    }, 5000);

    try {
      await api.post(
        "/auth/token/refresh/",
        { refresh },
        { signal: controller.signal, timeout: 4000 }
      );
      clearTimeout(hardTimeout);

      const nextAccess = localStorage.getItem("access");
      if (nextAccess && mountedRef.current) setToken(nextAccess);
      if (mountedRef.current) setStartupState({ status: "logged_in" });
      console.debug("[Startup] Token refreshed successfully → logged in");
    } catch (err) {
      clearTimeout(hardTimeout);
      if (!mountedRef.current) return;

      if (err.name === "AbortError" || err.name === "CanceledError") return; // handled by timeout

      console.warn("[Startup] Token refresh failed:", err.response?.status, err.message);

      const status = err.response?.status;
      if (status === 401 || status === 400) {
        // Refresh token itself is expired — clear everything
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
        setToken(null);
        setStartupState({ status: "logged_out" });
      } else {
        // Network error or 5xx — we have a token but can't verify it
        // Optimistically let the user in; API calls will handle re-auth
        console.warn("[Startup] Network/server error — proceeding optimistically");
        setStartupState({ status: "logged_in" });
      }
    }
  }, []);

  useEffect(() => {
    runBootstrap();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const auth = {
    token,
    theme,
    username,
    toggleTheme() {
      setTheme(t => t === "light" ? "dark" : "light");
    },
    login(access, refresh, user) {
      localStorage.setItem("access", access);
      localStorage.setItem("refresh", refresh);
      localStorage.setItem("username", user);
      setToken(access);
      setUsername(user);
      setStartupState({ status: "logged_in" });
    },
    logout() {
      localStorage.removeItem("access");
      localStorage.removeItem("refresh");
      localStorage.removeItem("username");
      setToken(null);
      setUsername("");
      setStartupState({ status: "logged_out" });
    },
  };

  // Show splash only while booting
  if (startupState.status === "booting") {
    return (
      <SplashScreen
        expired={splashExpired}
        onRetry={runBootstrap}
      />
    );
  }

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path="/login"    element={<AuthPage mode="login"    auth={auth} />} />
          <Route path="/register" element={<AuthPage mode="register" auth={auth} />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route
            path="/planning"
            element={
              startupState.status === "logged_in"
                ? <Navigate to="/" replace />
                : <LazyPage><LandingPage /></LazyPage>
            }
          />
          <Route
            path="/*"
            element={
              startupState.status === "logged_in"
                ? <Shell auth={auth} />
                : <Navigate to="/login" replace />
            }
          />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

// ── Error boundary ────────────────────────────────────────────────────────────

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error, isChunkError: error?.name === 'ChunkLoadError' || error?.message?.includes('Loading chunk') };
  }

  componentDidCatch(error, info) {
    console.error("Application render failed", error, info);
    // Log to external service if available
  }

  handleReload = () => {
    window.location.reload(true);
  };

  handleReset = () => {
    this.setState({ error: null, isChunkError: false });
    window.location.href = '/';
  }

  render() {
    if (this.state.isChunkError) {
      return (
        <div className="app-error">
          <h1>Application Update Required</h1>
          <p>A new version of the study planner is available. We need to refresh your workspace.</p>
          <button onClick={this.handleReload}>Refresh Workspace</button>
        </div>
      );
    }

    if (this.state.error) {
      return (
        <Suspense fallback={<SplashScreen />}>
          <ErrorScreen 
            title="Study Flow Interrupted"
            detail={this.state.error?.message || "An unexpected error occurred in the workspace."}
            onRetry={this.handleReload}
          />
        </Suspense>
      );
    }
    return this.props.children;
  }
}

// ── Shell ─────────────────────────────────────────────────────────────────────

function Shell({ auth }) {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [toast, setToast] = useState("");
  
  const pageTitles = {
    "/": { title: "Study Planning Dashboard", sub: "Manage schedules, weak topics, and AI actions." },
    "/subjects": { title: "Subjects & Weak Topics", sub: "Add exams, confidence levels, and focus areas." },
    "/planner": { title: "Smart Timetable", sub: "Your AI-generated revision and study schedule." },
    "/resources": { title: "AI Resource Workspace", sub: "Premium study materials and personalized recommendations." },
    "/quiz": { title: "AI Quiz Practice", sub: "Test your knowledge on difficult topics." },
    "/analytics": { title: "Performance Analytics", sub: "Visualizing your consistency and readiness." },
    "/wellness": { title: "Wellness & Burnout", sub: "Healthy breaks and performance predictions." },
    "/groups": { title: "Study Groups", sub: "Collaborate and compete with other students." },
    "/assistant": { title: "AI Study Assistant", sub: "Ask questions, get explanations, and stay focused." },
    "/focus": { title: "Smart Focus Mode", sub: "Track deep work sessions and interruptions." },
    "/exam-command": { title: "Exam Command Center", sub: "Countdowns, readiness, last-minute planning, and exam risk control." },
    "/mock-tests": { title: "Mock Test Simulator", sub: "Realistic timed exams with marking, navigation, percentile, and AI review." },
    "/pomodoro": { title: "Pomodoro Timer", sub: "Optimized intervals for maximum retention." },
    "/study-dna": { title: "Study DNA", sub: "AI behavioral genome for learning personality, focus rhythm, and productivity identity." },
    "/time-machine": { title: "AI Time Machine", sub: "Forecast future exam outcomes and compare current vs optimized performance." },
    "/brain-energy": { title: "Brain Energy Monitor", sub: "Fatigue, mental load, burnout risk, and recovery timing in one neural dashboard." },
    "/knowledge-map": { title: "Knowledge Map", sub: "Interactive topic graph for mastery, weak clusters, and AI-discovered relationships." },
    "/mentor-room": { title: "AI Mentor Room", sub: "Premium coaching, motivation, strategy feedback, and conversational guidance." },
    "/focus-arena": { title: "Focus Arena", sub: "Competitive deep-work rooms, rankings, timers, and productivity challenges." },
    "/memory-vault": { title: "Memory Vault", sub: "Spaced repetition, forgetting curves, heatmaps, and retention intelligence." },
    "/study-universe": { title: "Study Universe", sub: "A cosmic mastery system where subjects become planets and achievements unlock progress." },
    "/habit-lab": { title: "AI Habit Lab", sub: "Routine experiments, streak reactors, and behavior optimization." },
    "/exam-war-room": { title: "Exam War Room", sub: "Tactical revision, mock battles, emergency plans, and countdown operations." },
    "/career-simulator": { title: "Dream Career Simulator", sub: "Convert career goals into skills, milestones, study targets, and timelines." },
    "/analytics-lab": { title: "Deep Analytics Lab", sub: "Futuristic predictions, 3D charts, simulations, and efficiency diagnostics." },
    "/study-clone": { title: "AI Study Clone", sub: "Compare current self with an optimized AI-generated productivity model." },
  };

  const current = pageTitles[location.pathname] || { title: "Workspace", sub: "AI-Powered Learning" };
  const activeGroup = useMemo(() => {
    const group = navGroups.find(item => item.items?.some(child => child.to === location.pathname));
    return group?.label || null;
  }, [location.pathname]);
  const [openGroup, setOpenGroup] = useState(activeGroup || "Planner");

  useEffect(() => {
    if (activeGroup) setOpenGroup(activeGroup);
    setMobileOpen(false);
  }, [activeGroup, location.pathname]);

  const loadNotifications = useCallback(async () => {
    try {
      const { data } = await api.get("/notifications/");
      setNotifications(Array.isArray(data) ? data : data.results || []);
    } catch (err) {
      console.warn("Notifications unavailable", err);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
    const id = setInterval(loadNotifications, 60000);
    return () => clearInterval(id);
  }, [loadNotifications]);

  async function generateSmartNotifications() {
    try {
      const { data } = await api.post("/smart-notifications/");
      setNotifications(Array.isArray(data) ? data : []);
      setToast("Smart reminders refreshed.");
    } catch {
      setToast("Notifications could not refresh right now.");
    } finally {
      setTimeout(() => setToast(""), 3000);
    }
  }

  const unreadCount = notifications.filter(item => !item.is_read).length;

  return (
    <div className={`app premium-shell theme-${auth.theme} ${collapsed ? "sidebar-collapsed" : ""}`}>
      <button className="mobile-menu-button" onClick={() => setMobileOpen(true)} aria-label="Open navigation">
        <Menu size={20} />
      </button>
      <AnimatePresence>
        {mobileOpen && (
          <motion.button
            className="sidebar-scrim"
            aria-label="Close navigation"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>
      <PremiumSidebar
        auth={auth}
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        openGroup={openGroup}
        setOpenGroup={setOpenGroup}
        setCollapsed={setCollapsed}
      />
      <div className="workspace-container">
        <MobileHeader
          auth={auth}
          current={current}
          unreadCount={unreadCount}
          onNotifications={() => setNotificationOpen(value => !value)}
        />
        <header className="dashboard-topbar">
          <div className="topbar-title">
            <button className="topbar-icon mobile-only" onClick={() => setMobileOpen(true)} aria-label="Open navigation">
              <Menu size={18} />
            </button>
            <div>
              <p>Workspace / {current.title}</p>
              <h1>{current.title}</h1>
              <span>{current.sub}</span>
            </div>
          </div>
          <div className="topbar-actions">
            <label className="topbar-search">
              <Search size={18} />
              <input placeholder="Search plans, subjects, resources..." />
            </label>
            <button className="topbar-pill"><CalendarDays size={16} /> Today</button>
            <div className="notification-anchor">
              <button className="topbar-icon notification-button" onClick={() => setNotificationOpen(value => !value)} aria-label="Notifications">
                <Bell size={18} />
                {unreadCount > 0 && <span>{unreadCount}</span>}
              </button>
              <AnimatePresence>
                {notificationOpen && (
                  <motion.div className="notification-popover" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}>
                    <div className="notification-popover__top">
                      <strong>Notifications</strong>
                      <button type="button" className="secondary" onClick={generateSmartNotifications}>Refresh</button>
                    </div>
                    <div className="notification-list">
                      {notifications.slice(0, 6).map(item => (
                        <article key={item.id} className={item.is_read ? "is-read" : ""}>
                          <strong>{item.title}</strong>
                          <p>{item.message}</p>
                        </article>
                      ))}
                      {!notifications.length && <p className="empty">No reminders yet. Generate smart notifications after adding exams or weak topics.</p>}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <button className="topbar-icon" onClick={auth.toggleTheme} aria-label="Toggle theme">
              {auth.theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
            </button>
            <div className="topbar-profile">
              <UserCircle size={20} />
              <span>{auth.username || "Student"}</span>
            </div>
          </div>
        </header>
        <main className="main dashboard-main">
          <Routes>
            <Route path="/"          element={<LazyPage><PlanningDashboard /></LazyPage>} />
            <Route path="/subjects"  element={<Subjects />} />
            <Route path="/planner"   element={<LazyPage><SmartScheduleGenerator /></LazyPage>} />
            <Route path="/resources" element={<LazyPage><Resources /></LazyPage>} />
            <Route path="/quiz"      element={<Quiz />} />
            <Route path="/mock-tests" element={<MockTests />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/wellness"  element={<Wellness />} />
            <Route path="/groups"    element={<StudyGroups />} />
            <Route path="/assistant" element={<Assistant />} />
            <Route path="/focus"     element={<LazyPage><FocusModePage /></LazyPage>} />
            <Route path="/pomodoro"  element={<LazyPage><FocusModePage /></LazyPage>} />
            <Route path="/exam-command" element={<LazyPage><ExamCommandCenter /></LazyPage>} />
            <Route path="/study-dna"        element={<StudyDnaPage />} />
            <Route path="/time-machine"     element={<TimeMachinePage />} />
            <Route path="/brain-energy"     element={<BrainEnergyPage />} />
            <Route path="/knowledge-map"    element={<KnowledgeMapPage />} />
            <Route path="/mentor-room"      element={<LazyPage><MentorRoomWorkspace /></LazyPage>} />
            <Route path="/focus-arena"      element={<FocusArenaPage />} />
            <Route path="/memory-vault"     element={<MemoryVaultPage />} />
            <Route path="/study-universe"   element={<StudyUniversePage />} />
            <Route path="/habit-lab"        element={<HabitLabPage />} />
            <Route path="/exam-war-room"    element={<ExamWarRoomPage />} />
            <Route path="/career-simulator" element={<CareerSimulatorPage />} />
            <Route path="/analytics-lab"    element={<AnalyticsLabPage />} />
            <Route path="/study-clone"      element={<StudyClonePage />} />
          </Routes>
        </main>
        <footer className="workspace-footer">
          <p>Created by Krunal Patil and Kush Panchal || All rights reserved || Copyright 2026</p>
        </footer>
        <AnimatePresence>
          {toast && <motion.div className="toast" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }}>{toast}</motion.div>}
        </AnimatePresence>
        <InstallPrompt />
      </div>
      <MobileBottomNav />
      <FloatingAIAssistant />
    </div>
  );
}

// ── Lazy page wrapper with timeout ────────────────────────────────────────────

function MobileHeader({ auth, current, unreadCount, onNotifications }) {
  return (
    <header className="mobile-app-header">
      <div className="mobile-app-header__brand">
        <span><Brain size={18} /></span>
        <div>
          <strong>{current.title}</strong>
          <small>AI Study Planner</small>
        </div>
      </div>
      <div className="mobile-app-header__actions">
        <button type="button" aria-label="Notifications" onClick={onNotifications}>
          <Bell size={18} />
          {unreadCount > 0 && <i>{unreadCount}</i>}
        </button>
        <button type="button" aria-label="Toggle theme" onClick={auth.toggleTheme}>
          {auth.theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
        </button>
        <span className="mobile-app-header__profile" aria-label="Profile">
          <UserCircle size={19} />
        </span>
      </div>
    </header>
  );
}

function MobileBottomNav() {
  return (
    <nav className="mobile-bottom-nav" aria-label="Primary mobile navigation">
      {mobileNavItems.map(item => {
        const Icon = item.icon;
        return (
          <NavLink key={item.to} to={item.to} end={item.to === "/"}>
            {({ isActive }) => (
              <motion.span
                className={isActive ? "is-active" : ""}
                whileTap={{ scale: 0.94 }}
                transition={{ duration: 0.16 }}
              >
                <Icon size={19} />
                <small>{item.label}</small>
              </motion.span>
            )}
          </NavLink>
        );
      })}
    </nav>
  );
}

function InstallPrompt() {
  const [installEvent, setInstallEvent] = useState(null);
  const [visible, setVisible] = useState(false);
  const [remindersEnabled, setRemindersEnabled] = useState(() => localStorage.getItem("study-reminders") === "on");

  useEffect(() => {
    function handleBeforeInstallPrompt(event) {
      event.preventDefault();
      setInstallEvent(event);
      if (localStorage.getItem("pwa-install-dismissed") !== "true") setVisible(true);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  }, []);

  useEffect(() => {
    if (!remindersEnabled || !("Notification" in window)) return;
    const id = setInterval(() => {
      if (document.visibilityState === "hidden" && Notification.permission === "granted") {
        new Notification("AI Study Planner", {
          body: "Time for a quick revision check-in.",
          icon: "/icons/icon.svg",
          badge: "/icons/icon.svg",
        });
      }
    }, 1000 * 60 * 60 * 4);
    return () => clearInterval(id);
  }, [remindersEnabled]);

  async function installApp() {
    if (!installEvent) return;
    installEvent.prompt();
    await installEvent.userChoice;
    setInstallEvent(null);
    setVisible(false);
  }

  async function enableReminders() {
    if (!("Notification" in window)) return;
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      localStorage.setItem("study-reminders", "on");
      setRemindersEnabled(true);
    }
  }

  function dismiss() {
    localStorage.setItem("pwa-install-dismissed", "true");
    setVisible(false);
  }

  if (!visible && remindersEnabled) return null;

  return (
    <AnimatePresence>
      {(visible || !remindersEnabled) && (
        <motion.aside
          className="pwa-install-card"
          initial={{ opacity: 0, y: 18, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 18, scale: 0.98 }}
        >
          <div>
            <strong>Install AI Study Planner</strong>
            <p>Use it like a mobile app with offline access and study reminders.</p>
          </div>
          <div className="pwa-install-card__actions">
            {installEvent && <button type="button" onClick={installApp}>Install</button>}
            {!remindersEnabled && <button type="button" className="secondary" onClick={enableReminders}>Reminders</button>}
            <button type="button" className="secondary" onClick={dismiss}>Later</button>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

function PremiumSidebar({ auth, collapsed, mobileOpen, openGroup, setOpenGroup, setCollapsed }) {
  return (
    <motion.aside
      className={`sidebar premium-sidebar ${mobileOpen ? "is-open" : ""}`}
      initial={false}
      animate={{ width: collapsed ? 92 : 304 }}
      transition={{ type: "spring", stiffness: 320, damping: 34 }}
    >
      <div className="sidebar-orb" />
      <div className="sidebar-brand-row">
        <div className="brand-mark"><Brain size={24} /></div>
        <AnimatePresence initial={false}>
          {!collapsed && (
            <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} className="brand-copy">
              <strong>AI Study Planner</strong>
              <span>Plan. Focus. Achieve.</span>
            </motion.div>
          )}
        </AnimatePresence>
        <button className="sidebar-close mobile-only" onClick={() => document.querySelector(".sidebar-scrim")?.click()} aria-label="Close navigation">
          <X size={18} />
        </button>
      </div>

      <button className="collapse-button" onClick={() => setCollapsed(!collapsed)} title={collapsed ? "Expand sidebar" : "Collapse sidebar"}>
        {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
        {!collapsed && <span>Collapse</span>}
      </button>

      <nav className="premium-nav">
        {navGroups.map((group) => (
          <NavGroup
            key={group.label}
            group={group}
            collapsed={collapsed}
            isOpen={openGroup === group.label}
            onToggle={() => setOpenGroup(openGroup === group.label ? "" : group.label)}
          />
        ))}
        <NavGroup
          group={{
            label: "More",
            icon: Settings,
            items: [
              { label: "Settings", to: "/", icon: Settings },
              { label: "Notifications", to: "/", icon: Bell },
              { label: `Theme: ${auth.theme === "light" ? "Dark" : "Light"}`, action: auth.toggleTheme, icon: auth.theme === "light" ? Moon : Sun },
              { label: "Logout", action: auth.logout, icon: LogOut },
            ],
          }}
          collapsed={collapsed}
          isOpen={openGroup === "More"}
          onToggle={() => setOpenGroup(openGroup === "More" ? "" : "More")}
        />
      </nav>
    </motion.aside>
  );
}

function NavGroup({ group, collapsed, isOpen, onToggle }) {
  const location = useLocation();
  const Icon = group.icon;
  const isActive = group.to === location.pathname || group.items?.some(item => item.to === location.pathname);

  if (group.type === "link") {
    return (
      <NavLink to={group.to} end className={({ isActive }) => `premium-nav-link ${isActive ? "is-active" : ""}`} title={collapsed ? group.label : undefined}>
        <Icon size={19} />
        {!collapsed && <span>{group.label}</span>}
      </NavLink>
    );
  }

  return (
    <div className={`premium-nav-group ${isActive ? "has-active" : ""}`}>
      <button className="premium-nav-trigger" onClick={onToggle} title={collapsed ? group.label : undefined}>
        <Icon size={19} />
        {!collapsed && (
          <>
            <span>{group.label}</span>
            <motion.i animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}><ChevronDown size={16} /></motion.i>
          </>
        )}
      </button>
      <AnimatePresence initial={false}>
        {isOpen && !collapsed && (
          <motion.div
            className="premium-subnav"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
          >
            {group.items.map((item) => {
              const ItemIcon = item.icon;
              if (item.action) {
                return (
                  <button key={item.label} className="premium-subnav-link" onClick={item.action}>
                    <ItemIcon size={16} />
                    <span>{item.label}</span>
                  </button>
                );
              }
              return (
                <NavLink key={item.label} to={item.to} className={({ isActive }) => `premium-subnav-link ${isActive ? "is-active" : ""}`}>
                  <ItemIcon size={16} />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function RouteSkeleton({ message = "Preparing your study workspace..." }) {
  return (
    <div className="route-skeleton">
      <div className="route-skeleton__pulse" />
      <p>{message}</p>
    </div>
  );
}

function LoaderTimeoutUi({ onRetry, details }) {
  return (
    <div className="route-skeleton">
      <p className="error" style={{ marginBottom: 12 }}>Unable to load workspace</p>
      {details && <pre style={{ whiteSpace: "pre-wrap", textAlign: "left", fontSize: "0.8rem" }}>{details}</pre>}
      <div style={{ display: "flex", gap: 12, marginTop: 12, flexWrap: "wrap" }}>
        <button onClick={onRetry}>Retry</button>
        <button className="secondary" onClick={() => window.location.reload()}>Refresh</button>
      </div>
    </div>
  );
}

function useTimeoutOnce(ms) {
  const [timedOut, setTimedOut] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setTimedOut(true), ms);
    return () => clearTimeout(t);
  }, [ms]);
  return timedOut;
}

function LazyPage({ children }) {
  return (
    <ErrorBoundary>
      <Suspense fallback={<RouteSkeleton />}>
        {children}
      </Suspense>
    </ErrorBoundary>
  );
}

// Global sync error handling for asset/chunk failures
window.addEventListener('error', (event) => {
  if (event.message?.includes('Loading chunk') || event.message?.includes('ChunkLoadError')) {
    console.warn("Script load error detected, triggering workspace refresh.");
    window.location.reload();
  }
}, true);

// Global async error handling
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled Promise Rejection:', event.reason);
  if (event.reason?.name === 'ChunkLoadError' || event.reason?.message?.includes('Loading chunk')) {
    window.location.reload(true);
  }
});

// ── Nav item ──────────────────────────────────────────────────────────────────

function NavItem({ to, icon, label }) {
  return (
    <NavLink to={to} end className={({ isActive }) => isActive ? "active" : ""}>
      {icon}{label}
    </NavLink>
  );
}

// ── Auth page ─────────────────────────────────────────────────────────────────

function AuthPage({ mode, auth }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", email: "", password: "", confirm_password: "", full_name: "" });
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const passwordScore = getPasswordScore(form.password);

  async function submit(event) {
    event.preventDefault();
    setError("");
    if (mode === "register") {
      if (form.password !== form.confirm_password) {
        setError("Passwords do not match.");
        return;
      }
      if (passwordScore < 3) {
        setError("Use a stronger password with at least 8 characters, a number, and a symbol.");
        return;
      }
    }
    setSubmitting(true);
    try {
      if (mode === "register") {
        await api.post("/auth/register/", {
          username: form.username,
          email: form.email,
          full_name: form.full_name,
          password: form.password,
          confirm_password: form.confirm_password,
        });
      }
      const { data } = await api.post("/auth/token/", { username: form.username, password: form.password });
      auth.login(data.access, data.refresh, form.username);
      navigate("/");
    } catch (err) {
      const status = err.response?.status;
      const data = err.response?.data;

      if (status === 401) {
        setError("Login failed: You entered a wrong password or username.");
      } else if (status === 404) {
        setError("Login failed: This user does not exist.");
      } else if (data && typeof data === "object") {
        // Handle field-specific errors from Django (e.g., username already exists)
        const firstError = Object.values(data)[0];
        setError(Array.isArray(firstError) ? firstError[0] : JSON.stringify(firstError));
      } else {
        setError(err.message || "An unexpected error occurred. Please try again.");
      }

      console.error("Auth error:", err.response || err);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth">
      <section className="auth-showcase" aria-hidden="true">
        <div className="auth-orbit auth-orbit--one" />
        <div className="auth-orbit auth-orbit--two" />
        <div className="auth-brand-lockup">
          <div className="brand-mark"><Brain size={28} /></div>
          <span>IntelliStudy AI</span>
        </div>
        <h1>{mode === "register" ? "Build a smarter study operating system." : "Return to your command center."}</h1>
        <p>Personalized plans, exam risk signals, focus analytics, and an AI mentor that adapts to your progress.</p>
        <div className="auth-feature-grid">
          <span><Sparkles size={16} /> AI insights</span>
          <span><BarChart3 size={16} /> Readable analytics</span>
          <span><ShieldCheck size={16} /> Exam strategy</span>
        </div>
      </section>
      <form className="panel auth-panel" onSubmit={submit}>
        <span className="auth-kicker">{mode === "register" ? "Start free" : "Secure workspace"}</span>
        <h1>{mode === "register" ? "Create study account" : "Welcome back"}</h1>
        <p>{mode === "register" ? "Set your baseline and let the planner adapt from day one." : "Pick up your plans, weak topics, and AI recommendations."}</p>
        {mode === "register" && (
          <div className="auth-field-grid">
            <input required placeholder="Full name" value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} />
            <input required type="email" placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
          </div>
        )}
        <input required placeholder="Username" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} />
        <label className="password-field">
          <input required type={showPassword ? "text" : "password"} placeholder="Password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
          <button type="button" onClick={() => setShowPassword(v => !v)} aria-label={showPassword ? "Hide password" : "Show password"}>
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </label>
        {mode === "register" && (
          <>
            <input required type={showPassword ? "text" : "password"} placeholder="Confirm password" value={form.confirm_password} onChange={e => setForm({ ...form, confirm_password: e.target.value })} />
            <div className="password-strength" data-score={passwordScore}>
              <span><i /><i /><i /><i /></span>
              <b>{["Too weak", "Weak", "Fair", "Strong", "Excellent"][passwordScore]}</b>
            </div>
            {form.confirm_password && form.password !== form.confirm_password && <p className="auth-validation">Passwords must match.</p>}
          </>
        )}
        {error && <p className="error">{error}</p>}
        <button disabled={submitting}>
          {submitting && <Loader2 size={18} className="spin-icon" />}
          {mode === "register" ? "Register" : "Login"}
        </button>
        <NavLink to={mode === "register" ? "/login" : "/register"}>
          {mode === "register" ? "Already have an account?" : "Create a new account"}
        </NavLink>
        {mode === "login" && <NavLink to="/forgot-password">Forgot password?</NavLink>}
      </form>
    </div>
  );
}

function getPasswordScore(password) {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  return score;
}

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [resetLink, setResetLink] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    setFeedback(null);
    setResetLink("");
    try {
      const { data } = await api.post("/auth/password-reset/", { email });
      setFeedback({ type: "success", text: data.detail || "Reset instructions are ready." });
      if (data.uid && data.token) {
        setResetLink(`/reset-password?uid=${encodeURIComponent(data.uid)}&token=${encodeURIComponent(data.token)}`);
      }
    } catch (err) {
      setFeedback({ type: "error", text: formatApiError(err, "Could not prepare password reset.") });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth auth-single">
      <form className="panel auth-panel" onSubmit={submit}>
        <span className="auth-kicker">Account recovery</span>
        <h1>Reset password</h1>
        <p>Enter your account email. In development, the reset link is shown here after verification.</p>
        <input required type="email" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} />
        <button disabled={loading}>{loading && <Loader2 size={18} className="spin-icon" />} {loading ? "Preparing..." : "Prepare reset link"}</button>
        {feedback && <p className={`auth-alert auth-alert--${feedback.type}`}>{feedback.text}</p>}
        {resetLink && <NavLink className="reset-link-chip" to={resetLink}>Open secure reset page</NavLink>}
        <NavLink to="/login">Back to login</NavLink>
      </form>
    </div>
  );
}

function ResetPasswordPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ password: "", confirm_password: "" });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const uid = params.get("uid") || "";
  const token = params.get("token") || "";
  const score = getPasswordScore(form.password);

  async function submit(event) {
    event.preventDefault();
    setMessage("");
    if (form.password !== form.confirm_password) {
      setMessage("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post("/auth/password-reset/confirm/", { uid, token, ...form });
      setMessage(data.detail || "Password reset successful.");
      setTimeout(() => navigate("/login"), 1200);
    } catch (err) {
      setMessage(formatApiError(err, "Reset link is invalid or expired."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth auth-single">
      <form className="panel auth-panel" onSubmit={submit}>
        <span className="auth-kicker">Secure reset</span>
        <h1>Choose new password</h1>
        <p>Create a stronger password to protect your study workspace.</p>
        <input required type="password" placeholder="New password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
        <input required type="password" placeholder="Confirm new password" value={form.confirm_password} onChange={e => setForm({ ...form, confirm_password: e.target.value })} />
        <div className="password-strength" data-score={score}><span><i /><i /><i /><i /></span><b>{["Too weak", "Weak", "Fair", "Strong", "Excellent"][score]}</b></div>
        <button disabled={loading || !uid || !token}>{loading && <Loader2 size={18} className="spin-icon" />} Reset password</button>
        {message && <p className={message.toLowerCase().includes("success") ? "success" : "error"}>{message}</p>}
        <NavLink to="/login">Back to login</NavLink>
      </form>
    </div>
  );
}

// ── Subjects ──────────────────────────────────────────────────────────────────

function Subjects() {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", exam_date: "", difficulty: "", priority: "", confidence: 50 });
  const [topic, setTopic] = useState({ subject: "", title: "", understanding_level: "", notes: "" });
  const [subjectMessage, setSubjectMessage] = useState("");
  const [topicMessage, setTopicMessage] = useState("");

  const selectedSubject = subjects.find(subject => String(subject.id) === String(topic.subject));
  const relatedTopicSuggestions = selectedSubject
    ? SUBJECT_TOPIC_SUGGESTIONS[selectedSubject.name] || TOPIC_SUGGESTIONS
    : TOPIC_SUGGESTIONS;

  function selectTopicSubject(subjectId) {
    setTopic(current => ({ ...current, subject: subjectId, title: "" }));
    setTopicMessage("");
  }

  async function load(preferredSubjectId = "") {
    try {
      const { data } = await api.get("/subjects/");
      setSubjects(data);
      setTopic(current => {
        const preferredExists = data.some(subject => String(subject.id) === String(preferredSubjectId));
        const currentExists   = data.some(subject => String(subject.id) === String(current.subject));
        if (preferredExists) return { ...current, subject: preferredSubjectId };
        if (currentExists)   return current;
        return { ...current, subject: data[0]?.id || "" };
      });
    } catch (err) {
      console.error("Could not load subjects", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function addSubject(event) {
    event.preventDefault();
    setSubjectMessage("");
    try {
      const existingSubject = subjects.find(
        subject => subject.name.trim().toLowerCase() === form.name.trim().toLowerCase()
      );
      if (existingSubject) {
        setTopic(current => ({ ...current, subject: existingSubject.id, title: "" }));
        setSubjectMessage(`${existingSubject.name} already exists, so it is selected for weak topics.`);
        return;
      }
      const { data } = await api.post("/subjects/", form);
      setForm({ name: "", exam_date: "", difficulty: "", priority: "", confidence: 50 });
      setTopic(current => ({ ...current, subject: data.id || current.subject }));
      setSubjectMessage(`${data.name} added and selected for weak topics.`);
      await load(data.id);
    } catch (err) {
      setSubjectMessage(formatApiError(err, "Error adding subject. Please check your inputs."));
    }
  }

  async function addTopic(event) {
    event.preventDefault();
    setTopicMessage("");
    try {
      const { data } = await api.post("/weak-topics/", topic);
      setTopic({ ...topic, title: "", notes: "" });
      setTopicMessage(`${data.title} added to ${data.subject_name}.`);
      load(topic.subject);
    } catch (err) {
      setTopicMessage(formatApiError(err, "Error adding weak topic."));
    }
  }

  if (loading) return <Loading />;

  return (
    <div className="page-content subjects-workspace">
      <section className="subjects-editor">
        <form className="panel form subject-form-card" onSubmit={addSubject}>
          <div className="section-heading">
            <span className="eyebrow">Course setup</span>
            <h2>Add Subject</h2>
          </div>
          <input required list="subject-suggestions" placeholder="Subject name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          <datalist id="subject-suggestions">
            {SUBJECT_SUGGESTIONS.map(subject => <option key={subject} value={subject} />)}
          </datalist>
          <input required type="date" value={form.exam_date} onChange={e => setForm({ ...form, exam_date: e.target.value })} />
          <div className="row">
            <select required value={form.difficulty} onChange={e => setForm({ ...form, difficulty: e.target.value })}>
              <option value="" disabled>Select difficulty</option>
              <option value="low">Low difficulty</option>
              <option value="medium">Medium difficulty</option>
              <option value="high">High difficulty</option>
            </select>
            <select required value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
              <option value="" disabled>Select priority</option>
              <option value="low">Low priority</option>
              <option value="medium">Medium priority</option>
              <option value="high">High priority</option>
            </select>
          </div>
          <label className="confidence-field">Confidence <b>{form.confidence}%</b>
            <input type="range" min="0" max="100" value={form.confidence} onChange={e => setForm({ ...form, confidence: e.target.value })} />
          </label>
          {subjectMessage && <p className={isErrorMessage(subjectMessage) ? "error" : "success"}>{subjectMessage}</p>}
          <button><Plus size={18} /> Add Subject</button>
        </form>
        <form className="panel form subject-form-card" onSubmit={addTopic}>
          <div className="section-heading">
            <span className="eyebrow">Focus area</span>
            <h2>Add Weak Topic</h2>
          </div>
          <select required value={topic.subject} onChange={e => selectTopicSubject(e.target.value)}>
            <option value="" disabled>{subjects.length ? "Select subject" : "Add a subject first"}</option>
            {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <select required value={topic.title} onChange={e => setTopic({ ...topic, title: e.target.value })} disabled={!topic.subject}>
            <option value="" disabled>{topic.subject ? "Select related topic" : "Select subject first"}</option>
            {relatedTopicSuggestions.map(topicName => <option key={topicName} value={topicName}>{topicName}</option>)}
          </select>
          <select required value={topic.understanding_level} onChange={e => setTopic({ ...topic, understanding_level: e.target.value })}>
            <option value="" disabled>Select understanding level</option>
            <option value="weak">Weak understanding</option>
            <option value="medium">Medium understanding</option>
            <option value="strong">Strong understanding</option>
          </select>
          <textarea placeholder="Notes or resource link" value={topic.notes} onChange={e => setTopic({ ...topic, notes: e.target.value })} />
          {topicMessage && <p className={isErrorMessage(topicMessage) ? "error" : "success"}>{topicMessage}</p>}
          <button disabled={!subjects.length}><Plus size={18} /> Add Topic</button>
        </form>
      </section>
      <div className="list">
        {subjects.map(subject => (
          <article className="panel item" key={subject.id}>
            <div>
              <h2>{subject.name}</h2>
              <p>{subject.days_remaining} days left · {subject.difficulty} difficulty · {subject.priority} priority</p>
            </div>
            <div className="chips">
              {subject.weak_topics?.map(t => <span key={t.id}>{t.title}: {t.understanding_level}</span>)}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

// ── Planner ───────────────────────────────────────────────────────────────────

function Planner() {
  const [plan, setPlan] = useState(null);
  const [days, setDays] = useState(7);
  const [hours, setHours] = useState(2);
  const sessionsByDate = useMemo(() => {
    return (plan?.sessions || []).reduce((acc, session) => {
      acc[session.date] = [...(acc[session.date] || []), session];
      return acc;
    }, {});
  }, [plan]);

  async function generate() {
    try {
      const { data } = await api.post("/study-plans/generate/", { days, daily_hours: hours });
      setPlan(data);
    } catch (err) {
      alert("Failed to generate plan. Please check your connection.");
    }
  }

  return (
    <div className="page-content">
      <div className="toolbar panel">
        <label>Days<input type="number" min="1" max="30" value={days} onChange={e => setDays(e.target.value)} /></label>
        <label>Daily hours<input type="number" min="1" max="12" step="0.5" value={hours} onChange={e => setHours(e.target.value)} /></label>
        <button onClick={generate}><CalendarDays size={18} /> Generate Timetable</button>
      </div>
      {plan
        ? Object.entries(sessionsByDate).map(([date, sessions]) => (
          <section className="panel day" key={date}>
            <h2>{date}</h2>
            {sessions.map(session => (
              <p key={session.id} className="session">
                <Clock size={16} /> {session.start_time.slice(0, 5)}-{session.end_time.slice(0, 5)}
                <strong>{session.title}</strong>
                <span>{session.task_type}</span>
              </p>
            ))}
          </section>
        ))
        : <Empty text="Generate a plan after adding subjects. Missed tasks will be rebalanced into the next plan." />
      }
    </div>
  );
}

// ── Quiz ──────────────────────────────────────────────────────────────────────

function Quiz() {
  const [subjects, setSubjects] = useState([]);
  const [subject, setSubject] = useState("");
  const [weakTopic, setWeakTopic] = useState("");
  const [difficulty, setDifficulty] = useState("medium");
  const [questionCount, setQuestionCount] = useState(5);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [attempts, setAttempts] = useState([]);
  const [resultSaved, setResultSaved] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [revealed, setRevealed] = useState({});
  const [loadingQuiz, setLoadingQuiz] = useState(false);
  const [quizError, setQuizError] = useState("");
  const [startedAt, setStartedAt] = useState(null);
  const [timerTick, setTimerTick] = useState(0);
  const selectedSubject = subjects.find(item => String(item.id) === String(subject));
  const weakTopics = selectedSubject?.weak_topics || [];
  const answeredCount = Object.keys(answers).length;
  const correctCount = questions.filter(q => answers[q.id] === q.answer).length;
  const elapsedSeconds = startedAt ? Math.floor((Date.now() - startedAt) / 1000) : 0;
  const accuracy = questions.length ? Math.round((correctCount / questions.length) * 100) : 0;
  const activeQuestion = questions[currentQuestion];

  useEffect(() => {
    api.get("/subjects/")
      .then(res => {
        setSubjects(res.data);
        const firstSubject = res.data[0];
        setSubject(firstSubject?.id || "");
        setDifficulty(firstSubject?.difficulty || "medium");
      })
      .catch(err => console.error("Failed to load subjects for quiz", err));
    api.get("/quiz-attempts/")
      .then(res => setAttempts(Array.isArray(res.data) ? res.data : res.data.results || []))
      .catch(err => console.warn("Quiz attempts unavailable", err));
  }, []);

  useEffect(() => {
    if (!startedAt) return;
    const id = setInterval(() => setTimerTick(value => value + 1), 1000);
    return () => clearInterval(id);
  }, [startedAt]);

  useEffect(() => {
    if (!questions.length || answeredCount !== questions.length || resultSaved) return;
    const weakTopicNames = questions
      .filter(q => answers[q.id] !== q.answer)
      .map(q => q.topic_title || q.topic || selectedSubject?.weak_topics?.find(t => String(t.id) === String(weakTopic))?.title || selectedSubject?.name)
      .filter(Boolean);
    api.post("/quiz-attempts/", {
      subject: subject || null,
      weak_topic: weakTopic || null,
      difficulty,
      question_count: questions.length,
      correct_count: correctCount,
      score_percent: accuracy,
      duration_seconds: elapsedSeconds,
      weak_topics: Array.from(new Set(weakTopicNames)).slice(0, 5),
    }).then(res => {
      setAttempts(current => [res.data, ...current].slice(0, 8));
      setResultSaved(true);
    }).catch(err => console.warn("Quiz attempt save failed", err));
  }, [accuracy, answeredCount, answers, correctCount, difficulty, elapsedSeconds, questions, resultSaved, selectedSubject, subject, weakTopic]);

  function chooseSubject(subjectId) {
    const nextSubject = subjects.find(item => String(item.id) === String(subjectId));
    setSubject(subjectId);
    setWeakTopic("");
    setDifficulty(nextSubject?.difficulty || "medium");
  }

  async function generate() {
    try {
      setLoadingQuiz(true);
      setQuizError("");
      setAnswers({});
      setRevealed({});
      setCurrentQuestion(0);
      setResultSaved(false);
      const payload = { subject, weak_topic: weakTopic || null, difficulty, count: questionCount };
      const { data } = await api.post("/quizzes/generate/", payload);
      setQuestions(Array.isArray(data) && data.length ? data : buildFallbackQuiz(selectedSubject, weakTopic, difficulty));
      setStartedAt(Date.now());
    } catch (err) {
      console.error("Quiz generation failed, using fallback", err);
      setCurrentQuestion(0);
      setResultSaved(false);
      setQuestions(buildFallbackQuiz(selectedSubject, weakTopic, difficulty).slice(0, questionCount));
      setQuizError("The AI quiz service was unavailable, so a local practice set was generated.");
      setStartedAt(Date.now());
    } finally {
      setLoadingQuiz(false);
    }
  }

  function chooseAnswer(question, option) {
    setAnswers(current => ({ ...current, [question.id]: option }));
    setRevealed(current => ({ ...current, [question.id]: true }));
  }

  function retryQuiz() {
    setAnswers({});
    setRevealed({});
    setCurrentQuestion(0);
    setStartedAt(Date.now());
    setResultSaved(false);
  }

  const displayTime = `${String(Math.floor(elapsedSeconds / 60)).padStart(2, "0")}:${String(elapsedSeconds % 60).padStart(2, "0")}`;

  return (
    <div className="page-content quiz-workspace">
      <section className="panel quiz-hero">
        <div>
          <span className="eyebrow">AI Topic Quiz Engine</span>
          <h2>{selectedSubject?.name || "Select a subject"}</h2>
          <p>{weakTopic ? weakTopics.find(t => String(t.id) === String(weakTopic))?.title : "Adaptive practice based on your weak areas and subject profile."}</p>
        </div>
        <div className="quiz-meter">
          <strong>{questions.length ? `${correctCount}/${questions.length}` : "--"}</strong>
          <span>Score</span>
        </div>
      </section>

      <div className="toolbar panel quiz-toolbar">
        <select required value={subject} onChange={e => chooseSubject(e.target.value)}>
          <option value="" disabled>Select subject</option>
          {subjects.map(s => <option value={s.id} key={s.id}>{s.name}</option>)}
        </select>
        <select value={weakTopic} onChange={e => setWeakTopic(e.target.value)} disabled={!weakTopics.length}>
          <option value="">{weakTopics.length ? "Any topic" : "No weak topics"}</option>
          {weakTopics.map(topic => <option value={topic.id} key={topic.id}>{topic.title}</option>)}
        </select>
        <select value={difficulty} onChange={e => setDifficulty(e.target.value)}>
          <option value="low">Easy</option>
          <option value="medium">Medium</option>
          <option value="high">Hard</option>
        </select>
        <select value={questionCount} onChange={e => setQuestionCount(Number(e.target.value))}>
          <option value={5}>5 questions</option>
          <option value={10}>10 questions</option>
          <option value={15}>15 questions</option>
        </select>
        <button onClick={generate} disabled={!subject || loadingQuiz}><Brain size={18} /> {loadingQuiz ? "Generating..." : "Generate Quiz"}</button>
      </div>
      {quizError && <p className="planning-message">{quizError}</p>}

      {questions.length > 0 && (
        <div className="panel quiz-progress-panel">
          <div><Clock size={17} /> {displayTime}</div>
          <div className="quiz-progress-track"><span style={{ width: `${(answeredCount / questions.length) * 100}%` }} /></div>
          <strong>{answeredCount}/{questions.length} answered · {accuracy}% accuracy</strong>
          <div className="quiz-question-nav">
            {questions.map((q, index) => (
              <button type="button" key={q.id} className={`${currentQuestion === index ? "active" : ""} ${answers[q.id] ? "answered" : ""}`} onClick={() => setCurrentQuestion(index)}>
                {index + 1}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="quiz-list">
        {(activeQuestion ? [activeQuestion] : questions).map((q) => {
          const index = questions.findIndex(item => item.id === q.id);
          const selected = answers[q.id];
          const isCorrect = selected === q.answer;
          return (
            <motion.article className="panel quiz-card" key={q.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
              <div className="quiz-card-head">
                <span>Question {index + 1}</span>
                <b className={`difficulty-badge difficulty-${q.difficulty}`}>{q.difficulty}</b>
              </div>
              <h2>{q.question}</h2>
              <div className="quiz-options">
                {q.options.map(option => {
                  const state =
                    revealed[q.id] && option === q.answer ? "correct" :
                    revealed[q.id] && option === selected && option !== q.answer ? "wrong" :
                    selected === option ? "selected" : "";
                  return (
                    <button key={option} className={`quiz-option ${state}`} onClick={() => chooseAnswer(q, option)}>
                      <span>{option}</span>
                    </button>
                  );
                })}
              </div>
              {revealed[q.id] && (
                <details className={`quiz-explanation ${isCorrect ? "correct" : "wrong"}`} open>
                  <summary>{isCorrect ? "Correct answer" : "Review explanation"}</summary>
                  <p><strong>Answer:</strong> {q.answer}</p>
                  <p>{q.explanation}</p>
                </details>
              )}
            </motion.article>
          );
        })}
      </div>

      {questions.length > 0 && (
        <div className="quiz-step-actions">
          <button className="secondary" disabled={currentQuestion === 0} onClick={() => setCurrentQuestion(value => Math.max(0, value - 1))}>Previous</button>
          <button disabled={currentQuestion >= questions.length - 1} onClick={() => setCurrentQuestion(value => Math.min(questions.length - 1, value + 1))}>Next</button>
        </div>
      )}

      {questions.length > 0 && answeredCount === questions.length && (
        <motion.section className="panel quiz-complete quiz-result-modal" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}>
          <Sparkles size={28} />
          <h2>Quiz Complete</h2>
          <div className="quiz-result-stats">
            <span><strong>{accuracy}%</strong> Accuracy</span>
            <span><strong>{correctCount}/{questions.length}</strong> Score</span>
            <span><strong>{displayTime}</strong> Time</span>
          </div>
          <p>You scored {correctCount}/{questions.length}. {correctCount < questions.length ? "Review explanations and retry the weak concepts." : "Clean sweep. Move to a harder drill."}</p>
          <button onClick={retryQuiz}><RefreshCcw size={18} /> Retry Quiz</button>
        </motion.section>
      )}

      <section className="panel quiz-history-panel">
        <h2>Performance Summary</h2>
        <div className="quiz-history-grid">
          {attempts.slice(0, 4).map(attempt => (
            <article key={attempt.id}>
              <strong>{attempt.score_percent}%</strong>
              <span>{attempt.subject_name || "Quiz"} · {attempt.difficulty}</span>
              <p>{attempt.correct_count}/{attempt.question_count} correct</p>
            </article>
          ))}
          {!attempts.length && <p className="empty">Complete a quiz to track average score and improvement.</p>}
        </div>
      </section>
    </div>
  );
}

function buildFallbackQuiz(subject, weakTopicId, difficulty = "medium") {
  const topic = subject?.weak_topics?.find(item => String(item.id) === String(weakTopicId))?.title || subject?.name || "Study Skills";
  return [
    {
      id: `fallback-${Date.now()}-1`,
      difficulty,
      question: `What is the best first step when revising ${topic}?`,
      options: ["Recall the core rule before opening notes", "Skip examples", "Memorize unrelated facts", "Avoid practice questions"],
      answer: "Recall the core rule before opening notes",
      explanation: `Correct answer: Recall the core rule before opening notes. For ${topic}, active recall exposes gaps faster than passive reading. The other options avoid feedback, so they do not improve quiz performance.`,
    },
    {
      id: `fallback-${Date.now()}-2`,
      difficulty,
      question: `Which habit most improves retention for ${topic}?`,
      options: ["Spaced recall with error review", "Reading once", "Highlighting everything", "Changing topics every minute"],
      answer: "Spaced recall with error review",
      explanation: `Correct answer: Spaced recall with error review. It strengthens memory and converts repeated mistakes into revision targets.`,
    },
    {
      id: `fallback-${Date.now()}-3`,
      difficulty,
      question: `After a wrong answer in ${topic}, what should you do next?`,
      options: ["Identify the mistake pattern", "Ignore it", "Switch subjects immediately", "Only reread the question"],
      answer: "Identify the mistake pattern",
      explanation: `Correct answer: Identify the mistake pattern. The wrong options do not explain why the error happened, so they are weak recovery strategies.`,
    },
  ];
}

// ── Analytics ─────────────────────────────────────────────────────────────────

function MockTests() {
  const [subjects, setSubjects] = useState([]);
  const [config, setConfig] = useState({ subject: "", test_type: "full", difficulty: "medium", count: 12 });
  const [test, setTest] = useState(null);
  const [answers, setAnswers] = useState({});
  const [flags, setFlags] = useState({});
  const [current, setCurrent] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [remaining, setRemaining] = useState(0);
  const activeQuestion = test?.questions?.[current];

  useEffect(() => {
    api.get("/subjects/")
      .then(res => {
        setSubjects(res.data || []);
        setConfig(cfg => ({ ...cfg, subject: res.data?.[0]?.id || "" }));
      })
      .catch(err => console.error("Failed to load mock subjects", err));
  }, []);

  useEffect(() => {
    if (!test || submitted) return;
    const id = setInterval(() => {
      setRemaining(value => {
        if (value <= 1) {
          setSubmitted(true);
          return 0;
        }
        return value - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [test, submitted]);

  async function generateTest() {
    const { data } = await api.post("/mock-tests/generate/", config);
    setTest(data);
    setAnswers({});
    setFlags({});
    setCurrent(0);
    setSubmitted(false);
    setRemaining((data.duration_minutes || 30) * 60);
  }

  function scoreTest() {
    if (!test) return { score: 0, attempted: 0, correct: 0, wrong: 0, accuracy: 0, percentile: 0, weakTopics: [] };
    let score = 0;
    let correct = 0;
    let wrong = 0;
    const topicLoss = {};
    test.questions.forEach(q => {
      const answer = answers[q.id];
      if (!answer) return;
      if (answer === q.answer) {
        correct += 1;
        score += Number(q.marks_correct);
      } else {
        wrong += 1;
        score += Number(q.marks_wrong);
        topicLoss[q.topic] = (topicLoss[q.topic] || 0) + 1;
      }
    });
    const attempted = correct + wrong;
    const accuracy = attempted ? Math.round((correct / attempted) * 100) : 0;
    const percentile = Math.max(1, Math.min(99, Math.round(45 + (score / Math.max(test.total_marks, 1)) * 55)));
    const weakTopics = Object.entries(topicLoss).sort((a, b) => b[1] - a[1]).map(([topic]) => topic).slice(0, 3);
    return { score, attempted, correct, wrong, accuracy, percentile, weakTopics };
  }

  const result = scoreTest();
  const timeDisplay = `${String(Math.floor(remaining / 60)).padStart(2, "0")}:${String(remaining % 60).padStart(2, "0")}`;

  return (
    <div className="page-content mock-workspace">
      <section className="panel mock-header">
        <div>
          <span className="eyebrow">Real Exam Simulation</span>
          <h2>{test ? `${test.exam} ${test.test_type} Test` : "AI Mock Test Generator"}</h2>
          <p>{test ? `${test.questions.length} questions · ${test.total_marks} marks · negative marking ${test.negative_marking}` : "Generate a timed test with sections, navigation, flags, scoring, percentile, and AI review."}</p>
        </div>
        <div className="mock-timer"><Clock size={18} /> {test ? timeDisplay : "--:--"}</div>
      </section>

      {!test && (
        <section className="panel quiz-toolbar mock-config">
          <select value={config.subject} onChange={e => setConfig({ ...config, subject: e.target.value })}>
            <option value="">All subjects</option>
            {subjects.map(subject => <option key={subject.id} value={subject.id}>{subject.name}</option>)}
          </select>
          <select value={config.test_type} onChange={e => setConfig({ ...config, test_type: e.target.value })}>
            <option value="full">Full Length Test</option>
            <option value="topic">Topic Test</option>
            <option value="chapter">Chapter Test</option>
            <option value="weak">Weak Topic Test</option>
            <option value="pyq">Previous Year Style</option>
          </select>
          <select value={config.difficulty} onChange={e => setConfig({ ...config, difficulty: e.target.value })}>
            <option value="low">Easy</option>
            <option value="medium">Medium</option>
            <option value="high">Hard</option>
          </select>
          <select value={config.count} onChange={e => setConfig({ ...config, count: Number(e.target.value) })}>
            <option value={10}>10 Questions</option>
            <option value={15}>15 Questions</option>
            <option value={30}>30 Questions</option>
          </select>
          <button onClick={generateTest}><ShieldCheck size={18} /> Start Mock Test</button>
        </section>
      )}

      {test && !submitted && activeQuestion && (
        <section className="mock-layout">
          <aside className="panel question-navigator">
            <h2>Navigator</h2>
            <div className="nav-grid">
              {test.questions.map((q, index) => (
                <button key={q.id} className={`${index === current ? "active" : ""} ${answers[q.id] ? "answered" : ""} ${flags[q.id] ? "flagged" : ""}`} onClick={() => setCurrent(index)}>
                  {index + 1}
                </button>
              ))}
            </div>
            <button className="danger-button" onClick={() => window.confirm("Submit mock test now?") && setSubmitted(true)}>Submit Test</button>
          </aside>

          <article className="panel mock-question-card">
            <div className="quiz-card-head">
              <span>{activeQuestion.section} · {activeQuestion.type}</span>
              <b className={`difficulty-badge difficulty-${activeQuestion.difficulty}`}>{activeQuestion.difficulty}</b>
            </div>
            <h2>{activeQuestion.question}</h2>
            <div className="quiz-options">
              {activeQuestion.options.map(option => (
                <button key={option} className={`quiz-option ${answers[activeQuestion.id] === option ? "selected" : ""}`} onClick={() => setAnswers({ ...answers, [activeQuestion.id]: option })}>
                  <span>{option}</span>
                </button>
              ))}
            </div>
            <div className="mock-actions">
              <button className="secondary" onClick={() => setFlags({ ...flags, [activeQuestion.id]: !flags[activeQuestion.id] })}>
                {flags[activeQuestion.id] ? "Unflag" : "Mark for Review"}
              </button>
              <button className="secondary" disabled={current === 0} onClick={() => setCurrent(v => Math.max(0, v - 1))}>Previous</button>
              <button disabled={current === test.questions.length - 1} onClick={() => setCurrent(v => Math.min(test.questions.length - 1, v + 1))}>Next</button>
            </div>
          </article>
        </section>
      )}

      {test && submitted && (
        <section className="panel mock-results">
          <Sparkles size={30} />
          <h2>Mock Test Analysis</h2>
          <div className="stats">
            <Stat label="Score" value={`${result.score}/${test.total_marks}`} />
            <Stat label="Percentile" value={`${result.percentile}%`} />
            <Stat label="Accuracy" value={`${result.accuracy}%`} />
            <Stat label="Attempted" value={result.attempted} />
          </div>
          <div className="note">
            {result.weakTopics.length
              ? `You lost most marks in ${result.weakTopics.join(", ")}. Prioritize these before the next mock.`
              : "Strong attempt. Increase difficulty or try a full-length test next."}
          </div>
          <button onClick={() => setTest(null)}>Generate Another Test</button>
        </section>
      )}
    </div>
  );
}

function Analytics() {
  const [data, setData] = useState(null);
  const [resources, setResources] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    setError("");

    api.get("/analytics/")
      .then(res => { if (alive) setData(res.data); })
      .catch(err => { if (alive) setError(formatApiError(err, "Analytics could not be loaded. Check your connection.")); });

    api.get("/recommendations/")
      .then(res => { if (alive) setResources(res.data?.recommendations || []); })
      .catch(err => console.error("Recommendations failed", err));

    return () => { alive = false; };
  }, []);

  if (error) return <div className="rounded-lg border border-red-200 bg-white p-5 text-red-700 shadow-sm">{error}</div>;
  if (!data) return <Loading />;

  return (
    <div className="page-content">
      <div className="stats">
        <Stat label="Completion Rate" value={`${data.completion_rate}%`} />
        <Stat label="Focus Sessions"  value={data.focus_sessions} />
        <Stat label="Focus Minutes"   value={data.focus_minutes} />
        <Stat label="Streak"          value={`${data.consistency_streak} days`} />
      </div>
      <section className="grid two">
        <div className="panel">
          <h2>Study Pattern</h2>
          <div className="chart-bars">
            {data.study_patterns?.map(day => (
              <div className="bar" key={day.day}>
                <span style={{ height: `${Math.max(day.minutes, 8)}px` }} />
                <small>{day.day.slice(5)}</small>
              </div>
            ))}
          </div>
        </div>
        <div className="panel">
          <h2>Subject Performance</h2>
          {data.subject_performance?.map(subject => (
            <ProgressRow key={subject.subject} label={subject.subject} value={subject.readiness}
              detail={`${subject.study_minutes} min - quiz ${subject.quiz_average}%`} />
          ))}
        </div>
      </section>
      <section className="panel dashboard-extra">
        <h2>AI Resource Recommendations</h2>
        <div className="resource-grid">
          {resources?.length
            ? resources.map((resource, index) => (
              <article className="resource" key={`${resource.subject}-${resource.topic}-${resource.type}-${index}`}>
                <strong>{resource.title}</strong>
                <span>{resource.type}</span>
                <p>{resource.description}</p>
              </article>
            ))
            : <Empty text="Add weak topics to unlock resource recommendations." />
          }
        </div>
      </section>
    </div>
  );
}

// ── Assistant ─────────────────────────────────────────────────────────────────

function MarkdownMessage({ text }) {
  const lines = String(text || "").split("\n").filter(line => line.trim() !== "");
  return (
    <div className="markdown-message">
      {lines.map((line, index) => {
        if (line.startsWith("### ")) return <h3 key={index}>{renderInlineMarkdown(line.slice(4))}</h3>;
        if (line.startsWith("## ")) return <h2 key={index}>{renderInlineMarkdown(line.slice(3))}</h2>;
        if (line.startsWith("# ")) return <h2 key={index}>{renderInlineMarkdown(line.slice(2))}</h2>;
        if (line.trim().startsWith("*") || line.trim().startsWith("-")) {
          return <p key={index} className="markdown-bullet">{renderInlineMarkdown(line.replace(/^(\*|-)\s*/, ""))}</p>;
        }
        if (/^\d+\.\s/.test(line.trim())) {
          return <p key={index} className="markdown-step">{renderInlineMarkdown(line.replace(/^\d+\.\s*/, ""))}</p>;
        }
        return <p key={index}>{renderInlineMarkdown(line)}</p>;
      })}
    </div>
  );
}

function renderInlineMarkdown(text) {
  const parts = String(text).split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) return <strong key={index}>{part.slice(2, -2)}</strong>;
    if (part.startsWith("*") && part.endsWith("*")) return <em key={index}>{part.slice(1, -1)}</em>;
    return <Fragment key={index}>{part}</Fragment>;
  });
}

function Assistant() {
  const [messages, setMessages] = useState([
    { role: "assistant", text: "I’m your study mentor. Ask for a plan, concept explanation, quiz drill, revision strategy, or productivity coaching." },
  ]);
  const [message, setMessage]   = useState("");
  const [sending, setSending]   = useState(false);
  const [voiceMessage, setVoiceMessage] = useState("");
  const [listening, setListening] = useState(false);
  const [mentorMode, setMentorMode] = useState("exam");
  const [depth, setDepth] = useState("balanced");
  const logRef = useRef(null);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [messages]);

  async function send(event) {
    event.preventDefault();
    sendPrompt(message);
  }

  async function sendPrompt(prompt) {
    if (!prompt.trim()) return;
    const userMessage = { role: "user", text: prompt.trim() };
    setMessages(current => [...current, userMessage]);
    setMessage("");
    setSending(true);
    try {
      const { data } = await api.post("/chatbot/", { message: userMessage.text, mode: mentorMode, depth });
      setMessages(current => [...current, { role: "assistant", text: data.reply }]);
    } catch {
      setMessages(current => [...current, { role: "assistant", text: "I could not reach your mentor context right now. Try again after checking the backend." }]);
    } finally {
      setSending(false);
    }
  }

  function listen() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) { setVoiceMessage("Voice commands are not supported in this browser."); return; }
    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    setListening(true);
    setVoiceMessage("Listening...");
    const timeout = setTimeout(() => {
      try { recognition.stop(); } catch { /* noop */ }
    }, 9000);
    recognition.onresult = event => {
      const transcript = event.results?.[0]?.[0]?.transcript?.trim();
      if (!transcript) {
        setVoiceMessage("I did not catch that. Try again or type your prompt.");
        return;
      }
      setMessage(transcript);
      setVoiceMessage(`Heard: ${transcript}`);
    };
    recognition.onerror = event => {
      const permissionIssue = event.error === "not-allowed" || event.error === "service-not-allowed";
      setVoiceMessage(permissionIssue ? "Microphone permission is blocked. Enable it or use text input." : "Voice input failed. Try again or type the command.");
    };
    recognition.onend = () => {
      clearTimeout(timeout);
      setListening(false);
    };
    try {
      recognition.start();
    } catch {
      clearTimeout(timeout);
      setListening(false);
      setVoiceMessage("Voice input is already active. Wait a moment and try again.");
    }
  }

  return (
    <div className="page-content assistant-mentor-page">
      <section className="panel assistant-mentor-toolbar">
        <select value={mentorMode} onChange={event => setMentorMode(event.target.value)}>
          <option value="exam">Exam Mentor</option>
          <option value="revision">Revision Mentor</option>
          <option value="coding">Coding Mentor</option>
          <option value="productivity">Productivity Coach</option>
          <option value="quick">Quick Doubt Solver</option>
        </select>
        <select value={depth} onChange={event => setDepth(event.target.value)}>
          <option value="concise">Concise</option>
          <option value="balanced">Balanced</option>
          <option value="detailed">Detailed</option>
        </select>
        <div className="mentor-quick-prompts">
          {["How should I study today?", "Explain my weakest topic.", "Make a revision plan."].map(prompt => (
            <button type="button" key={prompt} onClick={() => sendPrompt(prompt)}>{prompt}</button>
          ))}
        </div>
      </section>
      <section className="panel chat mentor-chat-panel assistant-mentor-chat">
        <div className="chat-log mentor-chat-log" ref={logRef}>
          {messages.map((item, index) => (
            <div className={`chat-bubble ${item.role}`} key={`${item.role}-${index}`}>
              {item.role === "assistant" ? <MarkdownMessage text={item.text} /> : <p>{item.text}</p>}
            </div>
          ))}
        </div>
        <form className="chat-form mentor-inputbar" onSubmit={send}>
          <input value={message} onChange={e => setMessage(e.target.value)} placeholder="Ask: What should I study today?" />
          <button type="button" className={`secondary ${listening ? "is-listening" : ""}`} onClick={listen}><Mic size={18} /> {listening ? "Listening" : "Voice"}</button>
          <button disabled={sending}><Send size={18} /> Send</button>
        </form>
        {voiceMessage && <p className="success">{voiceMessage}</p>}
      </section>
    </div>
  );
}

// ── Wellness ──────────────────────────────────────────────────────────────────

function Wellness() {
  const [burnout, setBurnout]         = useState(null);
  const [predictions, setPredictions] = useState([]);
  const [notifications, setNotifications] = useState([]);

  async function load() {
    const [burnoutRes, predictionRes] = await Promise.all([
      api.get("/burnout/"),
      api.get("/performance-predictions/"),
    ]);
    setBurnout(burnoutRes.data);
    setPredictions(predictionRes.data?.predictions || []);
  }

  useEffect(() => { load().catch(err => console.error("Wellness failed", err)); }, []);

  async function generateNotifications() {
    const { data } = await api.post("/smart-notifications/");
    setNotifications(data);
  }

  if (!burnout) return <Loading />;

  return (
    <div className="page-content wellness-workspace">
      <section className="panel wellness-hero">
        <div>
          <span className="eyebrow">AI Burnout Detection</span>
          <h2>{burnout.productivity_health || "Wellness Monitor"}</h2>
          <p>{burnout.recommendation}</p>
        </div>
        <div className="burnout-meter" style={{ "--burnout-risk": `${burnout.risk}%` }}>
          <strong>{burnout.risk}%</strong>
          <span>Burnout risk</span>
        </div>
      </section>
      <div className="stats wellness-stats">
        <Stat label="Burnout Risk"  value={`${burnout.risk}%`} />
        <Stat label="Wellness Score" value={`${burnout.wellness_score ?? Math.max(0, 100 - burnout.risk)}%`} />
        <Stat label="Study 7d"      value={`${burnout.study_minutes_7d} min`} />
        <Stat label="Missed Tasks"  value={burnout.missed_tasks} />
        <Stat label="Active Days"   value={burnout.active_days} />
      </div>
      <section className="grid two wellness-layout">
        <div className="panel wellness-card">
          <div className="section-heading">
            <span className="eyebrow">Recovery plan</span>
            <h2>Healthy Schedule Recommendation</h2>
          </div>
          <p className="wellness-alert">{burnout.recommendation}</p>
          <div className="recovery-list">
            {(burnout.recovery_plan || []).map(item => <span key={item}>{item}</span>)}
            {!burnout.recovery_plan?.length && <span>Keep breaks scheduled and protect sleep.</span>}
          </div>
          <button onClick={generateNotifications}>Generate Smart Reminders</button>
          <div className="wellness-timeline">
            {notifications?.map(item => (
              <p className="session" key={item.id}><Clock size={16} /> <strong>{item.title}</strong> {item.message}</p>
            ))}
          </div>
        </div>
        <div className="panel wellness-card">
          <div className="section-heading">
            <span className="eyebrow">Stress indicators</span>
            <h2>Productivity Health</h2>
          </div>
          <div className="stress-grid">
            {(burnout.stress_indicators || []).map(item => <span key={item}>{item}</span>)}
            {!burnout.stress_indicators?.length && <span>No major stress pattern detected.</span>}
          </div>
          {predictions?.map(item => (
            <ProgressRow key={item.subject_id} label={item.subject} value={item.predicted_score}
              detail={`${item.confidence}% confidence - ${item.days_remaining} days left`} />
          ))}
        </div>
      </section>
    </div>
  );
}

// ── Study groups ──────────────────────────────────────────────────────────────

function StudyGroups() {
  const [groups, setGroups]           = useState([]);
  const [name, setName]               = useState("");
  const [leaderboard, setLeaderboard] = useState([]);

  async function load() {
    const { data } = await api.get("/study-groups/");
    setGroups(Array.isArray(data) ? data : []);
  }

  useEffect(() => { load().catch(err => console.error("Groups failed", err)); }, []);

  async function createGroup(event) {
    event.preventDefault();
    if (!name.trim()) return;
    await api.post("/study-groups/", { name, description: "Collaborative study team" });
    setName("");
    load();
  }

  async function showLeaderboard(groupId) {
    const { data } = await api.get(`/study-groups/${groupId}/leaderboard/`);
    setLeaderboard(data?.leaderboard || []);
  }

  return (
    <div className="page-content groups-workspace">
      <section className="panel groups-hero">
        <div>
          <span className="eyebrow">Collaborative learning</span>
          <h2>Study Groups</h2>
          <p>Build small accountability rooms, compare progress, and turn revision into a shared challenge.</p>
        </div>
        <form className="group-create" onSubmit={createGroup}>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Team name" />
          <button><Plus size={18} /> Create Group</button>
        </form>
      </section>
      <section className="grid two">
        <div className="panel group-board">
          <h2>Leaderboard</h2>
          {leaderboard.length
            ? leaderboard.map((row, index) => (
              <article className="leader-card" key={row.username}>
                <span>#{index + 1}</span>
                <div className="member-avatar">{row.username.slice(0, 1).toUpperCase()}</div>
                <div><strong>{row.username}</strong><p>{row.study_minutes} min studied</p></div>
                <b>{row.score}%</b>
              </article>
            ))
            : <Empty text="Select a group leaderboard." />
          }
        </div>
        <div className="panel group-board">
          <h2>Activity Feed</h2>
          {groups.slice(0, 4).map(group => <p className="session" key={group.id}><Users size={16} /> {group.name} is ready for a revision sprint.</p>)}
          {!groups.length && <Empty text="Create a group to start the activity feed." />}
        </div>
      </section>
      <div className="group-grid dashboard-extra">
        {groups.map(group => (
          <article className="panel group-card" key={group.id}>
            <div>
              <div className="member-stack"><span>{group.name.slice(0, 1).toUpperCase()}</span><span>AI</span><span>+</span></div>
              <h2>{group.name}</h2>
              <p>{group.member_count} member(s) - owner {group.owner_name}</p>
            </div>
            <div className="group-card__stats"><span>Challenge ready</span><b>{Math.max(1, group.member_count || 1)} active</b></div>
            <button onClick={() => showLeaderboard(group.id)}>View Leaderboard</button>
          </article>
        ))}
      </div>
    </div>
  );
}

// ── Focus mode ────────────────────────────────────────────────────────────────

function FocusMode() {
  const [summary, setSummary]           = useState(null);
  const [minutes, setMinutes]           = useState(25);
  const [left, setLeft]                 = useState(25 * 60);
  const [running, setRunning]           = useState(false);
  const [interruptions, setInterruptions] = useState(0);
  const [startedAt, setStartedAt]       = useState(null);
  const [aiRecommendation, setAiRecommendation] = useState(null);

  const loadMetadata = useCallback(async () => {
    try {
      const [summaryRes, pomodoroRes] = await Promise.all([
        api.get("/focus-summary/"),
        api.get("/pomodoro/recommendation/")
      ]);
      setSummary(summaryRes.data);
      setAiRecommendation(pomodoroRes.data);
      // Default to AI suggested minutes if available
      if (pomodoroRes.data?.focus_minutes) {
        setMinutes(pomodoroRes.data.focus_minutes);
        setLeft(pomodoroRes.data.focus_minutes * 60);
      }
    } catch (err) {
      console.error("Focus metadata failed", err);
    }
  }, []);

  useEffect(() => { loadMetadata(); }, [loadMetadata]);

  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => setLeft(value => Math.max(value - 1, 0)), 1000);
    return () => clearInterval(timer);
  }, [running]);

  async function finish(completed = true) {
    const focusedMinutes = Math.max(0, minutes - Math.ceil(left / 60));
    try {
      await api.post("/focus-sessions/", {
        planned_minutes: minutes,
        focused_minutes: focusedMinutes,
        interruptions,
        completed,
        started_at: startedAt || new Date().toISOString(),
        ended_at: new Date().toISOString(),
      });
      setRunning(false);
      setInterruptions(0);
      setStartedAt(null);
      loadMetadata();
    } catch (err) {
      alert("Could not save session.");
    }
  }

  function start() { setStartedAt(new Date().toISOString()); setRunning(true); }
  function reset(newMins) {
    setMinutes(newMins);
    setLeft(newMins * 60);
    setRunning(false);
  }

  const display = `${String(Math.floor(left / 60)).padStart(2, "0")}:${String(left % 60).padStart(2, "0")}`;

  return (
    <div className="page-content">
      <section className="panel timer">
        <div>{display}</div>
        {summary && <p className="success">Last Score: {summary.focus_score}% — {aiRecommendation?.reason || summary.recommendation}</p>}
        <div className="row">
          <button onClick={running ? () => setRunning(false) : start}>{running ? "Pause" : "Start Focus"}</button>
          <button className="secondary" onClick={() => setInterruptions(v => v + 1)}>Log Interruption ({interruptions})</button>
          <button className="secondary" onClick={() => reset(25)}>25m</button>
          <button className="secondary" onClick={() => reset(45)}>45m</button>
          <button className="secondary" title="Use AI Recommended duration" onClick={() => reset(aiRecommendation?.focus_minutes || 25)}>AI Opt</button>
          {startedAt && <button className="danger-button" onClick={() => finish(true)}>Finish</button>}
        </div>
        {aiRecommendation && <p className="empty">Break suggestion: {aiRecommendation.break_minutes} minutes after this block.</p>}
      </section>
    </div>
  );
}

// ── Shared UI primitives ──────────────────────────────────────────────────────

function Stat({ label, value }) {
  return <div className="panel stat"><span>{label}</span><strong>{value}</strong></div>;
}

function ProgressRow({ label, value, detail }) {
  return (
    <div className="progress-row">
      <div><strong>{label}</strong><span>{detail}</span></div>
      <meter min="0" max="100" value={value} />
    </div>
  );
}

function Empty({ text }) { return <p className="empty">{text}</p>; }
function Loading()       { return <p className="empty">Loading...</p>; }

// ── Mount ─────────────────────────────────────────────────────────────────────

createRoot(document.getElementById("root")).render(<App />);

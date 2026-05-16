import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  BellRing,
  Brain,
  CheckCircle2,
  Expand,
  History,
  Minimize2,
  Pause,
  Play,
  RotateCcw,
  TimerReset,
  Volume2,
} from "lucide-react";
import { api, getApiErrorMessage } from "../../services/api";

const STORAGE_KEY = "ai-study-focus-timer";

const MODES = {
  pomodoro: {
    label: "Pomodoro",
    focusMinutes: 25,
    breakMinutes: 5,
    description: "Classic sprint for revision, quizzes, and short tasks.",
  },
  deep: {
    label: "Deep Work",
    focusMinutes: 50,
    breakMinutes: 10,
    description: "Longer block for problem solving and concept work.",
  },
};

function nowMs() {
  return Date.now();
}

function createTimerState(modeKey = "pomodoro") {
  const mode = MODES[modeKey];
  return {
    modeKey,
    phase: "focus",
    durationSeconds: mode.focusMinutes * 60,
    remainingSeconds: mode.focusMinutes * 60,
    breakSeconds: mode.breakMinutes * 60,
    running: false,
    startedAt: null,
    endsAt: null,
    focusStartedAt: null,
    interruptions: 0,
  };
}

function readStoredTimer() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (!stored?.modeKey || !MODES[stored.modeKey]) return createTimerState();
    if (!stored.running || !stored.endsAt) return stored;
    return {
      ...stored,
      remainingSeconds: Math.max(0, Math.ceil((stored.endsAt - nowMs()) / 1000)),
    };
  } catch {
    return createTimerState();
  }
}

function formatTime(seconds) {
  const mins = Math.floor(Math.max(seconds, 0) / 60);
  const secs = Math.max(seconds, 0) % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function sameDate(a, b) {
  return new Date(a).toDateString() === new Date(b).toDateString();
}

function getStreak(sessions) {
  const days = new Set(
    sessions
      .filter(session => session.completed && session.started_at)
      .map(session => new Date(session.started_at).toDateString())
  );
  let streak = 0;
  const cursor = new Date();
  while (days.has(cursor.toDateString())) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function playTone() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = 740;
    gain.gain.setValueAtTime(0.001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.65);
  } catch {
    // Audio is a progressive enhancement.
  }
}

export default function FocusModePage() {
  const [timer, setTimer] = useState(readStoredTimer);
  const [summary, setSummary] = useState(null);
  const [recommendation, setRecommendation] = useState(null);
  const [history, setHistory] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [subject, setSubject] = useState("");
  const [fullscreen, setFullscreen] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(() => localStorage.getItem("focus-audio") !== "off");
  const [message, setMessage] = useState("");
  const savingRef = useRef(false);

  const selectedMode = MODES[timer.modeKey];
  const progress = Math.round(((timer.durationSeconds - timer.remainingSeconds) / Math.max(timer.durationSeconds, 1)) * 100);
  const completedToday = history.filter(session => session.completed && session.started_at && sameDate(session.started_at, new Date())).length;
  const totalFocusMinutes = history.reduce((total, session) => total + Number(session.focused_minutes || 0), 0);
  const streak = getStreak(history);
  const productivityScore = Math.max(0, Math.min(100, Math.round((completedToday * 24) + Math.min(totalFocusMinutes / 6, 40) - timer.interruptions * 4)));

  const motivationalText = useMemo(() => {
    if (timer.phase === "break") return "Break cleanly. Your next block starts sharper when recovery is real.";
    if (progress >= 80) return "Final stretch. Keep the current tab, current thought, current task.";
    if (timer.modeKey === "deep") return "Deep work rewards patience. Let the hard part stay on screen.";
    return "One sprint, one task. Simple is strong here.";
  }, [progress, timer.modeKey, timer.phase]);

  const loadFocusData = useCallback(async () => {
    try {
      const [summaryRes, recommendationRes, focusRes, subjectRes] = await Promise.allSettled([
        api.get("/focus-summary/"),
        api.get("/pomodoro/recommendation/"),
        api.get("/focus-sessions/"),
        api.get("/subjects/"),
      ]);

      if (summaryRes.status === "fulfilled") setSummary(summaryRes.value.data);
      if (recommendationRes.status === "fulfilled") setRecommendation(recommendationRes.value.data);
      if (focusRes.status === "fulfilled") {
        const rows = Array.isArray(focusRes.value.data) ? focusRes.value.data : focusRes.value.data.results || [];
        setHistory(rows);
      }
      if (subjectRes.status === "fulfilled") {
        const rows = Array.isArray(subjectRes.value.data) ? subjectRes.value.data : subjectRes.value.data.results || [];
        setSubjects(rows);
        setSubject(current => current || rows[0]?.id || "");
      }
    } catch (err) {
      setMessage(getApiErrorMessage(err, "Could not load focus data."));
    }
  }, []);

  useEffect(() => {
    loadFocusData();
  }, [loadFocusData]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(timer));
  }, [timer]);

  useEffect(() => {
    if (!timer.running) return;
    const id = setInterval(() => {
      setTimer(current => {
        if (!current.running || !current.endsAt) return current;
        return { ...current, remainingSeconds: Math.max(0, Math.ceil((current.endsAt - nowMs()) / 1000)) };
      });
    }, 1000);
    return () => clearInterval(id);
  }, [timer.running]);

  const completeFocusSession = useCallback(async (completed) => {
    if (savingRef.current || timer.phase !== "focus") return;
    savingRef.current = true;
    const focusedMinutes = completed
      ? Math.round(timer.durationSeconds / 60)
      : Math.max(0, Math.round((timer.durationSeconds - timer.remainingSeconds) / 60));
    const startedAt = timer.focusStartedAt || new Date().toISOString();
    const endedAt = new Date().toISOString();

    try {
      await api.post("/focus-sessions/", {
        subject: subject || null,
        planned_minutes: Math.round(timer.durationSeconds / 60),
        focused_minutes: focusedMinutes,
        interruptions: timer.interruptions,
        completed,
        started_at: startedAt,
        ended_at: endedAt,
      });
      await api.post("/pomodoro-sessions/", {
        subject: subject || null,
        focus_minutes: focusedMinutes || Math.round(timer.durationSeconds / 60),
        break_minutes: Math.round(timer.breakSeconds / 60),
        completed_cycles: completed ? 1 : 0,
        started_at: startedAt,
        ended_at: endedAt,
      });
      await loadFocusData();
    } catch (err) {
      setMessage(getApiErrorMessage(err, "Could not save the focus session."));
    } finally {
      savingRef.current = false;
    }
  }, [loadFocusData, subject, timer]);

  useEffect(() => {
    if (timer.remainingSeconds > 0 || !timer.running) return;
    if (audioEnabled) playTone();
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(timer.phase === "focus" ? "Focus block complete" : "Break complete", {
        body: timer.phase === "focus" ? "Your break timer started automatically." : "Ready for the next focus block.",
        icon: "/icons/icon.svg",
      });
    }

    if (timer.phase === "focus") {
      completeFocusSession(true);
      setTimer(current => ({
        ...current,
        phase: "break",
        durationSeconds: current.breakSeconds,
        remainingSeconds: current.breakSeconds,
        running: true,
        startedAt: nowMs(),
        endsAt: nowMs() + current.breakSeconds * 1000,
      }));
    } else {
      setTimer(current => ({
        ...createTimerState(current.modeKey),
        running: false,
      }));
    }
  }, [audioEnabled, completeFocusSession, timer.phase, timer.remainingSeconds, timer.running]);

  function selectMode(modeKey) {
    if (timer.running) return;
    setTimer(createTimerState(modeKey));
  }

  function start() {
    setMessage("");
    setTimer(current => {
      const remaining = current.remainingSeconds || current.durationSeconds;
      return {
        ...current,
        running: true,
        startedAt: nowMs(),
        endsAt: nowMs() + remaining * 1000,
        focusStartedAt: current.focusStartedAt || new Date().toISOString(),
      };
    });
  }

  function pause() {
    setTimer(current => ({
      ...current,
      running: false,
      endsAt: null,
    }));
  }

  function reset() {
    setTimer(createTimerState(timer.modeKey));
  }

  async function finishEarly() {
    await completeFocusSession(false);
    setTimer(createTimerState(timer.modeKey));
  }

  async function requestNotifications() {
    if (!("Notification" in window)) {
      setMessage("Browser notifications are not supported here.");
      return;
    }
    const permission = await Notification.requestPermission();
    setMessage(permission === "granted" ? "Focus notifications enabled." : "Notifications were not enabled.");
  }

  function toggleAudio() {
    setAudioEnabled(current => {
      localStorage.setItem("focus-audio", current ? "off" : "on");
      return !current;
    });
  }

  async function toggleFullscreen() {
    setFullscreen(value => !value);
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen?.();
      } else {
        await document.exitFullscreen?.();
      }
    } catch {
      // In-app fullscreen styling still applies if browser fullscreen is blocked.
    }
  }

  return (
    <div className={`focus-workspace page-content ${fullscreen ? "is-fullscreen" : ""}`}>
      <section className="panel focus-hero">
        <div>
          <span className="eyebrow"><TimerReset size={14} /> Deep focus mode</span>
          <h2>{selectedMode.label} Timer</h2>
          <p>{selectedMode.description}</p>
        </div>
        <div className="focus-mode-toggle" aria-label="Focus mode">
          {Object.entries(MODES).map(([key, mode]) => (
            <button type="button" className={timer.modeKey === key ? "is-active" : ""} disabled={timer.running} onClick={() => selectMode(key)} key={key}>
              {mode.label}
            </button>
          ))}
        </div>
      </section>

      {message && <p className={message.toLowerCase().includes("could") ? "error planning-message" : "success planning-message"}>{message}</p>}

      <section className="focus-layout">
        <div className="panel focus-timer-card">
          <div className="focus-ring" style={{ "--focus-progress": `${progress}%` }}>
            <span>{timer.phase === "break" ? "Break" : selectedMode.label}</span>
            <strong>{formatTime(timer.remainingSeconds)}</strong>
            <small>{progress}% complete</small>
          </div>
          <p className="focus-motivation">{motivationalText}</p>
          <div className="focus-controls">
            <button type="button" onClick={timer.running ? pause : start}>
              {timer.running ? <Pause size={18} /> : <Play size={18} />}
              {timer.running ? "Pause" : "Start"}
            </button>
            <button type="button" className="secondary" onClick={reset}><RotateCcw size={18} /> Reset</button>
            <button type="button" className="secondary" onClick={() => setTimer(current => ({ ...current, interruptions: current.interruptions + 1 }))}>Interruption {timer.interruptions}</button>
            {timer.focusStartedAt && timer.phase === "focus" && <button type="button" className="danger-button" onClick={finishEarly}>Finish</button>}
          </div>
        </div>

        <aside className="focus-side">
          <section className="panel focus-settings">
            <div className="planning-section-title">
              <h2>Session Setup</h2>
              <Brain size={18} />
            </div>
            <label>Subject
              <select value={subject} onChange={event => setSubject(event.target.value)}>
                <option value="">No subject</option>
                {subjects.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
            </label>
            <div className="focus-quick-actions">
              <button type="button" className="secondary" onClick={requestNotifications}><BellRing size={16} /> Notifications</button>
              <button type="button" className="secondary" onClick={toggleAudio}><Volume2 size={16} /> {audioEnabled ? "Audio on" : "Audio off"}</button>
              <button type="button" className="secondary" onClick={toggleFullscreen}>{fullscreen ? <Minimize2 size={16} /> : <Expand size={16} />} Focus UI</button>
            </div>
            {recommendation && <p className="focus-ai-note">{recommendation.reason} Suggested: {recommendation.focus_minutes}m focus, {recommendation.break_minutes}m break.</p>}
          </section>

          <section className="focus-stats">
            <article className="panel stat"><span>Study Streak</span><strong>{streak} days</strong></article>
            <article className="panel stat"><span>Total Focus</span><strong>{(totalFocusMinutes / 60).toFixed(1)}h</strong></article>
            <article className="panel stat"><span>Productivity</span><strong>{productivityScore}%</strong></article>
            <article className="panel stat"><span>Today</span><strong>{completedToday}</strong></article>
          </section>
        </aside>
      </section>

      <section className="panel focus-history">
        <div className="planning-section-title">
          <h2>Session History</h2>
          <History size={18} />
        </div>
        <div className="focus-history-list">
          {history.slice(0, 8).map(session => (
            <article key={session.id}>
              <CheckCircle2 size={17} />
              <div>
                <strong>{session.focused_minutes} of {session.planned_minutes} min</strong>
                <span>{new Date(session.started_at).toLocaleString()} · {session.interruptions} interruption(s)</span>
              </div>
              <b>{session.completed ? "Completed" : "Partial"}</b>
            </article>
          ))}
          {!history.length && <p className="empty">Complete a focus block to build history, streaks, and productivity scoring.</p>}
        </div>
      </section>

      {(timer.running || timer.focusStartedAt) && (
        <aside className="focus-mini-timer">
          <span>{timer.phase === "break" ? "Break" : selectedMode.label}</span>
          <strong>{formatTime(timer.remainingSeconds)}</strong>
          <button type="button" onClick={timer.running ? pause : start} aria-label={timer.running ? "Pause timer" : "Start timer"}>
            {timer.running ? <Pause size={16} /> : <Play size={16} />}
          </button>
        </aside>
      )}
    </div>
  );
}

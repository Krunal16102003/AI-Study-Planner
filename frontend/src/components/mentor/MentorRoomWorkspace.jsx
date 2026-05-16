import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  Brain,
  CheckCircle2,
  Clock,
  Code2,
  Lightbulb,
  Mic,
  Pin,
  RefreshCw,
  Send,
  ShieldCheck,
  Sparkles,
  Target,
  Zap,
} from "lucide-react";
import { api, getApiErrorMessage } from "../../services/api";

const mentorModes = [
  { id: "exam", label: "Exam Mentor", icon: ShieldCheck },
  { id: "revision", label: "Revision Mentor", icon: RefreshCw },
  { id: "coding", label: "Coding Mentor", icon: Code2 },
  { id: "productivity", label: "Productivity Coach", icon: Activity },
  { id: "quick", label: "Quick Doubt", icon: Zap },
];

const quickPrompts = [
  "How should I study today?",
  "Explain my weakest topic step by step.",
  "Create a revision plan for this week.",
  "Am I overloading my schedule?",
];

function renderMentorMarkdown(text) {
  const lines = String(text || "").split("\n");
  return lines.map((line, index) => {
    if (line.startsWith("### ")) return <h3 key={index}>{renderInline(line.slice(4))}</h3>;
    if (line.startsWith("**") && line.endsWith("**")) return <strong key={index}>{line.slice(2, -2)}</strong>;
    if (/^\d+\.\s/.test(line.trim())) return <p key={index} className="mentor-step">{renderInline(line.replace(/^\d+\.\s*/, ""))}</p>;
    if (line.trim().startsWith("-")) return <p key={index} className="mentor-bullet">{renderInline(line.replace(/^-\s*/, ""))}</p>;
    if (!line.trim()) return <br key={index} />;
    return <p key={index}>{renderInline(line)}</p>;
  });
}

function renderInline(text) {
  return String(text).split(/(\*\*[^*]+\*\*)/g).map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) return <strong key={index}>{part.slice(2, -2)}</strong>;
    return <Fragment key={index}>{part}</Fragment>;
  });
}

export default function MentorRoomWorkspace() {
  const [room, setRoom] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([
    { role: "assistant", content: "I’m ready to mentor from your schedule, weak topics, quiz attempts, focus history, and burnout signals." },
  ]);
  const [mode, setMode] = useState("exam");
  const [depth, setDepth] = useState("balanced");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const logRef = useRef(null);

  const weekly = room?.weekly_review || {};
  const health = room?.study_health || {};
  const daily = room?.daily_guidance || {};

  const readiness = useMemo(() => {
    const strongest = weekly.strongest_subject?.readiness || 0;
    const weakest = weekly.weakest_subject?.readiness || 0;
    return strongest || weakest ? Math.round((strongest + weakest) / (weakest ? 2 : 1)) : 0;
  }, [weekly]);

  useEffect(() => {
    loadRoom();
  }, []);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [messages, sending]);

  async function loadRoom() {
    setLoading(true);
    setError("");
    try {
      const [roomRes, conversationsRes] = await Promise.all([
        api.get("/mentor-room/"),
        api.get("/mentor-conversations/"),
      ]);
      setRoom(roomRes.data);
      const rows = Array.isArray(conversationsRes.data) ? conversationsRes.data : conversationsRes.data.results || [];
      setConversations(rows);
      if (rows[0]) {
        setConversationId(rows[0].id);
        setMessages(rows[0].messages?.length ? rows[0].messages.map(item => ({ role: item.role, content: item.content })) : messages);
      }
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not load mentor room."));
    } finally {
      setLoading(false);
    }
  }

  async function sendMentorMessage(prompt = input) {
    const text = prompt.trim();
    if (!text || sending) return;
    setInput("");
    setSending(true);
    setMessages(current => [...current, { role: "user", content: text }, { role: "assistant", content: "" }]);

    try {
      const token = localStorage.getItem("access");
      const response = await fetch(`${api.defaults.baseURL}/mentor-chat/stream/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ message: text, mode, depth, conversation: conversationId }),
      });
      if (!response.ok || !response.body) throw new Error("Stream unavailable");
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const chunks = buffer.split("\n\n");
        buffer = chunks.pop() || "";
        for (const chunk of chunks) {
          const raw = chunk.replace(/^data:\s*/, "");
          if (!raw) continue;
          const event = JSON.parse(raw);
          if (event.type === "meta" && event.conversation_id) setConversationId(event.conversation_id);
          if (event.type === "token") {
            setMessages(current => current.map((item, index) =>
              index === current.length - 1 ? { ...item, content: item.content + event.token } : item
            ));
          }
        }
      }
      loadRoom();
    } catch {
      try {
        const { data } = await api.post("/mentor-chat/", { message: text, mode, depth, conversation: conversationId });
        setConversationId(data.conversation?.id || conversationId);
        setMessages(current => current.map((item, index) =>
          index === current.length - 1 ? { ...item, content: data.reply } : item
        ));
      } catch (err) {
        setMessages(current => current.map((item, index) =>
          index === current.length - 1 ? { ...item, content: getApiErrorMessage(err, "Mentor is unavailable right now.") } : item
        ));
      }
    } finally {
      setSending(false);
    }
  }

  function listen() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return setError("Voice input is not supported in this browser.");
    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.onresult = event => setInput(event.results?.[0]?.[0]?.transcript || "");
    recognition.start();
  }

  async function pinConversation(id) {
    const { data } = await api.post(`/mentor-conversations/${id}/pin/`);
    setConversations(current => current.map(item => item.id === id ? data : item));
  }

  if (loading) return <div className="route-skeleton"><div className="route-skeleton__pulse" /><p>Loading mentor context...</p></div>;

  return (
    <div className="mentor-workspace page-content">
      <section className="panel mentor-hero">
        <div>
          <span className="eyebrow"><Sparkles size={14} /> AI mentor system</span>
          <h2>Personal Study Mentor</h2>
          <p>Context-aware coaching from your exams, weak topics, focus sessions, quiz attempts, revision history, and wellness signals.</p>
        </div>
        <div className="mentor-readiness" style={{ "--mentor-readiness": `${readiness}%` }}>
          <strong>{readiness || "--"}%</strong>
          <span>Exam readiness</span>
        </div>
      </section>

      {error && <p className="planning-message error">{error}</p>}

      <section className="mentor-layout">
        <aside className="mentor-sidebar">
          <section className="panel mentor-card">
            <h2>Mentor Mode</h2>
            <div className="mentor-mode-list">
              {mentorModes.map(item => {
                const Icon = item.icon;
                return (
                  <button type="button" className={mode === item.id ? "is-active" : ""} key={item.id} onClick={() => setMode(item.id)}>
                    <Icon size={16} /> {item.label}
                  </button>
                );
              })}
            </div>
            <select value={depth} onChange={event => setDepth(event.target.value)}>
              <option value="concise">Concise</option>
              <option value="balanced">Balanced</option>
              <option value="detailed">Detailed</option>
            </select>
          </section>

          <section className="panel mentor-card">
            <h2>Conversations</h2>
            <div className="mentor-conversation-list">
              {conversations.slice(0, 6).map(item => (
                <button type="button" className={conversationId === item.id ? "is-active" : ""} key={item.id} onClick={() => { setConversationId(item.id); setMessages(item.messages.map(msg => ({ role: msg.role, content: msg.content }))); }}>
                  <span>{item.title}</span>
                  <Pin size={14} onClick={(event) => { event.stopPropagation(); pinConversation(item.id); }} />
                </button>
              ))}
              {!conversations.length && <p className="empty">Your mentor conversations will appear here.</p>}
            </div>
          </section>
        </aside>

        <main className="panel mentor-chat-panel">
          <div className="mentor-chat-log" ref={logRef}>
            {messages.map((message, index) => (
              <article className={`mentor-message mentor-message--${message.role}`} key={`${message.role}-${index}`}>
                <div className="mentor-avatar">{message.role === "user" ? "You" : "AI"}</div>
                <div className="mentor-bubble">
                  <div className="mentor-bubble-content">
                    {renderMentorMarkdown(message.content || (sending ? "Thinking..." : ""))}
                  </div>
                </div>
              </article>
            ))}
          </div>
          <div className="mentor-quick-prompts">
            {quickPrompts.map(prompt => <button type="button" key={prompt} onClick={() => sendMentorMessage(prompt)}>{prompt}</button>)}
          </div>
          <form className="mentor-inputbar" onSubmit={(event) => { event.preventDefault(); sendMentorMessage(); }}>
            <button type="button" className="secondary" onClick={listen} aria-label="Voice input"><Mic size={18} /></button>
            <input value={input} onChange={event => setInput(event.target.value)} placeholder="Ask for a plan, explanation, quiz, or strategy..." />
            <button disabled={sending}><Send size={18} /> Send</button>
          </form>
        </main>

        <aside className="mentor-insight-column">
          <section className="panel mentor-card">
            <div className="mentor-card-title"><Target size={18} /><h2>Daily Guidance</h2></div>
            <p>{daily.recommendation}</p>
            <strong>{daily.estimated_minutes || 45} min · {daily.priority || "medium"} priority</strong>
          </section>
          <section className="panel mentor-card">
            <div className="mentor-card-title"><Activity size={18} /><h2>Study Health</h2></div>
            <div className="mentor-health-meter"><span style={{ width: `${health.risk || 0}%` }} /></div>
            <p>{health.recommendation}</p>
          </section>
          <section className="panel mentor-card">
            <div className="mentor-card-title"><Lightbulb size={18} /><h2>Smart Insights</h2></div>
            <div className="mentor-insight-list">
              {(room?.insights || []).map(item => (
                <article className={`mentor-insight mentor-insight--${item.severity}`} key={item.title}>
                  <CheckCircle2 size={16} />
                  <div><strong>{item.title}</strong><p>{item.detail}</p></div>
                </article>
              ))}
            </div>
          </section>
          <section className="panel mentor-card">
            <div className="mentor-card-title"><Clock size={18} /><h2>Weekly Review</h2></div>
            <p>Strongest: <strong>{weekly.strongest_subject?.name || "Not enough data"}</strong></p>
            <p>Weakest: <strong>{weekly.weakest_subject?.name || "Not enough data"}</strong></p>
            <p>Focus score: <strong>{weekly.focus_score || 0}%</strong></p>
          </section>
        </aside>
      </section>
    </div>
  );
}

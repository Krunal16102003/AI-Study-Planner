import { useMemo, useState } from "react";
import {
  BadgeCheck,
  Bot,
  BriefcaseBusiness,
  CheckCircle2,
  FileText,
  Lightbulb,
  MessageSquareText,
  Send,
  Sparkles,
  UserRoundCheck,
} from "lucide-react";
import { api, getApiErrorMessage } from "../../services/api";

const modes = [
  { id: "technical", label: "Technical Round", icon: BriefcaseBusiness, detail: "Role-specific concepts and projects" },
  { id: "hr", label: "HR Round", icon: UserRoundCheck, detail: "Communication, goals, and fit" },
  { id: "case", label: "Case Study", icon: FileText, detail: "Problem solving and structured thinking" },
  { id: "behavioral", label: "Behavioral", icon: MessageSquareText, detail: "STAR stories and judgment" },
];

const features = [
  ["AI Powered", "Adaptive prompts based on your role, skill level, and answer quality.", Sparkles],
  ["Detailed Evaluation", "Get clarity, structure, confidence, and improvement feedback.", BadgeCheck],
  ["Performance History", "Track readiness signals and weak interview concepts over time.", CheckCircle2],
  ["Realistic Experience", "Practice concise, role-aligned responses in a focused interface.", Bot],
];

const questions = {
  technical: "Walk me through a project that proves you are ready for this role.",
  hr: "Tell me about yourself and why this career path fits your long-term goals.",
  case: "A study platform has low daily retention. How would you diagnose and improve it?",
  behavioral: "Describe a time you struggled with a difficult topic and how you handled it.",
};

const examples = {
  technical: "In my AI Study Planner project, I built a dashboard, AI scheduling flow, and mentor workspace. I focused on reusable React components, API integration, responsive layouts, and measurable study insights. The strongest proof is that the app connects planning, analytics, and AI feedback into one workflow.",
  hr: "I am a focused learner who enjoys building practical tools. I chose this path because I like solving real problems through clean interfaces and reliable systems. My current goal is to strengthen projects, communication, and interview readiness.",
  case: "I would first inspect activation, session frequency, completed tasks, and drop-off points. Then I would test better onboarding, daily recommendations, reminders, and progress feedback. Success would be measured by day-seven retention and completed study sessions.",
  behavioral: "When I struggled with a topic, I broke it into smaller parts, created notes, practiced questions, and reviewed mistakes. I also scheduled spaced revision so the concept stayed active instead of relying on one long session.",
};

function buildLocalEvaluation(answer) {
  const words = answer.trim().split(/\s+/).filter(Boolean).length;
  if (words < 35) {
    return "Your answer is a good start, but it needs more evidence. Add context, your specific actions, measurable result, and one lesson learned.";
  }
  if (words < 90) {
    return "Strong foundation. Improve it by making the result more concrete and linking your decision-making to the target role.";
  }
  return "Solid interview answer. Keep it concise, lead with impact, and prepare one follow-up example that proves the same skill.";
}

export default function AIMockInterviewPage() {
  const [mode, setMode] = useState("technical");
  const [answer, setAnswer] = useState("");
  const [evaluation, setEvaluation] = useState("");
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");

  const activeMode = useMemo(() => modes.find(item => item.id === mode) || modes[0], [mode]);
  const ActiveModeIcon = activeMode.icon;
  const question = questions[mode] || questions.technical;
  const characterCount = answer.length;

  async function evaluateAnswer(event) {
    event.preventDefault();
    if (!answer.trim()) return;
    setLoading(true);
    setNotice("");
    try {
      const { data } = await api.post("/career-interview/evaluate/", {
        interview_type: mode,
        question,
        answer,
      });
      setEvaluation(data?.evaluation || buildLocalEvaluation(answer));
    } catch (err) {
      setEvaluation(buildLocalEvaluation(answer));
      setNotice(getApiErrorMessage(err, "Using local interview feedback because AI evaluation is unavailable."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="ai-mock-page page-content">
      <section className="ai-mock-hero">
        <div className="ai-mock-hero__identity">
          <span className="ai-mock-logo"><Bot size={24} /></span>
          <div>
            <span className="ai-mock-eyebrow">AI career preparation</span>
            <h2>AI Mock Interview</h2>
            <p>Practice real interview scenarios with AI and improve your responses.</p>
          </div>
        </div>
        <button className="ai-mock-mode-badge" type="button">
          <ActiveModeIcon size={18} />
          {activeMode.label}
        </button>
      </section>

      <section className="ai-mock-mode-layout">
        <div className="ai-mock-mode-grid" aria-label="Interview modes">
          {modes.map(item => {
            const Icon = item.icon;
            const selected = item.id === mode;
            return (
              <button
                type="button"
                className={`ai-mock-mode-card ${selected ? "is-active" : ""}`}
                onClick={() => setMode(item.id)}
                key={item.id}
              >
                <Icon size={20} />
                <span>{item.label}</span>
                <small>{item.detail}</small>
              </button>
            );
          })}
        </div>
        <aside className="ai-mock-tip-card">
          <Lightbulb size={20} />
          <div>
            <strong>Tips</strong>
            <p>Use a clear structure: context, action, result, and what you learned. Keep answers specific.</p>
          </div>
        </aside>
      </section>

      <section className="ai-mock-question-card">
        <div className="ai-mock-avatar"><Sparkles size={20} /></div>
        <div className="ai-mock-question-body">
          <div className="ai-mock-question-meta">
            <strong>AI Interviewer</strong>
            <span>Just now</span>
          </div>
          <p>{question}</p>
        </div>
      </section>

      <form className="ai-mock-answer-panel" onSubmit={evaluateAnswer}>
        <div className="ai-mock-answer-head">
          <div>
            <span className="ai-mock-eyebrow">Your Answer</span>
            <h3>Structure your response clearly</h3>
            <p>Structure your answer clearly. You can use bullet points.</p>
          </div>
          <span className="ai-mock-counter">{characterCount}/1200</span>
        </div>
        <textarea
          value={answer}
          maxLength={1200}
          onChange={event => setAnswer(event.target.value)}
          placeholder="Write your answer here..."
        />
        <div className="ai-mock-actions">
          <div className="ai-mock-secondary-actions">
            <button type="button" onClick={() => setNotice("Tip: quantify the result and mention one trade-off you considered.")}>
              <Lightbulb size={17} /> Add Tips
            </button>
            <button type="button" onClick={() => setAnswer(examples[mode])}>
              <FileText size={17} /> Example Answer
            </button>
          </div>
          <button className="ai-mock-cta" disabled={!answer.trim() || loading}>
            <Send size={18} /> {loading ? "Evaluating..." : "Evaluate Answer"}
          </button>
        </div>
        {notice && <p className="ai-mock-notice">{notice}</p>}
        {evaluation && (
          <article className="ai-mock-evaluation">
            <span><BadgeCheck size={18} /> AI Evaluation</span>
            <p>{evaluation}</p>
          </article>
        )}
      </form>

      <section className="ai-mock-feature-grid">
        {features.map(([title, description, Icon]) => (
          <article className="ai-mock-feature-card" key={title}>
            <Icon size={21} />
            <h3>{title}</h3>
            <p>{description}</p>
          </article>
        ))}
      </section>
    </div>
  );
}

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Award,
  BellRing,
  Brain,
  CalendarClock,
  CheckCircle2,
  Flame,
  Gauge,
  Layers3,
  ListChecks,
  NotebookPen,
  RotateCcw,
  ShieldAlert,
  Sparkles,
  Target,
  TimerReset,
  WandSparkles,
  Zap,
} from "lucide-react";
import DashboardCard from "./DashboardCard";

function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Number.isFinite(value) ? value : 0));
}

function daysUntil(date) {
  if (!date) return 999;
  const today = new Date();
  const target = new Date(`${date}T00:00:00`);
  today.setHours(0, 0, 0, 0);
  return Math.ceil((target - today) / 86400000);
}

function pct(value) {
  return `${Math.round(clamp(value))}%`;
}

function uniqueWeakTopics(plans) {
  const seen = new Set();
  return plans.flatMap(plan => (plan.weakTopics || []).map(topic => ({
    id: topic.id || `${plan.id}-${topic.title}`,
    title: topic.title || "Weak topic",
    subject: plan.subjects || plan.title || "Study plan",
    priority: plan.priority,
    examDate: plan.nextExam,
    confidence: topic.confidence ?? Math.max(25, Math.round(plan.completion || 0)),
  }))).filter(topic => {
    const key = `${topic.subject}-${topic.title}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export default function AIStudyOperatingSystem({ plans = [], subjects = [], summary = {}, analytics = {}, dashboard = null }) {
  const [notesInput, setNotesInput] = useState("");
  const [notesMode, setNotesMode] = useState("summary");
  const [generatedNotes, setGeneratedNotes] = useState("");

  const intelligence = useMemo(() => {
    const weakTopics = uniqueWeakTopics(plans);
    const activePlans = plans.filter(plan => plan.statusKey !== "completed");
    const completion = summary.averageProgress || 0;
    const highPriority = plans.filter(plan => plan.priority === "high").length;
    const urgentExams = plans.filter(plan => daysUntil(plan.nextExam) <= 14).length;
    const completedSessions = summary.completedSessions || 0;
    const focusMinutes = analytics?.focus_minutes || 0;
    const consistency = analytics?.consistency_streak || 0;

    const readiness = clamp((completion * 0.48) + (completedSessions * 0.28) + (consistency * 4) - (weakTopics.length * 2.2) - (urgentExams * 4));
    const predictedScore = clamp(readiness + (completion > 65 ? 7 : -3) + Math.min(focusMinutes / 80, 8));
    const focusScore = clamp((completion * 0.36) + Math.min(focusMinutes / 5, 32) + (completedSessions * 0.38));
    const brainEnergy = clamp(82 - (urgentExams * 9) - (highPriority * 4) + Math.min(consistency * 3, 12));
    const burnoutRisk = clamp((urgentExams * 18) + (weakTopics.length * 4) + (highPriority * 7) - Math.min(focusMinutes / 18, 18));
    const retention = clamp(72 + Math.min(consistency * 3, 12) - weakTopics.length * 2);
    const xp = completedSessions * 35 + Math.round(completion * 8);
    const level = Math.max(1, Math.floor(xp / 500) + 1);
    const xpProgress = clamp((xp % 500) / 5);

    const revisionQueue = weakTopics.length ? weakTopics.slice(0, 5) : activePlans.slice(0, 5).map(plan => ({
      id: plan.id,
      title: plan.subjects || plan.title,
      subject: plan.title,
      priority: plan.priority,
      examDate: plan.nextExam,
      confidence: plan.completion,
    }));

    const subjectRadar = subjects.slice(0, 6).map(subject => {
      const linkedPlan = plans.find(plan => String(plan.subjects || "").toLowerCase().includes(String(subject.name || "").toLowerCase()));
      return {
        label: subject.name || "Subject",
        value: clamp(linkedPlan?.completion ?? subject.readiness ?? 42),
      };
    });

    const suggestions = [
      weakTopics[0] ? `Recover ${weakTopics[0].title} with a 25-minute active recall block.` : "Add weak topics to unlock recovery planning.",
      urgentExams ? "Run exam sprint mode for the next 7 days and pin two revision blocks daily." : "Protect your current rhythm with spaced repetition every other day.",
      burnoutRisk > 55 ? "Burnout risk is rising. Use one shorter focus block and one lighter review today." : "Brain energy is stable. This is a good day for a harder concept block.",
    ];

    return {
      readiness,
      predictedScore,
      focusScore,
      brainEnergy,
      burnoutRisk,
      retention,
      xp,
      level,
      xpProgress,
      revisionQueue,
      subjectRadar,
      suggestions,
      activePlans,
      urgentExams,
    };
  }, [analytics, plans, subjects, summary]);

  function generateNotes() {
    const source = notesInput.trim() || intelligence.revisionQueue[0]?.title || "your highest-priority topic";
    const templates = {
      summary: `Summary for ${source}: define the core idea, list 3 exam patterns, then close with one active recall question.`,
      flashcards: `Flashcards for ${source}: create 5 Q/A cards, include one formula card, one misconception card, and one application card.`,
      quiz: `Quiz for ${source}: generate 6 questions from easy to hard, then review mistakes immediately after scoring.`,
      formula: `Formula sheet for ${source}: group formulas by use case, write units, and add one solved trigger example.`,
    };
    setGeneratedNotes(templates[notesMode]);
  }

  return (
    <section className="ai-os-grid" aria-label="AI study operating system">
      <DashboardCard className="ai-os-copilot" title="AI Study Copilot" eyebrow="Intelligence Layer">
        <div className="ai-os-copilot__top">
          <MetricOrb label="Brain Energy" value={intelligence.brainEnergy} icon={Brain} />
          <MetricOrb label="Focus Score" value={intelligence.focusScore} icon={Zap} />
          <MetricOrb label="Burnout Risk" value={intelligence.burnoutRisk} icon={ShieldAlert} danger />
        </div>
        <div className="ai-os-suggestions">
          {intelligence.suggestions.map((suggestion, index) => (
            <motion.article key={suggestion} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }}>
              <Sparkles size={15} />
              <span>{suggestion}</span>
            </motion.article>
          ))}
        </div>
      </DashboardCard>

      <DashboardCard className="ai-os-predictor" title="AI Exam Predictor" eyebrow="Forecast">
        <div className="ai-os-prediction">
          <div className="ai-os-ring" style={{ "--ring": intelligence.readiness }}>
            <strong>{pct(intelligence.readiness)}</strong>
            <span>readiness</span>
          </div>
          <div>
            <p><Target size={15} /> Predicted score <strong>{pct(intelligence.predictedScore)}</strong></p>
            <p><Gauge size={15} /> Retention strength <strong>{pct(intelligence.retention)}</strong></p>
            <p><CalendarClock size={15} /> Urgent exams <strong>{intelligence.urgentExams}</strong></p>
          </div>
        </div>
        <div className="ai-os-radar" aria-label="Subject confidence radar">
          {(intelligence.subjectRadar.length ? intelligence.subjectRadar : [
            { label: "Math", value: 62 },
            { label: "Physics", value: 54 },
            { label: "Biology", value: 74 },
          ]).map(item => (
            <div key={item.label}>
              <span>{item.label}</span>
              <i><b style={{ width: `${item.value}%` }} /></i>
              <strong>{pct(item.value)}</strong>
            </div>
          ))}
        </div>
      </DashboardCard>

      <DashboardCard className="ai-os-revision" title="Smart Revision Engine" eyebrow="Revise Now">
        <div className="ai-os-queue">
          {intelligence.revisionQueue.length ? intelligence.revisionQueue.map((item, index) => (
            <motion.article key={item.id || `${item.title}-${index}`} whileHover={{ x: 3 }}>
              <span>{index + 1}</span>
              <div>
                <strong>{item.title}</strong>
                <small>{item.subject} - confidence {pct(item.confidence)}</small>
              </div>
              <button type="button">Revise</button>
            </motion.article>
          )) : (
            <p className="ai-os-empty">No weak-topic queue yet. Add topics to activate spaced repetition.</p>
          )}
        </div>
        <div className="ai-os-heatmap" aria-label="Revision heatmap">
          {Array.from({ length: 21 }).map((_, index) => (
            <i key={index} style={{ "--heat": `${28 + ((index * 17) % 66)}%` }} />
          ))}
        </div>
      </DashboardCard>

      <DashboardCard className="ai-os-notes" title="AI Notes Generator" eyebrow="Create">
        <div className="ai-os-notes__controls">
          <select value={notesMode} onChange={event => setNotesMode(event.target.value)}>
            <option value="summary">Summary</option>
            <option value="flashcards">Flashcards</option>
            <option value="quiz">Quiz</option>
            <option value="formula">Formula Sheet</option>
          </select>
          <input value={notesInput} onChange={event => setNotesInput(event.target.value)} placeholder="Chapter, topic, syllabus, or pasted text" />
          <button type="button" onClick={generateNotes}><WandSparkles size={15} /> Generate</button>
        </div>
        <p className="ai-os-generated">{generatedNotes || "Generate study assets from a topic, pasted notes, syllabus item, or weak chapter."}</p>
      </DashboardCard>

      <DashboardCard className="ai-os-game" title="Learning League" eyebrow="Gamification">
        <div className="ai-os-level">
          <Award size={24} />
          <div>
            <strong>Level {intelligence.level}</strong>
            <span>{intelligence.xp} XP earned</span>
          </div>
        </div>
        <div className="ai-os-xp"><span style={{ width: `${intelligence.xpProgress}%` }} /></div>
        <div className="ai-os-badges">
          <span><Flame size={14} /> Streak Builder</span>
          <span><ListChecks size={14} /> Plan Finisher</span>
          <span><CheckCircle2 size={14} /> Recall Ready</span>
        </div>
      </DashboardCard>

      <DashboardCard className="ai-os-calendar" title="Smart Calendar" eyebrow="Automation">
        <div className="ai-os-calendar-list">
          <p><RotateCcw size={15} /> Auto-reschedule missed tasks into the next open study block.</p>
          <p><BellRing size={15} /> Send weak-topic reminders before exam sprint windows.</p>
          <p><Layers3 size={15} /> Balance daily load across revision, practice, and recall.</p>
        </div>
        <button type="button">Optimize Week</button>
      </DashboardCard>
    </section>
  );
}

function MetricOrb({ label, value, icon: Icon, danger = false }) {
  return (
    <div className={`ai-os-orb ${danger ? "is-danger" : ""}`} style={{ "--ring": value }}>
      <Icon size={18} />
      <strong>{pct(value)}</strong>
      <span>{label}</span>
    </div>
  );
}

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  Atom,
  BatteryCharging,
  Bot,
  Brain,
  BriefcaseBusiness,
  CalendarDays,
  ChartNetwork,
  Clock,
  Dna,
  FlaskConical,
  Gauge,
  MessageCircle,
  Mic,
  Microscope,
  Network,
  Orbit,
  Rocket,
  ScanFace,
  Send,
  ShieldCheck,
  Sparkles,
  Swords,
  TimerReset,
  Trophy,
  Vault,
  Zap,
} from "lucide-react";
import "./AiOperatingSystemPages.css";

const aiProfile = {
  focusTiming: 84,
  quizPerformance: 78,
  revisionHabits: 69,
  consistency: 74,
  productivityPatterns: 88,
  burnoutFrequency: 31,
  preferredSubjects: ["Physics", "Mathematics", "Computer Science"],
  strongestHours: "8:30 PM - 11:00 PM",
  idealDuration: "47 minutes",
  personality: "Night Productivity Specialist",
  focusType: "Deep Focus Learner",
  productivityProfile: "Momentum Builder",
};

const subjects = [
  { name: "Physics", mastery: 72, x: 18, y: 46, color: "#68e1fd", children: ["Optics", "Mechanics", "Modern Physics"] },
  { name: "Mathematics", mastery: 81, x: 45, y: 22, color: "#b6f36a", children: ["Calculus", "Algebra", "Probability"] },
  { name: "Chemistry", mastery: 64, x: 73, y: 42, color: "#ffcf5a", children: ["Organic", "Equilibrium", "Bonding"] },
  { name: "Biology", mastery: 58, x: 36, y: 72, color: "#ff7aa8", children: ["Genetics", "Physiology", "Ecology"] },
  { name: "Computer Science", mastery: 86, x: 70, y: 76, color: "#8f8cff", children: ["Algorithms", "Databases", "OS"] },
];

const statLabels = [
  ["Focus timing", aiProfile.focusTiming],
  ["Quiz performance", aiProfile.quizPerformance],
  ["Revision habits", aiProfile.revisionHabits],
  ["Consistency", aiProfile.consistency],
  ["Productivity pattern", aiProfile.productivityPatterns],
  ["Burnout control", 100 - aiProfile.burnoutFrequency],
];

function clamp(value, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value));
}

function projectedScore(consistency, revision, mockAccuracy) {
  return clamp(Math.round(54 + consistency * 0.22 + revision * 0.14 + mockAccuracy * 0.18));
}

function Shell({ eyebrow, title, subtitle, icon: Icon, children, tone = "cyan" }) {
  return (
    <motion.div
      className={`aios aios--${tone}`}
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
    >
      <div className="aios-particles" aria-hidden="true">
        {Array.from({ length: 18 }).map((_, index) => <i key={index} style={{ "--i": index }} />)}
      </div>
      <section className="aios-hero">
        <div>
          <span className="aios-eyebrow"><Icon size={16} /> {eyebrow}</span>
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>
        <motion.div className="aios-orb" animate={{ rotate: 360 }} transition={{ duration: 26, repeat: Infinity, ease: "linear" }}>
          <Icon size={42} />
        </motion.div>
      </section>
      {children}
    </motion.div>
  );
}

function Glass({ children, className = "" }) {
  return <motion.section className={`aios-glass ${className}`} whileHover={{ y: -3 }} transition={{ duration: 0.18 }}>{children}</motion.section>;
}

function Ring({ label, value, hint }) {
  return (
    <div className="aios-ring" style={{ "--value": value }}>
      <div><strong>{value}%</strong><span>{label}</span></div>
      {hint && <small>{hint}</small>}
    </div>
  );
}

function Bars({ data }) {
  return <div className="aios-bars">{data.map(([label, value]) => <span key={label} style={{ "--h": `${value}%` }}><b>{label}</b></span>)}</div>;
}

function InsightList({ items }) {
  return <div className="aios-insights">{items.map((item) => <p key={item}><Sparkles size={15} /> {item}</p>)}</div>;
}

function RadarChart({ data }) {
  const points = data.map(([, value], index) => {
    const angle = (-90 + (360 / data.length) * index) * Math.PI / 180;
    const radius = 34 + (value / 100) * 52;
    return `${100 + Math.cos(angle) * radius},${100 + Math.sin(angle) * radius}`;
  }).join(" ");
  return (
    <div className="dna-radar">
      <svg viewBox="0 0 200 200" role="img" aria-label="Study DNA radar chart">
        {[42, 68, 94].map(radius => <circle key={radius} cx="100" cy="100" r={radius} />)}
        {data.map(([label], index) => {
          const angle = (-90 + (360 / data.length) * index) * Math.PI / 180;
          return <line key={label} x1="100" y1="100" x2={100 + Math.cos(angle) * 94} y2={100 + Math.sin(angle) * 94} />;
        })}
        <motion.polygon points={points} initial={{ scale: 0.78, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.55 }} />
      </svg>
      {data.map(([label, value], index) => {
        const angle = (360 / data.length) * index;
        return <span key={label} style={{ "--a": `${angle}deg`, "--na": `${-angle}deg` }}>{label}<b>{value}%</b></span>;
      })}
    </div>
  );
}

function StudyDnaPage() {
  return (
    <Shell eyebrow="Behavior Genome" title="Study DNA" subtitle="An AI behavior scanner that turns focus, revision, quiz history, and burnout patterns into a personal learning identity." icon={Dna}>
      <div className="aios-grid aios-grid--hero">
        <Glass className="dna-card">
          <div className="dna-helix" aria-hidden="true">{Array.from({ length: 18 }).map((_, i) => <span key={i} style={{ "--i": i }} />)}</div>
          <div>
            <span className="aios-kicker">Learning personality</span>
            <h2>{aiProfile.personality}</h2>
            <p>Your strongest output appears after evening ramp-up, with peak retention when sessions stay under one hour.</p>
          </div>
        </Glass>
        <Glass>
          <h2>AI profile synthesis</h2>
          <div className="aios-metric-list">
            <p><strong>Focus type</strong><span>{aiProfile.focusType}</span></p>
            <p><strong>Productivity profile</strong><span>{aiProfile.productivityProfile}</span></p>
            <p><strong>Strongest hours</strong><span>{aiProfile.strongestHours}</span></p>
            <p><strong>Ideal duration</strong><span>{aiProfile.idealDuration}</span></p>
          </div>
        </Glass>
      </div>
      <div className="aios-grid aios-grid--three">
        {statLabels.map(([label, value]) => <Ring key={label} label={label} value={value} />)}
      </div>
      <div className="aios-grid aios-grid--two">
        <Glass><h2>Personality radar</h2><RadarChart data={statLabels} /></Glass>
        <Glass><h2>AI-generated insights</h2><InsightList items={["Schedule hard topics during the night productivity window.", "Revision decay is visible after day three; add micro-recalls.", "Burnout risk is low when focus blocks stay near 47 minutes.", "Physics and Mathematics are currently your fastest mastery accelerators."]} /></Glass>
      </div>
    </Shell>
  );
}

function TimeMachinePage() {
  const [consistency, setConsistency] = useState(74);
  const [revision, setRevision] = useState(68);
  const [accuracy, setAccuracy] = useState(76);
  const future = projectedScore(consistency, revision, accuracy);
  const current = projectedScore(62, 55, 69);
  return (
    <Shell eyebrow="Outcome Simulator" title="AI Time Machine" subtitle="Change consistency, revision depth, and mock accuracy to forecast exam outcomes before they happen." icon={Clock} tone="violet">
      <div className="aios-grid aios-grid--two">
        <Glass>
          <h2>Simulation controls</h2>
          <Slider label="Consistency" value={consistency} onChange={setConsistency} />
          <Slider label="Revision intensity" value={revision} onChange={setRevision} />
          <Slider label="Mock accuracy" value={accuracy} onChange={setAccuracy} />
        </Glass>
        <Glass className="forecast-card">
          <span className="aios-kicker">Forecast engine</span>
          <h2>If you continue this adjusted pace, expected score = {future}%.</h2>
          <div className="compare-track"><span style={{ width: `${current}%` }}>Current {current}%</span><b style={{ width: `${future}%` }}>Future {future}%</b></div>
        </Glass>
      </div>
      <Glass>
        <h2>Future performance timeline</h2>
        <div className="aios-timeline">{[7, 14, 21, 30, 45].map((day, i) => <motion.div key={day} initial={{ scale: 0.9 }} animate={{ scale: 1 }} transition={{ delay: i * 0.08 }}><strong>Day {day}</strong><span>{clamp(current + Math.round((future - current) * (i + 1) / 5))}%</span></motion.div>)}</div>
      </Glass>
    </Shell>
  );
}

function Slider({ label, value, onChange, min = 20, max = 100 }) {
  return (
    <label className="aios-slider">
      <span>{label}<b>{value}%</b></span>
      <input type="range" min={min} max={max} value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </label>
  );
}

function BrainEnergyPage() {
  const [load, setLoad] = useState(58);
  const energy = clamp(100 - load + 18);
  const burnout = clamp(load - 18);
  return (
    <Shell eyebrow="Neural Battery" title="Brain Energy Monitor" subtitle="A live-feeling dashboard for fatigue, focus efficiency, burnout risk, productivity energy, and mental load." icon={BatteryCharging} tone="green">
      <div className="aios-grid aios-grid--three">
        <Ring label="Productivity energy" value={energy} hint="stable" />
        <Ring label="Focus efficiency" value={clamp(88 - load / 3)} hint="adaptive" />
        <Ring label="Burnout risk" value={burnout} hint={burnout > 55 ? "recover soon" : "controlled"} />
      </div>
      <div className="aios-grid aios-grid--two">
        <Glass><h2>Mental load scanner</h2><Slider label="Current mental load" value={load} onChange={setLoad} /><div className="energy-wave" /></Glass>
        <Glass><h2>AI recovery plan</h2><InsightList items={[`Take a ${load > 65 ? 18 : 9}-minute recovery break after the next block.`, "Best study window: 8:30 PM - 10:40 PM.", "Use low-stimulus revision for the final 20 minutes.", "Switch subjects if focus efficiency drops below 62%."]} /></Glass>
      </div>
    </Shell>
  );
}

function KnowledgeMapPage() {
  return (
    <Shell eyebrow="Topic Graph" title="Knowledge Map" subtitle="A zoomable-style mastery graph that reveals subject connections, weak clusters, and AI-discovered learning bridges." icon={Network}>
      <Glass className="knowledge-map">
        <svg viewBox="0 0 100 100" aria-hidden="true">
          {subjects.slice(0, -1).map((node, index) => <line key={node.name} x1={node.x} y1={node.y} x2={subjects[index + 1].x} y2={subjects[index + 1].y} />)}
        </svg>
        {subjects.map((node) => (
          <motion.div className="knowledge-node" key={node.name} style={{ left: `${node.x}%`, top: `${node.y}%`, "--node": node.color }} whileHover={{ scale: 1.08 }}>
            <strong>{node.name}</strong><span>{node.mastery}% mastery</span><small>{node.children.join(" -> ")}</small>
          </motion.div>
        ))}
      </Glass>
    </Shell>
  );
}

function MentorRoomPage() {
  const [messages, setMessages] = useState([{ role: "ai", text: "I reviewed your pattern. Tonight, protect the first 45 minutes for your weakest high-impact topic." }]);
  const [input, setInput] = useState("");
  const [listening, setListening] = useState(false);
  const mentorReplies = [
    "Turn that into a measurable block: define the topic, solve three representative questions, then write the one mistake you keep repeating.",
    "Good instinct. Now reduce the scope: one concept, one example, one timed drill. Strategy beats volume when exams are close.",
    "I would treat this as a confidence rebuild. Start with a familiar subtopic, then step into a mixed question set after momentum appears.",
    "Your next move should produce evidence: a score, an error list, or a completed revision card. Avoid vague study time."
  ];
  function send(e) {
    e.preventDefault();
    if (!input.trim()) return;
    setMessages((m) => [...m, { role: "user", text: input }, { role: "ai", text: mentorReplies[m.length % mentorReplies.length] }]);
    setInput("");
  }
  function listen() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setMessages(m => [...m, { role: "ai", text: "Voice input is not supported in this browser. Type your question and I will coach from there." }]);
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    setListening(true);
    const timeout = setTimeout(() => recognition.stop(), 9000);
    recognition.onresult = event => {
      const transcript = event.results?.[0]?.[0]?.transcript?.trim();
      if (transcript) setInput(transcript);
    };
    recognition.onerror = () => setMessages(m => [...m, { role: "ai", text: "I could not access the microphone. Check permission or type the prompt." }]);
    recognition.onend = () => { clearTimeout(timeout); setListening(false); };
    try { recognition.start(); } catch { setListening(false); }
  }
  return (
    <Shell eyebrow="Virtual Coach" title="AI Mentor Room" subtitle="A premium mentor space for coaching, progress review, strategy discussions, voice prompts, and personalized feedback." icon={Bot} tone="violet">
      <div className="aios-grid aios-grid--mentor">
        <Glass className="mentor-avatar"><motion.div animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 3 }}><ScanFace size={86} /></motion.div><h2>Mentor Sentinel</h2><p>Motivation, strategy, review, and accountability in one conversational room.</p></Glass>
        <Glass className="mentor-chat">
          <div>{messages.map((m, i) => <p key={i} className={m.role}>{m.text}</p>)}</div>
          <form onSubmit={send}><button type="button" className={`secondary ${listening ? "is-listening" : ""}`} onClick={listen}><Mic size={16} /> {listening ? "Listening" : "Voice"}</button><input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask for a strategy review..." /><button><Send size={16} /></button></form>
        </Glass>
      </div>
    </Shell>
  );
}

function FocusArenaPage() {
  const [room, setRoom] = useState("Quantum Sprint");
  const leaders = ["Krunal", "Aarav", "Mira", "Dev", "Nisha"].map((name, i) => ({ name, score: 96 - i * 7, streak: 12 - i }));
  return (
    <Shell eyebrow="Competitive Focus" title="Focus Arena" subtitle="Challenge rooms, timers, live rankings, productivity score battles, consistency streaks, and quiz accuracy leagues." icon={Trophy} tone="amber">
      <div className="aios-grid aios-grid--two">
        <Glass><h2>Challenge room</h2><div className="arena-rooms">{["Quantum Sprint", "Deep Work Duel", "Mock Accuracy Cup"].map((x) => <button className={room === x ? "active" : "secondary"} onClick={() => setRoom(x)} key={x}>{x}</button>)}</div><div className="arena-timer">25:00</div></Glass>
        <Glass><h2>{room} rankings</h2>{leaders.map((l, i) => <p className="leader-row" key={l.name}><strong>#{i + 1} {l.name}</strong><span>{l.score} pts</span><small>{l.streak} day streak</small></p>)}</Glass>
      </div>
    </Shell>
  );
}

function MemoryVaultPage() {
  return (
    <Shell eyebrow="Retention Engine" title="Memory Vault" subtitle="Spaced repetition tracking, memory strength analysis, forgetting curves, retention heatmaps, and AI flashcard recommendations." icon={Vault} tone="green">
      <div className="aios-grid aios-grid--two">
        <Glass className="vault-door"><Vault size={74} /><h2>Retention score 83%</h2><p>Vault integrity is strong; Optics and Organic Chemistry need recall reinforcement.</p></Glass>
        <Glass><h2>Forgetting curve</h2><div className="curve">{[90, 82, 76, 68, 62, 54, 47].map((v, i) => <span key={i} style={{ height: `${v}%` }} />)}</div></Glass>
      </div>
      <Glass><h2>Revision heatmap</h2><div className="heatmap">{Array.from({ length: 42 }).map((_, i) => <i key={i} style={{ opacity: 0.25 + ((i * 17) % 70) / 100 }} />)}</div></Glass>
    </Shell>
  );
}

function StudyUniversePage() {
  return (
    <Shell eyebrow="Cosmic Mastery" title="Study Universe" subtitle="Every subject becomes a planet, every mastery level unlocks new orbital achievements and star-system progress." icon={Orbit} tone="violet">
      <Glass className="universe">
        {subjects.map((planet, i) => <motion.div className="planet" key={planet.name} style={{ "--planet": planet.color, "--orbit": `${22 + i * 12}%` }} animate={{ rotate: 360 }} transition={{ duration: 18 + i * 4, repeat: Infinity, ease: "linear" }}><span><b>{planet.name}</b><small>{planet.mastery}%</small></span></motion.div>)}
        <div className="sun-core"><Atom size={48} /><strong>Mastery Core</strong></div>
      </Glass>
    </Shell>
  );
}

function HabitLabPage() {
  const habits = [["Wake-up routine", 68], ["Study timing", 81], ["Revision ritual", 74], ["Distraction shutdown", 62], ["Sleep consistency", 57]];
  return (
    <Shell eyebrow="Behavior Lab" title="AI Habit Lab" subtitle="A routine optimization laboratory that models consistency, rituals, wake-up patterns, revision habits, and daily structure." icon={FlaskConical} tone="green">
      <div className="aios-grid aios-grid--two">
        <Glass><h2>Habit streak reactor</h2>{habits.map(([h, v]) => <Progress key={h} label={h} value={v} />)}</Glass>
        <Glass><h2>AI routine upgrades</h2><InsightList items={["Move revision trigger immediately after dinner.", "Use a fixed shutdown ritual before deep work.", "Start with a two-minute recall primer.", "Protect wake-up consistency before adding more study volume."]} /></Glass>
      </div>
    </Shell>
  );
}

function ExamWarRoomPage() {
  return (
    <Shell eyebrow="Tactical Exam Ops" title="Exam War Room" subtitle="An intense command center for rapid revision, mock battle mode, emergency plans, countdowns, and last-week strategy." icon={Swords} tone="red">
      <div className="aios-grid aios-grid--three">
        <Glass><Clock size={28} /><h2>06d 14h</h2><p>Primary exam countdown</p></Glass>
        <Glass><ShieldCheck size={28} /><h2>High-priority strategy</h2><p>Attack weak high-weight topics first.</p></Glass>
        <Glass><TimerReset size={28} /><h2>Rapid revision mode</h2><p>4 cycles loaded for tonight.</p></Glass>
      </div>
      <Glass><h2>Battle plan</h2>{["Mock battle: 60 minutes Physics", "Emergency drill: formulas and derivations", "Last-week plan: 70% recall, 30% fresh questions", "AI priority: Optics, Calculus, Organic mechanisms"].map((x, i) => <p className="war-step" key={x}><b>0{i + 1}</b>{x}</p>)}</Glass>
    </Shell>
  );
}

function CareerSimulatorPage() {
  const [career, setCareer] = useState("AI Engineer");
  const [query, setQuery] = useState("AI Engineer");
  const [open, setOpen] = useState(false);
  const careerMap = {
    "AI Engineer": ["Python", "Linear Algebra", "ML Systems", "Data Structures", "Projects"],
    "Data Scientist": ["Statistics", "Python", "SQL", "Modeling", "Storytelling"],
    "IAS Officer": ["Polity", "Economy", "Current Affairs", "Answer Writing", "Ethics"],
    Doctor: ["Biology", "Chemistry", "Mock Tests", "Diagrams", "Clinical Basics"],
    "Product Manager": ["User Research", "Analytics", "Roadmaps", "Communication", "Case Studies"],
  };
  const careerOptions = Object.keys(careerMap);
  const filteredCareers = useMemo(() => {
    const text = query.trim().toLowerCase();
    return careerOptions.filter(option => option.toLowerCase().includes(text));
  }, [careerOptions, query]);
  const skills = careerMap[career] || careerMap["AI Engineer"];
  const timeline = career === "IAS Officer" ? "14-18 months" : career === "Doctor" ? "18-24 months" : "6-10 months";
  function chooseCareer(nextCareer) {
    setCareer(nextCareer);
    setQuery(nextCareer);
    setOpen(false);
  }
  return (
    <Shell eyebrow="Future Path" title="Dream Career Simulator" subtitle="Select a dream career and let AI convert it into required skills, milestones, study targets, and an estimated timeline." icon={BriefcaseBusiness}>
      <Glass className="career-target-card">
        <h2>Career target</h2>
        <div className={`career-combobox ${open ? "is-open" : ""}`}>
          <input
            value={query}
            onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            placeholder="Search career target"
            aria-expanded={open}
          />
          {open && (
            <div className="career-menu">
              {(filteredCareers.length ? filteredCareers : careerOptions).map(option => (
                <button type="button" key={option} className={career === option ? "selected" : ""} onMouseDown={() => chooseCareer(option)}>
                  <strong>{option}</strong>
                  <span>{option === career ? "Selected" : "View roadmap"}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </Glass>
      <Glass><h2>{career} roadmap</h2><p>Estimated timeline: {timeline}. Focus on the first two skill nodes this month, then convert each node into one project, mock, or portfolio proof.</p></Glass>
      <div className="skill-tree">{skills.map((skill, i) => <motion.div key={skill} className="skill-node" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}><strong>{skill}</strong><span>{60 + i * 8}% readiness</span></motion.div>)}</div>
    </Shell>
  );
}

function AnalyticsLabPage() {
  return (
    <Shell eyebrow="Deep Intelligence" title="Deep Analytics Lab" subtitle="A futuristic analytics laboratory with 3D-feeling charts, productivity simulations, burnout analysis, and study efficiency comparisons." icon={Microscope} tone="violet">
      <div className="aios-grid aios-grid--three">
        <Ring label="Efficiency index" value={87} />
        <Ring label="Prediction confidence" value={79} />
        <Ring label="Burnout stability" value={72} />
      </div>
      <Glass><h2>3D productivity matrix</h2><div className="lab-bars">{statLabels.map(([label, value]) => <i key={label} style={{ "--h": value }}><span>{label}</span></i>)}</div></Glass>
    </Shell>
  );
}

function StudyClonePage() {
  return (
    <Shell eyebrow="Experimental AI Twin" title="AI Study Clone" subtitle="Compare your current self against an optimized AI-generated version with ideal routines and projected productivity." icon={ScanFace} tone="cyan">
      <div className="clone-compare">
        <Glass><h2>Current self</h2><Ring label="Projected productivity" value={68} /><InsightList items={["Inconsistent revision spacing", "Strong late-night momentum", "Occasional mental load spikes"]} /></Glass>
        <Glass className="clone-optimized"><h2>Optimized study clone</h2><Ring label="Projected productivity" value={91} /><InsightList items={["47-minute deep work blocks", "Daily spaced recall", "Two recovery windows before burnout rises"]} /></Glass>
      </div>
    </Shell>
  );
}

function Progress({ label, value }) {
  return <p className="aios-progress"><span>{label}<b>{value}%</b></span><i><em style={{ width: `${value}%` }} /></i></p>;
}

export {
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
};

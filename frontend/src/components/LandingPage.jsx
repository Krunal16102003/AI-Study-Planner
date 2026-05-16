import {
  ArrowRight,
  BarChart3,
  BookOpenCheck,
  Brain,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  HeartPulse,
  MessageCircle,
  PlayCircle,
  Repeat2,
  ShieldCheck,
  Sparkles,
  Target,
  TimerReset,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";

const features = [
  {
    title: "AI Timetable Generator",
    text: "Create daily and weekly plans from exam dates, priorities, weak topics, and available study hours.",
    icon: CalendarClock,
  },
  {
    title: "Weak Topic Tracker",
    text: "Mark difficult concepts, confidence levels, and revision notes so your plan focuses on what needs work.",
    icon: Target,
  },
  {
    title: "Personalized Quizzes",
    text: "Generate practice questions by subject, topic, and difficulty with answers and explanations.",
    icon: ClipboardList,
  },
  {
    title: "Focus & Pomodoro",
    text: "Run focused study sessions, log interruptions, and receive healthier break recommendations.",
    icon: TimerReset,
  },
  {
    title: "Analytics Dashboard",
    text: "Track readiness, completion rate, quiz averages, streaks, study minutes, and subject performance.",
    icon: BarChart3,
  },
  {
    title: "AI Study Assistant",
    text: "Ask for explanations, today’s plan, revision ideas, resource recommendations, or quiz suggestions.",
    icon: MessageCircle,
  },
];

const workflow = [
  ["Add subjects", "Enter exam dates, difficulty, priority, and confidence."],
  ["List weak topics", "Add chapters or concepts that need extra attention."],
  ["Generate plan", "AI balances urgency, revision spacing, and daily hours."],
  ["Study and track", "Complete sessions, take quizzes, and record focus time."],
  ["Improve weekly", "Use analytics and reminders to adjust your routine."],
];

const outcomes = [
  ["86%", "sample readiness score after consistent tracking"],
  ["12 days", "study streak visibility for habit building"],
  ["7/9", "tasks completed in a daily AI plan"],
  ["45 min", "adaptive focus session recommendation"],
];

const faqs = [
  ["Who is this for?", "Students preparing for school exams, college assessments, competitive exams, or any subject-heavy schedule."],
  ["What does AI personalize?", "It uses subjects, exam dates, weak topics, confidence, task completion, quiz performance, and study patterns."],
  ["Can I use it daily?", "Yes. The dashboard, planner, focus timer, assistant, and reminders are designed for everyday study routines."],
];

export default function LandingPage() {
  return (
    <div className="home-page">
      <header className="home-hero">
        <img
          className="home-hero__image"
          src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1800&q=85"
          alt="Students planning study work together"
        />
        <div className="home-hero__overlay" />
        <nav className="home-nav" aria-label="Main navigation">
          <a className="home-brand" href="/">
            <Brain size={32} />
            <span>IntelliStudy AI</span>
          </a>
          <div className="home-nav__links">
            <a href="#features">Features</a>
            <a href="#workflow">Workflow</a>
            <a href="#dashboard">Dashboard</a>
            <a href="#faq">FAQ</a>
          </div>
          <Link className="home-nav__login" to="/login">Login</Link>
        </nav>

        <div className="home-hero__content">
          <section className="home-hero__copy">
            <p className="home-kicker"><Sparkles size={18} /> AI-powered study planning platform</p>
            <h1>Plan smarter, study better, and walk into exams prepared.</h1>
            <p className="home-hero__lead">
              IntelliStudy AI helps students build personalized timetables, revise weak topics, generate quizzes,
              track exam readiness, protect focus time, and keep a healthy study rhythm.
            </p>
            <div className="home-actions">
              <Link className="home-button home-button--primary" to="/register">
                Get started <ArrowRight size={20} />
              </Link>
              <a className="home-button home-button--ghost" href="#features">
                <PlayCircle size={20} /> Explore features
              </a>
            </div>
          </section>

          <aside className="home-plan-card" aria-label="Sample AI study plan">
            <div className="home-plan-card__top">
              <div>
                <span>Today&apos;s AI plan</span>
                <strong>Exam readiness 82%</strong>
              </div>
              <b>LIVE</b>
            </div>
            <div className="home-task-list">
              {["Physics: Optics revision", "Math: Calculus quiz", "Chemistry: weak topic review", "Focus block with break"].map((task, index) => (
                <div className="home-task" key={task}>
                  <CheckCircle2 size={18} />
                  <span>{task}</span>
                  <time>{index + 1}:00 PM</time>
                </div>
              ))}
            </div>
            <div className="home-plan-metrics">
              {outcomes.slice(1).map(([value, label]) => (
                <div key={value}>
                  <strong>{value}</strong>
                  <span>{label.split(" ").slice(0, 2).join(" ")}</span>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </header>

      <main>
        <section className="home-strip" aria-label="Platform outcomes">
          {outcomes.map(([value, label]) => (
            <div key={value}>
              <strong>{value}</strong>
              <span>{label}</span>
            </div>
          ))}
        </section>

        <section id="features" className="home-section home-section--soft">
          <div className="home-section__heading">
            <span>Platform features</span>
            <h2>Everything needed for a complete study workflow.</h2>
            <p>From planning to practice to reflection, the home page now explains the full value of the app clearly.</p>
          </div>
          <div className="home-feature-grid">
            {features.map(({ title, text, icon: Icon }) => (
              <article className="home-feature-card" key={title}>
                <div><Icon size={26} /></div>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="workflow" className="home-section">
          <div className="home-section__heading">
            <span>How it works</span>
            <h2>Turn scattered exam pressure into a clear daily plan.</h2>
          </div>
          <div className="home-workflow">
            {workflow.map(([title, text], index) => (
              <article key={title}>
                <b>{String(index + 1).padStart(2, "0")}</b>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="home-ai-band">
          <div>
            <span>AI intelligence</span>
            <h2>Personalized recommendations that adapt as you study.</h2>
            <p>
              The platform connects scheduling, readiness prediction, spaced revision, burnout detection,
              resource recommendations, and chatbot support into one learning loop.
            </p>
          </div>
          <div className="home-ai-list">
            <p><Brain size={20} /> Prioritizes urgent exams and difficult subjects.</p>
            <p><Repeat2 size={20} /> Schedules revision using spaced practice habits.</p>
            <p><HeartPulse size={20} /> Flags overload and suggests healthier breaks.</p>
            <p><ShieldCheck size={20} /> Keeps progress, reminders, and analytics organized.</p>
          </div>
        </section>

        <section id="dashboard" className="home-section home-section--soft">
          <div className="home-dashboard">
            <div>
              <span>Dashboard preview</span>
              <h2>Know what to study next and why it matters.</h2>
              <p>
                The dashboard gives students a practical overview of study hours, weak areas, upcoming revision,
                quiz averages, readiness predictions, notifications, and consistency.
              </p>
              <div className="home-dashboard__checks">
                <p><BookOpenCheck size={18} /> Subject-wise readiness</p>
                <p><Users size={18} /> Study groups and leaderboard support</p>
                <p><BarChart3 size={18} /> Weekly productivity analytics</p>
              </div>
            </div>
            <div className="home-dashboard-card">
              <div className="home-dashboard-card__stats">
                <PreviewStat label="Readiness" value="86%" />
                <PreviewStat label="Focus" value="14h" />
                <PreviewStat label="Streak" value="9d" />
              </div>
              <div className="home-bars">
                {[44, 92, 68, 116, 84, 132, 72].map((height, index) => (
                  <span key={height} style={{ height }} aria-label={`Day ${index + 1} study minutes`} />
                ))}
              </div>
              <div className="home-readiness">
                {["Physics", "Mathematics", "Chemistry"].map((subject, index) => (
                  <p key={subject}>
                    <span>{subject}</span>
                    <meter min="0" max="100" value={[82, 76, 68][index]} />
                  </p>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="faq" className="home-section">
          <div className="home-section__heading">
            <span>Details</span>
            <h2>Built for everyday student planning.</h2>
          </div>
          <div className="home-faq">
            {faqs.map(([question, answer]) => (
              <article key={question}>
                <h3>{question}</h3>
                <p>{answer}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="home-cta">
          <h2>Start building a study routine that actually fits your exams.</h2>
          <p>Create an account, add your subjects, and generate your first AI timetable.</p>
          <Link className="home-button home-button--primary" to="/register">
            Create free account <ArrowRight size={20} />
          </Link>
        </section>
      </main>

      <footer className="home-footer">
        <div>
          <a className="home-brand home-brand--dark" href="/">
            <Brain size={28} />
            <span>IntelliStudy AI</span>
          </a>
          <p>AI Study Planner for scheduling, revision, quizzes, analytics, focus, wellness, and exam readiness.</p>
          <p>Created by Krunal Patil and Kush Panchal || All rights reserved || Copyright 2026</p>
        </div>
        <div>
          <a href="#features">Features</a>
          <a href="#workflow">Workflow</a>
          <a href="#dashboard">Dashboard</a>
          <Link to="/login">Login</Link>
        </div>
      </footer>
    </div>
  );
}

function PreviewStat({ label, value }) {
  return (
    <div>
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

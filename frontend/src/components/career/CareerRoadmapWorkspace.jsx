import { useCallback, useEffect, useMemo, useState } from "react";
import { BriefcaseBusiness, Gauge, GitBranch, Loader2, RefreshCw, Send, Sparkles, Target, TrendingUp } from "lucide-react";
import { api, getApiErrorMessage } from "../../services/api";

const CAREER_OPTIONS = [
  "Frontend Developer",
  "Full Stack Developer",
  "Data Scientist",
  "UI/UX Designer",
  "AI Engineer",
  "DevOps Engineer",
];

const DEFAULT_FORM = {
  target_career: "Frontend Developer",
  skill_level: "beginner",
  weekly_hours: 8,
  timeline_weeks: 12,
  preferred_technologies: "React, JavaScript, APIs",
};

const INTERVIEW_QUESTIONS = {
  technical: career => `Explain one ${career} project you built and the technical decisions that made it reliable.`,
  coding: career => `Walk through how you would solve a practical coding problem for a ${career} role, including edge cases and complexity.`,
  behavioral: career => `Tell me about a time you improved after feedback and how it prepares you for a ${career} role.`,
};

function scoreLabel(value) {
  if (value >= 80) return "Role ready";
  if (value >= 60) return "Getting close";
  if (value >= 40) return "Needs proof";
  return "Foundation stage";
}

export default function CareerRoadmapWorkspace() {
  const [form, setForm] = useState(DEFAULT_FORM);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [interview, setInterview] = useState({
    interview_type: "technical",
    question: "Walk me through a project that proves you are ready for this role.",
    answer: "",
  });
  const [evaluating, setEvaluating] = useState(false);

  const roadmap = dashboard?.roadmap;
  const readiness = dashboard?.readiness;
  const phases = roadmap?.phases || [];
  const skills = roadmap?.skills || [];
  const projects = dashboard?.projects || roadmap?.project_recommendations || [];
  const insights = dashboard?.insights || roadmap?.learning_insights || [];
  const gaps = dashboard?.skill_gaps || [];
  const interviews = dashboard?.interview_history || [];

  const overallProgress = useMemo(() => {
    if (!phases.length) return 0;
    return Math.round(phases.reduce((sum, phase) => sum + (phase.progress_percent || 0), 0) / phases.length);
  }, [phases]);

  const loadDashboard = useCallback(async () => {
    setError("");
    try {
      const { data } = await api.get("/career-dashboard/");
      setDashboard(data);
    } catch (err) {
      setError(getApiErrorMessage(err, "Unable to load career roadmap data."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  async function generateRoadmap(event) {
    event.preventDefault();
    setGenerating(true);
    setError("");
    try {
      await api.post("/career-roadmaps/generate/", form);
      await loadDashboard();
    } catch (err) {
      setError(getApiErrorMessage(err, "Unable to generate career roadmap."));
    } finally {
      setGenerating(false);
    }
  }

  async function refreshReadiness() {
    if (!roadmap?.id) return;
    setGenerating(true);
    try {
      await api.post(`/career-roadmaps/${roadmap.id}/refresh-readiness/`);
      await loadDashboard();
    } catch (err) {
      setError(getApiErrorMessage(err, "Unable to refresh readiness score."));
    } finally {
      setGenerating(false);
    }
  }

  async function evaluateInterview(event) {
    event.preventDefault();
    if (!interview.answer.trim()) return;
    setEvaluating(true);
    setError("");
    try {
      await api.post("/career-interview/evaluate/", { ...interview, roadmap: roadmap?.id });
      setInterview(current => ({ ...current, answer: "" }));
      await loadDashboard();
    } catch (err) {
      setError(getApiErrorMessage(err, "Unable to evaluate interview answer."));
    } finally {
      setEvaluating(false);
    }
  }

  function updateInterviewType(type) {
    setInterview(current => ({
      ...current,
      interview_type: type,
      question: INTERVIEW_QUESTIONS[type]?.(form.target_career) || current.question,
      answer: "",
    }));
  }

  if (loading) {
    return (
      <div className="page-content career-workspace">
        <div className="career-skeleton" />
        <div className="career-skeleton-grid">
          <span /><span /><span />
        </div>
      </div>
    );
  }

  return (
    <div className="page-content career-workspace">
      <section className="career-hero panel">
        <div>
          <span className="eyebrow">AI Career Mentor</span>
          <h2>{roadmap ? roadmap.target_career : "Build your career roadmap"}</h2>
          <p>
            Generate a role-specific learning path, track skill gaps, measure industry readiness, and prepare for interviews with AI-guided feedback.
          </p>
        </div>
        <div className="career-hero-score">
          <strong>{readiness?.career_readiness ?? 0}%</strong>
          <span>{scoreLabel(readiness?.career_readiness ?? 0)}</span>
        </div>
      </section>

      {error && <p className="error">{error}</p>}

      <section className="career-layout">
        <aside className="panel career-sidebar">
          <div className="section-heading">
            <span className="eyebrow">Generate</span>
            <h2>Career Roadmap</h2>
          </div>
          <form className="career-form" onSubmit={generateRoadmap}>
            <label>
              Target career
              <select value={form.target_career} onChange={event => setForm({ ...form, target_career: event.target.value })}>
                {CAREER_OPTIONS.map(option => <option key={option}>{option}</option>)}
              </select>
            </label>
            <label>
              Skill level
              <select value={form.skill_level} onChange={event => setForm({ ...form, skill_level: event.target.value })}>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </label>
            <label>
              Weekly study hours
              <input type="number" min="3" max="40" value={form.weekly_hours} onChange={event => setForm({ ...form, weekly_hours: event.target.value })} />
            </label>
            <label>
              Target timeline
              <input type="number" min="4" max="52" value={form.timeline_weeks} onChange={event => setForm({ ...form, timeline_weeks: event.target.value })} />
            </label>
            <label>
              Preferred technologies
              <input value={form.preferred_technologies} onChange={event => setForm({ ...form, preferred_technologies: event.target.value })} />
            </label>
            <button disabled={generating}>
              {generating ? <Loader2 className="spin" size={18} /> : <Sparkles size={18} />}
              {roadmap ? "Regenerate Roadmap" : "Generate Roadmap"}
            </button>
          </form>
        </aside>

        <main className="career-main">
          {!roadmap ? (
            <section className="panel career-empty">
              <BriefcaseBusiness size={42} />
              <h2>No career roadmap yet</h2>
              <p>Choose a target role and generate your first AI career path. The system will create phases, skills, projects, readiness scores, and interview preparation.</p>
            </section>
          ) : (
            <>
              <section className="career-readiness-grid">
                <MetricCard icon={Gauge} label="Career Readiness" value={`${readiness?.career_readiness ?? 0}%`} />
                <MetricCard icon={Target} label="Interview Readiness" value={`${readiness?.interview_readiness ?? 0}%`} />
                <MetricCard icon={GitBranch} label="Portfolio Strength" value={`${readiness?.portfolio_strength ?? 0}%`} />
                <MetricCard icon={TrendingUp} label="Roadmap Progress" value={`${overallProgress}%`} />
              </section>

              <section className="panel career-summary">
                <div>
                  <span className="eyebrow">Smart learning path</span>
                  <h2>{roadmap.summary}</h2>
                  <p>{roadmap.revision_strategy}</p>
                </div>
                <button className="secondary" onClick={refreshReadiness} disabled={generating}>
                  <RefreshCw size={18} /> Refresh Scores
                </button>
              </section>

              <section className="career-roadmap-grid">
                <div className="panel career-timeline">
                  <div className="section-heading">
                    <span className="eyebrow">Roadmap timeline</span>
                    <h2>Learning Phases</h2>
                  </div>
                  {phases.map(phase => (
                    <article className="career-phase" key={phase.id}>
                      <div className="career-phase-marker">{phase.order}</div>
                      <div>
                        <div className="career-phase-head">
                          <h3>{phase.title}</h3>
                          <span>{phase.estimated_weeks} wk</span>
                        </div>
                        <p>{phase.learning_goals?.[0]}</p>
                        <div className="career-chip-row">
                          {phase.topics?.slice(0, 5).map(topic => <span key={topic}>{topic}</span>)}
                        </div>
                      </div>
                    </article>
                  ))}
                </div>

                <aside className="career-side-stack">
                  <section className="panel">
                    <div className="section-heading">
                      <span className="eyebrow">Skill gaps</span>
                      <h2>Missing Requirements</h2>
                    </div>
                    {gaps.length ? gaps.slice(0, 5).map(gap => (
                      <div className="career-gap" key={gap.skill}>
                        <div><strong>{gap.skill}</strong><span>{gap.recommendation}</span></div>
                        <b>{gap.gap}</b>
                      </div>
                    )) : <p className="empty">No major skill gaps detected yet.</p>}
                  </section>

                  <section className="panel">
                    <div className="section-heading">
                      <span className="eyebrow">Industry signals</span>
                      <h2>AI Insights</h2>
                    </div>
                    {insights.map(insight => (
                      <p className={`career-insight career-insight--${insight.severity}`} key={insight.id}>
                        <strong>{insight.title}</strong>
                        {insight.detail}
                      </p>
                    ))}
                  </section>
                </aside>
              </section>

              <section className="panel career-skill-panel">
                <div className="section-heading">
                  <span className="eyebrow">Growth tracking</span>
                  <h2>Technology Mastery</h2>
                </div>
                <div className="career-skill-grid">
                  {skills.slice(0, 10).map(skill => (
                    <div className="career-skill" key={skill.id}>
                      <div><strong>{skill.name}</strong><span>{skill.category}</span></div>
                      <meter min="0" max="100" value={skill.current_level} />
                      <small>{skill.current_level}% toward {skill.target_level}% target</small>
                    </div>
                  ))}
                </div>
              </section>

              <section className="career-project-grid">
                {projects.slice(0, 4).map(project => (
                  <article className="panel career-project" key={project.id}>
                    <span className="career-badge">{project.difficulty}</span>
                    <h3>{project.title}</h3>
                    <p>{project.reason}</p>
                    <div className="career-chip-row">
                      {project.required_technologies?.slice(0, 5).map(item => <span key={item}>{item}</span>)}
                    </div>
                    <small>{project.estimated_weeks} week build</small>
                  </article>
                ))}
              </section>

              <section className="career-roadmap-grid">
                <form className="panel career-interview" onSubmit={evaluateInterview}>
                  <div className="section-heading">
                    <span className="eyebrow">Interview mode</span>
                    <h2>AI Mock Interview</h2>
                  </div>
                  <select value={interview.interview_type} onChange={event => updateInterviewType(event.target.value)}>
                    <option value="technical">Technical round</option>
                    <option value="coding">Coding round</option>
                    <option value="behavioral">Behavioral round</option>
                  </select>
                  <input value={interview.question} onChange={event => setInterview({ ...interview, question: event.target.value })} />
                  <textarea value={interview.answer} onChange={event => setInterview({ ...interview, answer: event.target.value })} placeholder="Type your answer for AI evaluation..." />
                  <button disabled={evaluating || !interview.answer.trim()}>
                    {evaluating ? <Loader2 className="spin" size={18} /> : <Send size={18} />}
                    Evaluate Answer
                  </button>
                </form>

                <section className="panel career-interview-history">
                  <div className="section-heading">
                    <span className="eyebrow">Recent reviews</span>
                    <h2>Interview Analytics</h2>
                  </div>
                  {interviews.length ? interviews.map(item => (
                    <article className="career-review" key={item.id}>
                      <div><strong>{item.score}%</strong><span>{item.interview_type}</span></div>
                      <p>{item.evaluation}</p>
                      {!!item.weak_concepts?.length && <small>Retry: {item.weak_concepts.join(", ")}</small>}
                    </article>
                  )) : <p className="empty">Submit an answer to build interview analytics.</p>}
                </section>
              </section>
            </>
          )}
        </main>
      </section>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value }) {
  return (
    <article className="panel career-metric">
      <Icon size={20} />
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

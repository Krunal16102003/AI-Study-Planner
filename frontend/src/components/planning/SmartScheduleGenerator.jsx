import { useEffect, useMemo, useState } from "react";
import {
  Brain,
  CalendarDays,
  GripVertical,
  Loader2,
  Plus,
  RefreshCw,
  Save,
  Sparkles,
  Trash2,
} from "lucide-react";
import { api, getApiErrorMessage } from "../../services/api";

const today = new Date().toISOString().slice(0, 10);

const emptySubject = {
  name: "",
  exam_date: "",
  difficulty: "medium",
  weak_topics: "",
};

const defaultForm = {
  daily_hours: 3,
  preferred_study_time: "18:00",
  break_duration: 10,
  days: 7,
  subjects: [
    { ...emptySubject, name: "Mathematics" },
    { ...emptySubject, name: "Chemistry" },
  ],
};

function groupSessionsByDate(sessions) {
  return sessions.reduce((acc, session) => {
    const date = session.date;
    acc[date] = [...(acc[date] || []), session].sort((a, b) => String(a.start_time).localeCompare(String(b.start_time)));
    return acc;
  }, {});
}

function getSubjectPriority(subject) {
  const weakCount = subject.weak_topics?.split(",").filter(Boolean).length || 0;
  if (weakCount > 1 || subject.difficulty === "high") return "High";
  if (weakCount === 1 || subject.difficulty === "medium") return "Medium";
  return "Balanced";
}

function sessionTone(type) {
  if (type === "revision") return "is-revision";
  if (type === "quiz") return "is-quiz";
  if (type === "break") return "is-break";
  return "is-study";
}

export default function SmartScheduleGenerator() {
  const [form, setForm] = useState(defaultForm);
  const [plan, setPlan] = useState(null);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [booting, setBooting] = useState(true);
  const [message, setMessage] = useState("");
  const [draggedSession, setDraggedSession] = useState(null);

  const sessions = plan?.sessions || [];
  const sessionsByDate = useMemo(() => groupSessionsByDate(sessions), [sessions]);
  const dates = Object.keys(sessionsByDate).sort().slice(0, 7);

  useEffect(() => {
    loadPlans();
  }, []);

  async function loadPlans() {
    try {
      const { data } = await api.get("/study-plans/");
      const rows = Array.isArray(data) ? data : data.results || [];
      setPlans(rows);
      setPlan(rows[0] || null);
    } catch (err) {
      setMessage(getApiErrorMessage(err, "Could not load saved schedules."));
    } finally {
      setBooting(false);
    }
  }

  function updateSubject(index, key, value) {
    setForm(current => ({
      ...current,
      subjects: current.subjects.map((subject, itemIndex) =>
        itemIndex === index ? { ...subject, [key]: value } : subject
      ),
    }));
  }

  function addSubject() {
    setForm(current => ({ ...current, subjects: [...current.subjects, { ...emptySubject }] }));
  }

  function removeSubject(index) {
    setForm(current => ({
      ...current,
      subjects: current.subjects.length === 1
        ? current.subjects
        : current.subjects.filter((_, itemIndex) => itemIndex !== index),
    }));
  }

  function validate() {
    const validSubjects = form.subjects.filter(subject => subject.name.trim() && subject.exam_date);
    if (!validSubjects.length) return "Add at least one subject with an exam date.";
    if (validSubjects.some(subject => subject.exam_date < today)) return "Exam dates must be today or later.";
    if (Number(form.daily_hours) < 0.5) return "Daily study hours must be at least 0.5.";
    return "";
  }

  async function generate(event) {
    event?.preventDefault();
    const validation = validate();
    if (validation) {
      setMessage(validation);
      return;
    }

    setLoading(true);
    setMessage("");
    try {
      const validSubjects = form.subjects
        .filter(subject => subject.name.trim() && subject.exam_date)
        .map(subject => ({
          ...subject,
          name: subject.name.trim(),
          weak_topics: subject.weak_topics.trim(),
        }));

      const { data } = await api.post("/study-plans/generate/", {
        title: "AI Smart Study Schedule",
        start_date: today,
        days: Number(form.days),
        daily_hours: Number(form.daily_hours),
        preferred_study_time: form.preferred_study_time,
        break_duration: Number(form.break_duration),
        subjects: validSubjects,
      });
      setPlan(data);
      await loadPlans();
      setMessage("Schedule generated and saved.");
    } catch (err) {
      setMessage(getApiErrorMessage(err, "Could not generate the schedule."));
    } finally {
      setLoading(false);
    }
  }

  function dragStart(event, sessionId) {
    setDraggedSession(sessionId);
    event.dataTransfer.setData("text/plain", String(sessionId));
  }

  async function dropSession(event, date) {
    event.preventDefault();
    const sessionId = draggedSession || Number(event.dataTransfer.getData("text/plain"));
    if (!sessionId) return;
    try {
      const { data } = await api.patch(`/study-sessions/${sessionId}/`, { date });
      setPlan(current => ({
        ...current,
        sessions: current.sessions.map(session => session.id === data.id ? data : session),
      }));
      setMessage("Schedule adjusted.");
    } catch (err) {
      setMessage(getApiErrorMessage(err, "Could not move that session."));
    } finally {
      setDraggedSession(null);
    }
  }

  if (booting) return <SmartScheduleSkeleton />;

  return (
    <div className="smart-schedule page-content">
      <section className="panel smart-schedule-hero">
        <div>
          <span className="eyebrow"><Sparkles size={14} /> AI schedule generator</span>
          <h2>Build an exam-focused study schedule</h2>
          <p>Prioritizes weak topics, balances difficulty, increases revision near exam dates, and inserts automatic breaks.</p>
        </div>
        <div className="smart-schedule-hero__metric">
          <strong>{sessions.length || "--"}</strong>
          <span>saved blocks</span>
        </div>
      </section>

      {message && <p className={message.toLowerCase().includes("could") || message.toLowerCase().includes("must") || message.toLowerCase().includes("add") ? "error planning-message" : "success planning-message"}>{message}</p>}

      <section className="smart-schedule-grid">
        <form className="panel smart-schedule-form" onSubmit={generate}>
          <div className="planning-section-title">
            <h2>Study Inputs</h2>
            <button type="button" className="secondary" onClick={addSubject}><Plus size={16} /> Subject</button>
          </div>

          <div className="smart-schedule-settings">
            <label>Daily hours
              <input type="number" min="0.5" max="12" step="0.5" value={form.daily_hours} onChange={e => setForm({ ...form, daily_hours: e.target.value })} />
            </label>
            <label>Preferred time
              <input type="time" value={form.preferred_study_time} onChange={e => setForm({ ...form, preferred_study_time: e.target.value })} />
            </label>
            <label>Break duration
              <input type="number" min="0" max="45" step="5" value={form.break_duration} onChange={e => setForm({ ...form, break_duration: e.target.value })} />
            </label>
            <label>Plan length
              <select value={form.days} onChange={e => setForm({ ...form, days: e.target.value })}>
                <option value="7">1 week</option>
                <option value="14">2 weeks</option>
                <option value="21">3 weeks</option>
                <option value="30">30 days</option>
              </select>
            </label>
          </div>

          <div className="smart-subject-list">
            {form.subjects.map((subject, index) => (
              <article className="smart-subject-card" key={index}>
                <div className="smart-subject-card__top">
                  <strong>Subject {index + 1}</strong>
                  <button type="button" className="icon-button" onClick={() => removeSubject(index)} aria-label="Remove subject">
                    <Trash2 size={16} />
                  </button>
                </div>
                <input placeholder="Subject name" value={subject.name} onChange={e => updateSubject(index, "name", e.target.value)} />
                <div className="smart-subject-card__row">
                  <input type="date" min={today} value={subject.exam_date} onChange={e => updateSubject(index, "exam_date", e.target.value)} />
                  <select value={subject.difficulty} onChange={e => updateSubject(index, "difficulty", e.target.value)}>
                    <option value="low">Low difficulty</option>
                    <option value="medium">Medium difficulty</option>
                    <option value="high">High difficulty</option>
                  </select>
                </div>
                <textarea placeholder="Weak topics, comma separated" value={subject.weak_topics} onChange={e => updateSubject(index, "weak_topics", e.target.value)} />
                <span className={`smart-priority smart-priority--${getSubjectPriority(subject).toLowerCase()}`}>{getSubjectPriority(subject)} priority</span>
              </article>
            ))}
          </div>

          <div className="smart-schedule-actions">
            <button disabled={loading}>{loading ? <Loader2 className="spin-icon" size={18} /> : <Save size={18} />} Generate & Save</button>
            <button type="button" className="secondary" disabled={loading} onClick={generate}><RefreshCw size={18} /> Regenerate</button>
          </div>
        </form>

        <aside className="smart-schedule-side">
          <section className="panel">
            <div className="planning-section-title">
              <h2>Subject Priority</h2>
              <Brain size={18} />
            </div>
            {form.subjects.map((subject, index) => (
              <div className="smart-priority-row" key={`${subject.name}-${index}`}>
                <span>{subject.name || "Untitled subject"}</span>
                <strong>{getSubjectPriority(subject)}</strong>
              </div>
            ))}
          </section>
          <section className="panel">
            <div className="planning-section-title">
              <h2>Saved Schedules</h2>
              <CalendarDays size={18} />
            </div>
            <div className="smart-saved-list">
              {plans.slice(0, 4).map(item => (
                <button type="button" className={plan?.id === item.id ? "is-active" : ""} key={item.id} onClick={() => setPlan(item)}>
                  <strong>{item.title}</strong>
                  <span>{item.start_date} to {item.end_date}</span>
                </button>
              ))}
              {!plans.length && <p className="empty">Generated schedules will appear here after saving.</p>}
            </div>
          </section>
        </aside>
      </section>

      <section className="smart-schedule-output">
        <div className="planning-section-title">
          <h2>Weekly Calendar</h2>
          <span>Drag cards between days to adjust the plan</span>
        </div>
        {loading ? (
          <SmartScheduleSkeleton />
        ) : plan ? (
          <div className="smart-week-grid">
            {dates.map(date => (
              <article className="smart-week-day" key={date} onDragOver={event => event.preventDefault()} onDrop={event => dropSession(event, date)}>
                <strong>{date}</strong>
                {sessionsByDate[date].map(session => (
                  <button
                    type="button"
                    draggable
                    className={`smart-session-card ${sessionTone(session.task_type)}`}
                    key={session.id}
                    onDragStart={event => dragStart(event, session.id)}
                  >
                    <GripVertical size={14} />
                    <span>{session.start_time?.slice(0, 5)}-{session.end_time?.slice(0, 5)}</span>
                    <b>{session.title}</b>
                    <small>{session.task_type}</small>
                  </button>
                ))}
              </article>
            ))}
          </div>
        ) : (
          <div className="panel smart-empty-state">
            <CalendarDays size={32} />
            <h2>No AI schedule yet</h2>
            <p>Add your subjects, exam dates, weak topics, study hours, preferred time, and break duration to generate a saved weekly plan.</p>
          </div>
        )}
      </section>
    </div>
  );
}

function SmartScheduleSkeleton() {
  return (
    <div className="smart-schedule page-content">
      <section className="panel planning-skeleton" aria-label="Loading smart schedule">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index}>
            <span />
            <strong />
            <p />
          </div>
        ))}
      </section>
    </div>
  );
}

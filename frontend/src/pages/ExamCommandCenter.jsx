import { useEffect, useMemo, useState } from "react";
import { BarChart3, CalendarDays, Clock, Gauge, Sparkles, AlertTriangle } from "lucide-react";
import { api } from "../services/api";

function formatCountdown(targetIso) {
  if (!targetIso) return "--:--:--";
  const target = new Date(targetIso);
  const now = new Date();
  const diff = Math.max(0, target.getTime() - now.getTime());
  const s = Math.floor(diff / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return d > 0 ? `${d}d ${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}` : `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

function urgencyBadge(score) {
  if (score >= 80) return { className: "priority-pill priority-pill--high", text: "High Urgency" };
  if (score >= 55) return { className: "priority-pill priority-pill--medium", text: "Medium Urgency" };
  return { className: "priority-pill priority-pill--low", text: "Low Urgency" };
}

export default function ExamCommandCenter() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  const [selectedExam, setSelectedExam] = useState(null);

  const upcoming = data?.upcoming_exams || [];

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await api.get("/exam-command/");
        if (!alive) return;
        setData(res.data);
        const first = res.data?.upcoming_exams?.[0] || null;
        setSelectedExam(first);
      } catch (e) {
        if (!alive) return;
        setError(e?.response?.data?.detail || "Failed to load Exam Command Center." );
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const readiness = selectedExam?.readiness || 0;
  const urgency = urgencyBadge(selectedExam?.urgency_score ?? 0);

  const countdown = useMemo(() => {
    const examDateIso = selectedExam?.exam_date_iso;
    return formatCountdown(examDateIso);
  }, [selectedExam]);

  useEffect(() => {
    if (!selectedExam?.exam_date_iso) return;
    const id = setInterval(() => {
      // triggers rerender via state noop using countdown stored in memo isn’t reactive; use a tick.
      setData((prev) => prev);
    }, 1000);
    return () => clearInterval(id);
  }, [selectedExam?.exam_date_iso]);

  async function triggerAiPlan() {
    try {
      setError("");
      const payload = {
        exam_subject_id: selectedExam?.subject_id,
        horizon_days: 7,
      };
      const res = await api.post("/exam-command/generate-last-minute/", payload);
      setSelectedExam((prev) => ({ ...prev, last_minute_plan: res.data?.last_minute_plan }));
    } catch (e) {
      setError(e?.response?.data?.detail || "AI revision planning failed.");
    }
  }

  if (loading) return <p className="empty">Loading Exam Command Center…</p>;
  if (error) return <p className="error">{error}</p>;
  if (!data) return <p className="empty">No upcoming exams found. Add subjects with exam dates first.</p>;

  return (
    <div className="page-content">
      <section className="planning-page">
        <div className="panel" style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
            <div>
              <div className="status-pill" style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
                <Gauge size={16} /> Exam Readiness
              </div>
              <h2 style={{ marginTop: 10, marginBottom: 6, display: "flex", gap: 10, alignItems: "baseline" }}>
                {selectedExam?.subject_name || "—"}
                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>— {readiness}%</span>
              </h2>
              <p className="note" style={{ borderLeftColor: "#226f54" }}>
                {selectedExam?.pressure_analysis || "Exam pressure analysis will appear here."}
              </p>
            </div>
            <div style={{ minWidth: 260 }}>
              <div className="planning-analytics" style={{ gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
                <div className="panel" style={{ padding: 14 }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <Clock size={18} /> <strong style={{ fontSize: 22 }}>{countdown}</strong>
                  </div>
                  <div style={{ color: "var(--text-muted)", fontSize: 12, marginTop: 4 }}>Countdown to exam</div>
                </div>
                <div className="panel" style={{ padding: 14 }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <AlertTriangle size={18} /> <strong style={{ fontSize: 22 }}>{selectedExam?.urgency_score ?? 0}%</strong>
                  </div>
                  <div className={urgency.className} style={{ marginTop: 8 }}>{urgency.text}</div>
                </div>
              </div>
              <div style={{ marginTop: 12 }}>
                <button onClick={triggerAiPlan}><Sparkles size={18} /> Generate last‑minute plan</button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid two" style={{ alignItems: "start" }}>
          <div className="panel">
            <div className="planning-section-title">
              <h2 style={{ margin: 0 }}>Upcoming exams timeline</h2>
              <CalendarDays size={18} />
            </div>
            <div className="list">
              {upcoming.map((exam) => (
                <article
                  key={exam.subject_id}
                  className="panel item"
                  style={{ cursor: "pointer", borderColor: selectedExam?.subject_id === exam.subject_id ? "#51d394" : "var(--border-color)", background: selectedExam?.subject_id === exam.subject_id ? "rgba(81,211,148,0.10)" : undefined }}
                  onClick={() => setSelectedExam(exam)}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
                    <div>
                      <h2 style={{ margin: "0 0 4px 0", fontSize: 16 }}>{exam.subject_name}</h2>
                      <p style={{ margin: 0 }}>Exam in {exam.days_remaining} day(s)</p>
                      <p style={{ marginTop: 6 }} className="progress-row"><span style={{ fontWeight: 900, color: "var(--text-muted)" }}>Readiness</span><span style={{ color: "#226f54", fontWeight: 900 }}>{exam.readiness}%</span></p>
                    </div>
                    <div>
                      <div className={urgencyBadge(exam.urgency_score ?? 0).className}>
                        {urgencyBadge(exam.urgency_score ?? 0).text}
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="panel">
            <div className="planning-section-title">
              <h2 style={{ margin: 0 }}>AI exam command insights</h2>
              <BarChart3 size={18} />
            </div>

            <div className="stats" style={{ gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
              <div className="panel" style={{ padding: 14 }}>
                <div style={{ color: "var(--text-muted)", fontSize: 12, fontWeight: 800 }}>Syllabus completion tracker</div>
                <strong style={{ fontSize: 28 }}>{selectedExam?.syllabus_completion_pct ?? 0}%</strong>
                <div style={{ color: "var(--text-muted)", fontSize: 12, marginTop: 6 }}>{selectedExam?.syllabus_completion_reason || "—"}</div>
              </div>
              <div className="panel" style={{ padding: 14 }}>
                <div style={{ color: "var(--text-muted)", fontSize: 12, fontWeight: 800 }}>Performance forecasting</div>
                <strong style={{ fontSize: 28 }}>{selectedExam?.forecast_score ?? 0}%</strong>
                <div style={{ color: "var(--text-muted)", fontSize: 12, marginTop: 6 }}>{selectedExam?.forecast_reason || "—"}</div>
              </div>
            </div>

            <div style={{ marginTop: 14 }}>
              <h2 style={{ fontSize: 16, marginBottom: 10 }}>AI revision strategy</h2>
              <div className="list">
                {(selectedExam?.ai_strategy || []).map((x, idx) => (
                  <p className="session" key={idx} style={{ margin: 0, borderTop: "1px solid #edf2ef", paddingTop: 10 }}>
                    <strong>{x.title}</strong> — {x.detail}
                  </p>
                ))}
                {!selectedExam?.ai_strategy?.length && <p className="empty">Strategy will be calculated from your readiness and weak topics.</p>}
              </div>
            </div>

            <div style={{ marginTop: 14 }}>
              <h2 style={{ fontSize: 16, marginBottom: 10 }}>Important topics prediction</h2>
              <div className="list">
                {(selectedExam?.predicted_topics || []).map((t) => (
                  <p className="session" key={t.topic_id} style={{ margin: 0 }}>
                    <strong>{t.topic}</strong>
                    <span style={{ marginLeft: 10 }} className={urgencyBadge(t.importance ?? 0).className}>{t.importance ?? 0}% importance</span>
                  </p>
                ))}
                {!selectedExam?.predicted_topics?.length && <p className="empty">No predicted topics yet—add weak topics or study logs.</p>}
              </div>
            </div>

            <div style={{ marginTop: 14 }}>
              <h2 style={{ fontSize: 16, marginBottom: 10 }}>Last-minute revision planner</h2>
              <div className="list">
                {(selectedExam?.last_minute_plan || []).map((p, idx) => (
                  <p className="session" key={idx} style={{ margin: 0 }}>
                    <strong>{p.day_label}</strong> — {p.focus}
                  </p>
                ))}
                {!selectedExam?.last_minute_plan?.length && <p className="empty">Click “Generate last‑minute plan” to populate this section.</p>}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}


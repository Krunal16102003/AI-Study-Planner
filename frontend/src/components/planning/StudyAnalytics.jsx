import { BarChart3, CalendarClock, CheckCircle2, Clock, Sparkles, Target } from "lucide-react";
import { motion } from "framer-motion";
import { useMemo } from "react";
import DashboardCard from "./DashboardCard";

const placeholderStudyPatterns = Array.from({ length: 7 }).map((_, i) => {
  const date = new Date();
  date.setDate(date.getDate() - (6 - i));
  return {
    day: date.toISOString().split("T")[0],
    minutes: [28, 46, 34, 72, 58, 84, 52][i],
    completed_logs: i % 3,
  };
});

const placeholderSubjectPerformance = [
  { subject: "Physics", readiness: 65, completion: 70, quiz_average: 75, study_minutes: 180 },
  { subject: "Mathematics", readiness: 78, completion: 85, quiz_average: 80, study_minutes: 240 },
  { subject: "Chemistry", readiness: 50, completion: 40, quiz_average: 60, study_minutes: 120 },
];

function getPlaceholderAnalytics() {
  return {
    study_patterns: placeholderStudyPatterns,
    completion_rate: 0,
    focus_sessions: 0,
    focus_minutes: 0,
    consistency_streak: 0,
    subject_performance: placeholderSubjectPerformance,
  };
}

export default function StudyAnalytics({ summary, analytics, loading = false }) {
  const hasRealStudyPattern = Boolean(analytics?.study_patterns?.length);
  const hasRealSubjects = Boolean(analytics?.subject_performance?.length);
  const displayAnalytics = useMemo(() => {
    if (analytics?.success && (hasRealStudyPattern || hasRealSubjects)) return analytics;
    return getPlaceholderAnalytics();
  }, [analytics, hasRealStudyPattern, hasRealSubjects]);

  const stats = [
    ["Study Time", `${summary?.dailyTarget ?? 0}h`, Clock],
    ["Accuracy", `${displayAnalytics?.completion_rate ?? 0}%`, Target],
    ["Efficiency", `${displayAnalytics?.learning_efficiency ?? 0}%`, Sparkles],
    ["Streak", `${displayAnalytics?.consistency_streak ?? 0} days`, CheckCircle2],
    ["Total Plans", summary?.totalPlans ?? 0, CalendarClock],
    ["Completed Sessions", summary?.completedSessions ?? 0, CheckCircle2],
    ["Average Progress", `${summary?.averageProgress ?? 0}%`, BarChart3],
    ["Focus Minutes", displayAnalytics?.focus_minutes ?? 0, Clock],
  ];

  const aiInsight = useMemo(() => {
    if (displayAnalytics.subject_performance?.length) {
      const weakest = displayAnalytics.subject_performance.reduce((prev, current) =>
        prev.readiness < current.readiness ? prev : current
      );
      const strongest = displayAnalytics.subject_performance.reduce((prev, current) =>
        prev.readiness > current.readiness ? prev : current
      );

      if (weakest.readiness < 60) {
        return `AI suggests focusing on ${weakest.subject} this week. Your readiness is ${weakest.readiness}%.`;
      }
      if (displayAnalytics.consistency_streak > 3) {
        return `Great consistency. Your streak is ${displayAnalytics.consistency_streak} days.`;
      }
      if (strongest.readiness > 85) {
        return `Excellent progress in ${strongest.subject}. Consider a mock test.`;
      }
    }
    return displayAnalytics?.ai_insights?.[0] || "AI insights will sharpen as you complete study sessions, quizzes, and revision tasks.";
  }, [displayAnalytics]);

  return (
    <>
      <section className="planning-analytics premium-kpi-grid">
        {stats.map(([label, value, Icon], index) => (
          <motion.article
            className="panel dashboard-card planning-stat premium-kpi-card"
            key={label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04 }}
          >
            <div>
              <span>{label}</span>
              <strong className={loading ? "is-loading-text" : ""}>
                {loading ? "..." : value === "0%" || value === 0 || value === "0 days" ? "--" : value}
              </strong>
            </div>
            <Icon size={24} />
          </motion.article>
        ))}
      </section>

      <section className="grid two dashboard-extra premium-dashboard-grid">
        <DashboardCard as={motion.div} className="premium-dashboard-card study-pattern-card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <div className="card-heading">
            <div>
              <span>Weekly Analytics</span>
              <h2>Study Pattern</h2>
            </div>
            <BarChart3 size={20} />
          </div>
          {hasRealStudyPattern ? (
            <div className="chart-bars premium-chart-bars">
              {displayAnalytics.study_patterns.map(day => (
                <div className="bar" key={day.day}>
                  <motion.span initial={{ height: 0 }} animate={{ height: `${Math.max(day.minutes / 2, 10)}px` }} transition={{ duration: 0.55 }} />
                  <small>{day.day.slice(5)}</small>
                </div>
              ))}
            </div>
          ) : (
            <motion.div className="study-empty-state" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}>
              <div className="empty-orbit"><Clock size={34} /></div>
              <strong>No study history yet.</strong>
              <span>Start a session!</span>
              <a className="glow-action" href="/focus">Start Focus Session</a>
            </motion.div>
          )}
        </DashboardCard>

        <DashboardCard as={motion.div} className="premium-dashboard-card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
          <div className="card-heading">
            <div>
              <span>Mastery Map</span>
              <h2>Subject Performance</h2>
            </div>
            <Target size={20} />
          </div>
          {(hasRealSubjects ? displayAnalytics.subject_performance : placeholderSubjectPerformance).map(subject => (
            <ProgressRow key={subject.subject} label={subject.subject} value={subject.readiness}
              detail={`${subject.study_minutes} min - quiz ${subject.quiz_average}%`} />
          ))}
        </DashboardCard>
      </section>

      <DashboardCard className="dashboard-extra premium-dashboard-card ai-insight-panel">
        <div className="ai-insight-panel__content">
          <div>
            <span className="ai-dashboard-eyebrow"><Sparkles size={14} /> AI Insights</span>
            <h2 className="flex items-center gap-2">Smart Study Recommendations</h2>
            <p className="note">{aiInsight}</p>
          </div>
          <div className="ai-hologram" aria-hidden="true">
            <span /><span /><span /><span /><i />
          </div>
        </div>
        {displayAnalytics?.ai_insights?.length > 1 && (
          <div className="ai-insight-list">
            {displayAnalytics.ai_insights.slice(1, 4).map((insight) => (
              <p key={insight}>{insight}</p>
            ))}
          </div>
        )}
      </DashboardCard>
    </>
  );
}

function ProgressRow({ label, value, detail }) {
  return (
    <motion.div className="progress-row premium-progress-row" whileHover={{ x: 4 }}>
      <div><strong>{label}</strong><span>{detail}</span></div>
      <div className="gradient-meter">
        <motion.span initial={{ width: 0 }} animate={{ width: `${Math.min(100, Math.max(0, value))}%` }} transition={{ duration: 0.7 }} />
      </div>
    </motion.div>
  );
}

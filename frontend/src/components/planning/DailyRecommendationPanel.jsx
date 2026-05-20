import { useEffect, useMemo, useState } from "react";
import { Brain, Clock, RefreshCw, Sparkles, Target } from "lucide-react";
import { api, getApiErrorMessage } from "../../services/api";
import DashboardCard from "./DashboardCard";

function priorityLabel(priority) {
  return priority === "high" ? "High priority" : priority === "low" ? "Light priority" : "Balanced priority";
}

export default function DailyRecommendationPanel({ username = "Student" }) {
  const [recommendation, setRecommendation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  }, []);

  async function load(method = "get") {
    setLoading(true);
    setError("");
    try {
      const { data } = method === "post"
        ? await api.post("/daily-recommendation/")
        : await api.get("/daily-recommendation/");
      setRecommendation(data);
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not prepare today's recommendation."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  if (loading) {
    return (
      <DashboardCard className="daily-ai-card daily-ai-card--loading">
        <div className="daily-ai-skeleton"><span /><strong /><p /><p /></div>
      </DashboardCard>
    );
  }

  if (error) {
    return (
      <DashboardCard className="daily-ai-card">
        <div className="daily-ai-heading">
          <span className="eyebrow"><Sparkles size={14} /> Daily AI plan</span>
          <button type="button" className="secondary" onClick={() => load("post")}><RefreshCw size={16} /> Retry</button>
        </div>
        <p className="error">{error}</p>
      </DashboardCard>
    );
  }

  const timeline = recommendation?.timeline || [];

  return (
    <DashboardCard className="daily-ai-card">
      <div className="daily-ai-heading">
        <div>
          <span className="eyebrow"><Sparkles size={14} /> Daily AI plan</span>
          <h2>{recommendation?.title || "Today's study plan"}</h2>
        </div>
        <button type="button" className="secondary" onClick={() => load("post")}><RefreshCw size={16} /> Regenerate</button>
      </div>

      <div className="daily-ai-body">
        <div className="daily-ai-main">
          <span className={`daily-priority daily-priority--${recommendation.priority || "medium"}`}>
            {priorityLabel(recommendation.priority)}
          </span>
          <h3>{recommendation.title || "Today's study recommendation"}</h3>
          <p>{recommendation.recommendation}</p>
          <div className="daily-ai-metrics">
            <span><Clock size={16} /> {recommendation.estimated_minutes || 45} min</span>
            <span><Target size={16} /> {recommendation.confidence || 60}% confidence</span>
            <span><Brain size={16} /> {recommendation.study_focus}</span>
          </div>
        </div>

        <div className="daily-ai-timeline">
          {timeline.length ? timeline.map((item, index) => (
            <article key={`${item.label}-${index}`}>
              <b>{index + 1}</b>
              <div>
                <strong>{item.label}</strong>
                <p>{item.task}</p>
              </div>
              <span>{item.minutes}m</span>
            </article>
          )) : (
            <p className="empty">Add subjects and weak topics to unlock a personalized study timeline.</p>
          )}
        </div>
      </div>
    </DashboardCard>
  );
}

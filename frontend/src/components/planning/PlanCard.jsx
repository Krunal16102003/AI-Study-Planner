import { CalendarDays, Edit3, Play, RefreshCcw, Trash2 } from "lucide-react";
import ProgressTracker from "./ProgressTracker";

export default function PlanCard({ plan, onEdit, onDelete, onStart, onComplete, onRevision, onQuiz }) {
  return (
    <article className="panel plan-card">
      <div className="plan-card__top">
        <div>
          <span className={`status-pill status-pill--${plan.statusKey}`}>{plan.status}</span>
          <h3>{plan.title}</h3>
          <p>{plan.subjects || "No subject linked yet"}</p>
        </div>
        <span className={`priority-pill priority-pill--${plan.priority}`}>{plan.priorityLabel}</span>
      </div>
      <div className="plan-card__details">
        <p><CalendarDays size={16} /> {plan.start_date} to {plan.end_date}</p>
        <p><strong>Exam:</strong> {plan.nextExam || "Not scheduled"}</p>
        <p><strong>Weak topics:</strong> {plan.weakTopicSummary || "None added"}</p>
      </div>
      <ProgressTracker value={plan.completion} status={plan.revisionStatus} />
      <div className="plan-card__actions">
        <button type="button" onClick={() => onStart(plan)}><Play size={16} /> Start</button>
        <button type="button" className="secondary" onClick={() => onComplete(plan)}>Complete Topic</button>
        <button type="button" className="secondary" onClick={() => onRevision(plan)}><RefreshCcw size={16} /> Revision</button>
        <button type="button" className="secondary" onClick={() => onQuiz(plan)}>Quiz</button>
        <button type="button" className="secondary" onClick={() => onEdit(plan)} aria-label={`Edit ${plan.title}`}><Edit3 size={16} /></button>
        <button type="button" className="secondary" onClick={() => onDelete(plan)} aria-label={`Delete ${plan.title}`}><Trash2 size={16} /></button>
      </div>
    </article>
  );
}

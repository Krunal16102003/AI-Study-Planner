import { motion } from "framer-motion";
import {
  Atom,
  BookOpen,
  CalendarDays,
  Calculator,
  CheckCircle2,
  CircleDot,
  Edit3,
  Flag,
  MoreHorizontal,
  Play,
  RefreshCcw,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Zap,
} from "lucide-react";

const columns = [
  ["title", "Subject", BookOpen],
  ["nextExam", "Exam Date", CalendarDays],
  ["priority", "Priority", Flag],
  ["completion", "Progress", CircleDot],
  ["status", "Status", CheckCircle2],
  ["recommendation", "AI Recommendation", Sparkles],
  ["actions", "Quick Actions", Zap],
];

function subjectIcon(subjects = "") {
  const text = subjects.toLowerCase();
  if (text.includes("bio")) return Atom;
  if (text.includes("physics")) return Atom;
  if (text.includes("math") || text.includes("calculus") || text.includes("algebra")) return Calculator;
  return BookOpen;
}

function formatReadableDate(value) {
  if (!value) return "No date set";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function priorityIcon(priority) {
  if (priority === "high") return TrendingUp;
  if (priority === "low") return TrendingDown;
  return Flag;
}

function sortLabel(sort, key) {
  if (sort.key !== key) return "";
  return sort.direction === "asc" ? " ↑" : " ↓";
}

export default function PlanTable({ plans, sort, onSort, onEdit, onDelete, onStart, onComplete, onRevision, onQuiz }) {
  return (
    <section className="modern-plan-list" aria-label="Study plan list">
      <div className="modern-plan-list__header">
        {columns.map(([key, label, Icon]) => (
          <button
            type="button"
            key={key}
            className="modern-plan-list__heading"
            onClick={() => key !== "actions" && onSort(key)}
            disabled={key === "actions"}
          >
            <Icon size={15} />
            <span>{label}{sortLabel(sort, key)}</span>
          </button>
        ))}
      </div>

      <div className="modern-plan-list__rows">
        {plans.map((plan, index) => {
          const SubjectIcon = subjectIcon(plan.subjects);
          const PriorityIcon = priorityIcon(plan.priority);
          const progress = Math.min(100, Math.max(0, Number(plan.completion) || 0));

          return (
            <motion.article
              className="modern-plan-row"
              key={plan.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.24, delay: index * 0.03 }}
              whileHover={{ y: -3 }}
            >
              <div className="modern-plan-subject" data-label="Subject">
                <span className={`modern-plan-subject__icon modern-plan-subject__icon--${plan.priority}`}>
                  <SubjectIcon size={20} />
                </span>
                <div>
                  <strong>{plan.subjects || plan.title || "No subject linked"}</strong>
                  <p>{plan.weakTopicSummary || plan.title || "Add weak topics to personalize this plan."}</p>
                </div>
              </div>

              <div className="modern-plan-date" data-label="Exam Date">
                <CalendarDays size={17} />
                <div>
                  <strong>{plan.nextExam || plan.end_date || "Not set"}</strong>
                  <span>{formatReadableDate(plan.nextExam || plan.end_date)}</span>
                </div>
              </div>

              <div className="modern-plan-priority" data-label="Priority">
                <span className={`modern-priority-badge modern-priority-badge--${plan.priority}`}>
                  <PriorityIcon size={14} />
                  {plan.priorityLabel}
                </span>
              </div>

              <div className="modern-plan-progress" data-label="Progress">
                <div>
                  <strong>{progress}%</strong>
                  <span>{plan.revisionStatus || "On Track"}</span>
                </div>
                <div className="modern-progress-track" aria-label={`${progress}% complete`}>
                  <motion.span
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                  />
                </div>
              </div>

              <div className="modern-plan-status" data-label="Status">
                <span className={`modern-status-badge modern-status-badge--${plan.statusKey}`}>
                  <CheckCircle2 size={14} />
                  {plan.status}
                </span>
              </div>

              <div className="modern-plan-ai" data-label="AI Recommendation">
                <Sparkles size={16} />
                <p>{plan.recommendation}</p>
              </div>

              <div className="modern-plan-actions" data-label="Quick Actions">
                <motion.button type="button" className="modern-action modern-action--primary" whileTap={{ scale: 0.96 }} onClick={() => onStart(plan)}>
                  <Play size={15} />
                  <span>Start</span>
                </motion.button>
                <motion.button type="button" className="modern-action" whileTap={{ scale: 0.96 }} onClick={() => onComplete(plan)}>
                  <CheckCircle2 size={15} />
                  <span>Done</span>
                </motion.button>
                <motion.button type="button" className="modern-action" whileTap={{ scale: 0.96 }} onClick={() => onQuiz(plan)}>
                  <Sparkles size={15} />
                  <span>Quiz</span>
                </motion.button>
                <motion.button type="button" className="modern-action modern-action--icon" whileTap={{ scale: 0.96 }} aria-label="Edit plan" onClick={() => onEdit(plan)}>
                  <Edit3 size={15} />
                </motion.button>
                <motion.button type="button" className="modern-action modern-action--icon" whileTap={{ scale: 0.96 }} aria-label="Generate revision plan" onClick={() => onRevision(plan)}>
                  <RefreshCcw size={15} />
                </motion.button>
                <motion.button type="button" className="modern-action modern-action--icon" whileTap={{ scale: 0.96 }} aria-label="More actions" onClick={() => onDelete(plan)}>
                  <MoreHorizontal size={16} />
                </motion.button>
              </div>
            </motion.article>
          );
        })}
      </div>

      {!plans.length && <p className="empty">No plans match the current filters.</p>}
    </section>
  );
}

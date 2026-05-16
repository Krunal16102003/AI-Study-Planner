import { useState, useEffect, useMemo, useCallback } from "react";
import { Download, FileSpreadsheet, Plus, Search } from "lucide-react";
import { api } from "../../services/api";
import CalendarView from "./CalendarView";
import DailyRecommendationPanel from "./DailyRecommendationPanel";
import DeleteConfirmationModal from "./DeleteConfirmationModal";
import ErrorScreen from "../ErrorScreen";
import EditPlanModal from "./EditPlanModal";
import NotificationPanel from "./NotificationPanel";
import OnboardingAnalytics from "./OnboardingAnalytics";
import PlanCard from "./PlanCard";
import PlanTable from "./PlanTable";
import StudyAnalytics from "./StudyAnalytics";


const PAGE_SIZE = 5;

function responseData(result, fallback) {
  return result.status === "fulfilled" ? result.value.data : fallback;
}

function listData(result) {
  const data = responseData(result, []);
  return Array.isArray(data) ? data : data.results || [];
}

function daysUntil(date) {
  if (!date) return 9999;
  const today = new Date();
  const target = new Date(`${date}T00:00:00`);
  today.setHours(0, 0, 0, 0);
  return Math.ceil((target - today) / 86400000);
}

function getPlanStatus(plan, completion) {
  const overdue = daysUntil(plan.end_date) < 0;
  if (completion >= 100) return ["Completed", "completed"];
  if (overdue) return ["Missed", "missed"];
  if (completion > 0) return ["In Progress", "in-progress"];
  return ["Pending", "pending"];
}

function priorityFromPlan(plan, subjects) {
  const planSubjects = subjects.filter(subject => plan.sessions?.some(session => session.subject === subject.id));
  if (planSubjects.some(subject => subject.priority === "high" || daysUntil(subject.exam_date) <= 7)) return "high";
  if (planSubjects.some(subject => subject.priority === "medium" || daysUntil(subject.exam_date) <= 21)) return "medium";
  return "low";
}

function priorityLabel(priority) {
  return `${priority.charAt(0).toUpperCase()}${priority.slice(1)}`;
}

function recommendationFor(plan, completion, priority) {
  if (completion >= 100) return "AI: Review summary notes and attempt a mixed quiz.";
  if (priority === "high") return "AI: Move this plan to the top and revise weak topics today.";
  if (completion < 35) return "AI: Start with a short focus block and one quick quiz.";
  return "AI: Keep the current pace and schedule spaced revision.";
}

export default function PlanningDashboard() {
  const [plans, setPlans] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [apiError, setApiError] = useState(null);
  const [editingPlan, setEditingPlan] = useState(null);
  const [deletePlan, setDeletePlan] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [view, setView] = useState("table");
  const [page, setPage] = useState(1);
  const [draggedSession, setDraggedSession] = useState(null);
  const [filters, setFilters] = useState({
    search: "",
    priority: "all",
    status: "all",
    exam: "all",
  });
  const [sort, setSort] = useState({ key: "nextExam", direction: "asc" });

  const loadInsights = useCallback(async (signal) => {
    setInsightsLoading(true);
    const [dashboardRes, analyticsRes] = await Promise.allSettled([
      api.get("/dashboard/", { signal }),
      api.get("/analytics/", { signal }),
    ]);

    if (signal?.aborted) return;

    setDashboard(responseData(dashboardRes, { upcoming_exams: [], revision_schedule: [] }));
    setAnalytics(responseData(analyticsRes, { completion_rate: 0 }));
    if (dashboardRes.status === "rejected" || analyticsRes.status === "rejected") {
      // Analytics insights might be unavailable, but the dashboard should still load.
    }
    setInsightsLoading(false);
  }, []);

  const load = useCallback(async (signal) => {
    setLoading(true);
    setApiError(null);
    const [planRes, subjectRes] = await Promise.allSettled([
      api.get("/study-plans/", { signal }),
      api.get("/subjects/", { signal }),
    ]);

    if (signal?.aborted) return;

    if (planRes.status === "rejected" || subjectRes.status === "rejected") {
      setApiError({
        title: "Workspace loading failure",
        detail: "We couldn't retrieve your planning records. Please ensure your backend is running."
      });
      setLoading(false);
      return;
    }

    setPlans(listData(planRes));
    setSubjects(listData(subjectRes));

    setLoading(false);
    loadInsights(signal);
  }, [loadInsights]);

  useEffect(() => { 
    const controller = new AbortController();
    load(controller.signal); 
    return () => controller.abort();
  }, [load]);

  useEffect(() => {
    if (message && !message.toLowerCase().includes("error") && !message.toLowerCase().includes("could not")) {
      const timer = setTimeout(() => setMessage(""), 5000); // Clear success messages after 5s
      return () => clearTimeout(timer);
    }
  }, [message]);


  const enrichedPlans = useMemo(() => {
    return plans.map(plan => {
      const sessions = Array.isArray(plan.sessions) ? plan.sessions : [];
      const completed = sessions.filter(session => session.is_completed).length;
      const completion = sessions.length ? parseFloat((completed / sessions.length * 100).toFixed(1)) : 0;
      const linkedSubjectIds = Array.from(new Set(sessions.map(s => s?.subject).filter(Boolean)));
    const linkedSubjects = subjects.filter(subject => linkedSubjectIds.includes(subject.id)); // Ensure subjects is not null/undefined
      const weakTopics = linkedSubjects.flatMap(subject => subject.weak_topics || []);
      const nextExam = linkedSubjects.map(subject => subject.exam_date).sort()[0] || plan.end_date;
      const priority = priorityFromPlan(plan, subjects);
      const [status, statusKey] = getPlanStatus(plan, completion);
      const revisionStatus = weakTopics.some(topic => !topic.is_completed) ? "Revision Needed" : "On Track";

      return {
        ...plan,
        completion,
        priority,
        priorityLabel: priorityLabel(priority),
        status,
        statusKey,
        nextExam,
        revisionStatus,
        subjects: linkedSubjects.map(subject => subject.name).join(", "),
        weakTopics,
        weakTopicSummary: weakTopics.slice(0, 3).map(topic => topic.title).join(", "),
        recommendation: recommendationFor(plan, completion, priority),
      };
    });
  }, [plans, subjects]);

  const filteredPlans = useMemo(() => {
    const search = filters.search.trim().toLowerCase();
    const rows = enrichedPlans.filter(plan => {
      const matchesSearch = !search || [plan.title, plan.subjects, plan.weakTopicSummary].filter(Boolean).join(" ").toLowerCase().includes(search);
      const matchesPriority = filters.priority === "all" || plan.priority === filters.priority;
      const matchesStatus = filters.status === "all" || plan.statusKey === filters.status;
      const examDays = daysUntil(plan.nextExam);
      const matchesExam =
        filters.exam === "all" ||
        (filters.exam === "week" && examDays <= 7) ||
        (filters.exam === "month" && examDays <= 30) ||
        (filters.exam === "future" && examDays > 30);
      return matchesSearch && matchesPriority && matchesStatus && matchesExam;
    });

    return rows.sort((a, b) => {
      const first = a[sort.key] ?? "";
      const second = b[sort.key] ?? "";
      const result = typeof first === "number" ? first - second : String(first).localeCompare(String(second));
      return sort.direction === "asc" ? result : -result;
    });
  }, [enrichedPlans, filters, sort]);

  const pagedPlans = filteredPlans.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.max(1, Math.ceil(filteredPlans.length / PAGE_SIZE));
  const allSessions = plans.flatMap(plan => plan.sessions || []);

  const summary = useMemo(() => {
    const completedSessions = allSessions.filter(session => session.is_completed).length;
    const averageProgress = enrichedPlans.length
      ? parseFloat((enrichedPlans.reduce((total, plan) => total + Number(plan.completion), 0) / enrichedPlans.length).toFixed(1))
      : 0;
    return {
      totalPlans: plans.length,
      completedSessions,
      averageProgress,
      dailyTarget: dashboard?.total_study_hours ? Math.max(2, Math.round(dashboard.total_study_hours / 7)) : 2, // Default to 2h
      productivity: analytics?.completion_rate ?? averageProgress, // Use ?? for nullish coalescing
    };
  }, [allSessions, analytics, dashboard, enrichedPlans, plans.length]);

  const dailyTarget = {
    targetHours: summary.dailyTarget,
    doneHours: Math.min(summary.dailyTarget, Number((dashboard?.total_study_hours || 0).toFixed(1))),
    completed: Math.min(100, ((dashboard?.total_study_hours || 0) / Math.max(summary.dailyTarget, 1) * 100)).toFixed(1),
  };

  function changeSort(key) {
    setSort(current => ({
      key,
      direction: current.key === key && current.direction === "asc" ? "desc" : "asc",
    }));
  }

  if (apiError) {
    return <ErrorScreen {...apiError} onRetry={() => load()} />;
  }

  function openCreate() {
    setEditingPlan(null);
    setIsModalOpen(true);
  }

  function openEdit(plan) {
    setEditingPlan(plan);
    setIsModalOpen(true);
  }

  async function savePlan(form) {
    try {
      if (editingPlan?.id) {
        await api.patch(`/study-plans/${editingPlan.id}/`, form);
        setMessage("Study plan updated successfully.");
      } else {
        await api.post("/study-plans/", form);
        setMessage("New study plan created successfully.");
      }
      setIsModalOpen(false);
      await load();
    } catch {
      setMessage("Could not save the study plan. Please check the dates and daily hours.");
    }
  }

  async function confirmDelete(plan) {
    try {
      await api.delete(`/study-plans/${plan.id}/`);
      setDeletePlan(null);
      setMessage("Study plan deleted.");
      await load();
    } catch {
      setMessage("Could not delete this study plan.");
    }
  }

  async function startStudySession(plan) {
    const session = plan.sessions?.find(item => !item.is_completed) || plan.sessions?.[0];
    if (!session) {
      setMessage("Add or generate sessions before starting this plan.");
      return;
    }
    setMessage(`Starting study session: ${session.title}`);
  }

  async function markTopicComplete(plan) {
    const session = plan.sessions?.find(item => !item.is_completed);
    const topic = plan.weakTopics?.find(item => !item.is_completed);
    try {
      if (session) await api.patch(`/study-sessions/${session.id}/`, { is_completed: true });
      if (topic) await api.patch(`/weak-topics/${topic.id}/`, { is_completed: true });
      setMessage("Progress updated in real time.");
      await load();
    } catch {
      setMessage("Could not update completion status.");
    }
  }

  async function generateRevisionPlan(plan) {
    try {
      await api.post("/study-plans/generate/", { days: 7, daily_hours: plan.daily_hours || 2 });
      setMessage("AI revision plan generated from your current subjects and weak topics.");
      await load();
    } catch {
      setMessage("Add subjects and weak topics before generating a revision plan.");
    }
  }

  async function generateQuiz(plan) {
    const subjectId = plan.sessions?.find(session => session.subject)?.subject;
    if (!subjectId) {
      setMessage("This plan needs a subject before a quiz can be generated.");
      return;
    }
    try {
      await api.post("/quizzes/generate/", { subject: subjectId, count: 5, difficulty: plan.priority === "high" ? "high" : "medium" });
      setMessage("AI quiz generated for the selected plan subject.");
    } catch {
      setMessage("Could not generate a quiz for this plan.");
    }
  }

  async function generateNotifications() {
    try {
      await api.post("/smart-notifications/");
      setMessage("Smart notifications generated for pending tasks and upcoming exams.");
      await load();
    } catch {
      setMessage("Could not generate notifications right now.");
    }
  }

  function exportCsv() {
    const header = ["Plan ID", "Title", "Subjects", "Exam Date", "Priority", "Completion", "Status", "Daily Hours"];
    const rows = enrichedPlans.map(plan => [plan.id, plan.title, plan.subjects, plan.nextExam, plan.priorityLabel, `${plan.completion}%`, plan.status, plan.daily_hours]);
    const csv = [header, ...rows].map(row => row.map(value => `"${String(value || "").replaceAll('"', '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "study-planning-data.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  function exportPdf() {
    window.print();
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
      await api.patch(`/study-sessions/${sessionId}/`, { date });
      setMessage("Study task rearranged on the calendar.");
      setDraggedSession(null);
      await load();
    } catch {
      setMessage("Could not rearrange that study task.");
    }
  }

  return (
    <div className="planning-page">
      <div className="planning-header__actions dashboard-action-row">
        <button type="button" className="secondary" onClick={exportPdf}><Download size={18} /> PDF</button>
        <button type="button" className="secondary" onClick={exportCsv}><FileSpreadsheet size={18} /> Excel</button>
        <button type="button" onClick={openCreate}><Plus size={18} /> Add New Plan</button>
      </div>
      
      {message && <p className="planning-message success">{message}</p>}

      <DailyRecommendationPanel username={localStorage.getItem("username") || "Student"} />
      
      {summary.totalPlans === 0 && !loading ? (
        <OnboardingAnalytics />
      ) : (
        <StudyAnalytics summary={summary} analytics={analytics} loading={loading || insightsLoading} />
      )}

      <section className="planning-layout">
        <div className="planning-main">
          <section className="panel planning-controls">
            <label className="planning-search">
              <Search size={18} />
              <input value={filters.search} onChange={e => { setFilters({ ...filters, search: e.target.value }); setPage(1); }} placeholder="Search subjects, plans, or weak topics" />
            </label>
            <select value={filters.priority} onChange={e => { setFilters({ ...filters, priority: e.target.value }); setPage(1); }}>
              <option value="all">All priorities</option>
              <option value="high">High priority</option>
              <option value="medium">Medium priority</option>
              <option value="low">Low priority</option>
            </select>
            <select value={filters.status} onChange={e => { setFilters({ ...filters, status: e.target.value }); setPage(1); }}>
              <option value="all">All statuses</option>
              <option value="pending">Pending</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="missed">Missed</option>
            </select>
            <select value={filters.exam} onChange={e => { setFilters({ ...filters, exam: e.target.value }); setPage(1); }}>
              <option value="all">All exam dates</option>
              <option value="week">Due this week</option>
              <option value="month">Due this month</option>
              <option value="future">Later exams</option>
            </select>
            <div className="planning-view-toggle">
              <button type="button" className={view === "table" ? "" : "secondary"} onClick={() => setView("table")}>Table</button>
              <button type="button" className={view === "cards" ? "" : "secondary"} onClick={() => setView("cards")}>Cards</button>
              <button type="button" className={view === "calendar" ? "" : "secondary"} onClick={() => setView("calendar")}>Calendar</button>
            </div>
          </section>

          {loading && <PlanningDashboardSkeleton />}

          {!loading && view === "table" && (
            <PlanTable
              plans={pagedPlans}
              sort={sort}
              onSort={changeSort}
              onEdit={openEdit}
              onDelete={setDeletePlan}
              onStart={startStudySession}
              onComplete={markTopicComplete}
              onRevision={generateRevisionPlan}
              onQuiz={generateQuiz}
            />
          )}

          {!loading && view === "cards" && (
            <div className="plan-card-grid">
              {pagedPlans.map(plan => (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  onEdit={openEdit}
                  onDelete={setDeletePlan}
                  onStart={startStudySession}
                  onComplete={markTopicComplete}
                  onRevision={generateRevisionPlan}
                  onQuiz={generateQuiz}
                />
              ))}
              {!pagedPlans.length && <p className="empty">No plans match the current filters.</p>}
            </div>
          )}

          {!loading && view === "calendar" && <CalendarView sessions={allSessions} onDragStart={dragStart} onDropSession={dropSession} />}

          <div className="planning-pagination">
            <button type="button" className="secondary" disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</button>
            <span>Page {page} of {totalPages}</span>
            <button type="button" className="secondary" disabled={page === totalPages} onClick={() => setPage(page + 1)}>Next</button>
          </div>
        </div>

        <NotificationPanel
          exams={dashboard?.upcoming_exams || []}
          alerts={dashboard?.revision_schedule || []}
          dailyTarget={dailyTarget}
          onGenerateNotifications={generateNotifications}
        />
      </section>

      <EditPlanModal open={isModalOpen} plan={editingPlan} onClose={() => setIsModalOpen(false)} onSave={savePlan} />
      <DeleteConfirmationModal plan={deletePlan} onCancel={() => setDeletePlan(null)} onConfirm={confirmDelete} />
    </div>
  );
}

function PlanningDashboardSkeleton() {
  return (
    <section className="panel planning-skeleton" aria-label="Loading planning records">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index}>
          <span />
          <strong />
          <p />
        </div>
      ))}
    </section>
  );
}

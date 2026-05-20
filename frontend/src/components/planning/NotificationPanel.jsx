import { Bell, CalendarDays, Lightbulb, TimerReset } from "lucide-react";
import DashboardCard from "./DashboardCard";

export default function NotificationPanel({ exams, alerts, dailyTarget, onGenerateNotifications }) {
  return (
    <aside className="planning-side">
      <DashboardCard className="planning-side-card">
        <div className="planning-side-card__title">
          <CalendarDays size={20} />
          <h2>Upcoming Exams</h2>
        </div>
        <div className="planning-mini-list">
          {exams.length ? exams.map(exam => (
            <p key={exam.id}>
              <strong>{exam.name}</strong>
              <span>{exam.exam_date} - {exam.days_remaining} days left</span>
            </p>
          )) : <span className="empty">No upcoming exams found.</span>}
        </div>
      </DashboardCard>

      <DashboardCard className="planning-side-card">
        <div className="planning-side-card__title">
          <TimerReset size={20} />
          <h2>Daily Target</h2>
        </div>
        <div className="planning-target-ring" style={{ "--target": dailyTarget.completed }}>
          <strong>{dailyTarget.completed}%</strong>
          <span>{dailyTarget.doneHours}h of {dailyTarget.targetHours}h completed today</span>
        </div>
      </DashboardCard>

      <DashboardCard className="planning-side-card">
        <div className="planning-side-card__title">
          <Lightbulb size={20} />
          <h2>Smart Revision Alerts</h2>
        </div>
        <div className="planning-mini-list">
          {alerts.length ? alerts.map((alert, index) => (
            <p key={`${alert.subject}-${alert.topic}-${alert.date}-${index}`}>
              <strong>{alert.subject}: {alert.topic}</strong>
              <span>Revise on {alert.date}</span>
            </p>
          )) : <span className="empty">Add weak topics to generate revision alerts.</span>}
        </div>
      </DashboardCard>

      <DashboardCard className="planning-side-card">
        <div className="planning-side-card__title">
          <Bell size={20} />
          <h2>Notifications</h2>
        </div>
        <p className="planning-muted">Generate reminders for pending tasks and upcoming exams.</p>
        <button type="button" onClick={onGenerateNotifications}>Generate Notifications</button>
      </DashboardCard>
    </aside>
  );
}

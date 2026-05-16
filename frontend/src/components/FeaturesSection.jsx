import { BarChart3, Bot, CalendarClock, ClipboardList, TimerReset, Trophy } from "lucide-react";

const features = [
  ["AI Timetable Generator", "Build balanced daily plans from subjects, exams, weak topics, and study hours.", CalendarClock],
  ["Quiz Generator", "Create personalized quizzes with difficulty levels and answer explanations.", ClipboardList],
  ["Pomodoro Timer", "Track focus sessions and adapt durations based on productivity patterns.", TimerReset],
  ["Analytics Dashboard", "Visualize study patterns, consistency, readiness, and subject performance.", BarChart3],
  ["AI Chat Assistant", "Ask for plans, quiz ideas, explanations, resources, and daily recommendations.", Bot],
  ["Smart Revision Planner", "Schedule spaced revision automatically from weakness and retention signals.", Trophy],
];

export default function FeaturesSection() {
  return (
    <section id="features" className="bg-slate-50 px-6 py-24">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-3xl">
          <p className="text-sm font-black uppercase tracking-[0.24em] text-emerald-700">Platform Features</p>
          <h2 className="mt-3 text-4xl font-black tracking-tight text-slate-950 md:text-5xl">Everything students need to study with momentum.</h2>
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {features.map(([title, description, Icon]) => (
            <article key={title} className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-emerald-300 hover:shadow-xl">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white">
                <Icon className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-black text-slate-950">{title}</h3>
              <p className="mt-3 leading-7 text-slate-600">{description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

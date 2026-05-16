import { BookOpen, CalendarDays, CheckCircle2, ListChecks, Wand2 } from "lucide-react";

const steps = [
  ["Add Subjects", "Enter every exam subject you want to track.", BookOpen],
  ["Set Exam Dates", "Give AI enough context to judge urgency.", CalendarDays],
  ["Define Weak Topics", "Mark difficult chapters and concepts.", ListChecks],
  ["AI Generates Study Plan", "Receive a balanced smart timetable.", Wand2],
  ["Track Progress", "Complete sessions, quizzes, and revisions.", CheckCircle2],
];

export default function WorkflowSection() {
  return (
    <section id="workflow" className="bg-white px-6 py-24">
      <div className="mx-auto max-w-7xl">
        <div className="text-center">
          <p className="text-sm font-black uppercase tracking-[0.24em] text-emerald-700">How It Works</p>
          <h2 className="mt-3 text-4xl font-black tracking-tight text-slate-950 md:text-5xl">From subjects to smart schedules in minutes.</h2>
        </div>
        <div className="mt-14 grid gap-5 lg:grid-cols-5">
          {steps.map(([title, description, Icon], index) => (
            <article key={title} className="relative rounded-2xl border border-slate-200 bg-slate-50 p-6">
              <span className="mb-5 flex h-11 w-11 items-center justify-center rounded-full bg-slate-950 text-sm font-black text-white">{index + 1}</span>
              <Icon className="mb-4 h-7 w-7 text-emerald-700" />
              <h3 className="font-black text-slate-950">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

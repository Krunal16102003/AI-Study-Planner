import { BrainCircuit, Radar, Sparkles, TrendingUp } from "lucide-react";

const items = [
  ["AI Recommendations", "Suggests resources, revision blocks, and next tasks from learning history.", Sparkles],
  ["Smart Scheduling", "Balances priority, exam dates, workload, weak topics, and missed sessions.", BrainCircuit],
  ["Predictive Analytics", "Estimates readiness and performance using quizzes, completion, and consistency.", TrendingUp],
  ["Weak Topic Detection", "Finds subjects and topics that need attention before they become risky.", Radar],
];

export default function AISection() {
  return (
    <section id="ai" className="bg-slate-950 px-6 py-24 text-white">
      <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.24em] text-emerald-300">AI Intelligence</p>
          <h2 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">A learning engine that keeps adapting.</h2>
          <p className="mt-5 leading-8 text-slate-300">
            AI Study Planner combines smart scheduling, weakness analysis, quiz generation, spaced repetition, burnout detection, and readiness prediction into one student-focused workflow.
          </p>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          {items.map(([title, description, Icon]) => (
            <article key={title} className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <Icon className="mb-5 h-8 w-8 text-emerald-300" />
              <h3 className="text-xl font-black">{title}</h3>
              <p className="mt-3 leading-7 text-slate-300">{description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

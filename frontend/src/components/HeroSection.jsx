import { ArrowRight, Brain, PlayCircle } from "lucide-react";
import { Link } from "react-router-dom";

export default function HeroSection() {
  return (
    <section className="relative min-h-[92vh] overflow-hidden bg-slate-950 text-white">
      <img
        className="absolute inset-0 h-full w-full object-cover opacity-35"
        src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1800&q=85"
        alt="Student using an AI study dashboard"
      />
      <div className="absolute inset-0 bg-slate-950/55" />
      <nav className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <a href="/" className="flex items-center gap-3 text-xl font-black tracking-tight">
          <Brain className="h-8 w-8 text-emerald-300" />
          IntelliStudy AI
        </a>
        <div className="hidden items-center gap-6 text-sm font-semibold text-slate-200 md:flex">
          <a href="#features" className="hover:text-white">Features</a>
          <a href="#workflow" className="hover:text-white">Workflow</a>
          <a href="#ai" className="hover:text-white">AI</a>
          <a href="#dashboard" className="hover:text-white">Analytics</a>
        </div>
        <Link to="/login" className="rounded-full border border-white/25 px-5 py-2 text-sm font-bold hover:bg-white hover:text-slate-950">
          Login
        </Link>
      </nav>
      <div className="relative z-10 mx-auto grid min-h-[76vh] max-w-7xl items-center gap-10 px-6 pb-16 pt-10 lg:grid-cols-[1.05fr_0.95fr]">
        <div>
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-300/40 bg-emerald-300/10 px-4 py-2 text-sm font-bold text-emerald-100">
            AI-powered productivity for modern students
          </p>
          <h1 className="max-w-4xl text-5xl font-black leading-tight tracking-tight md:text-7xl">
            Plan Smarter. Study Better. Achieve More.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-200 md:text-xl">
            An AI-powered study planning platform that helps students generate personalized schedules, track progress, improve focus, and prepare effectively for exams.
          </p>
          <div className="mt-9 flex flex-col gap-4 sm:flex-row">
            <Link to="/register" className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-400 px-7 py-4 font-black text-slate-950 shadow-xl shadow-emerald-950/30 transition hover:-translate-y-0.5 hover:bg-emerald-300">
              Get Started <ArrowRight className="h-5 w-5" />
            </Link>
            <a href="#features" className="inline-flex items-center justify-center gap-2 rounded-full border border-white/25 bg-white/10 px-7 py-4 font-black text-white backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/20">
              <PlayCircle className="h-5 w-5" /> Explore Features
            </a>
          </div>
        </div>
        <div className="rounded-3xl border border-white/15 bg-white/10 p-4 shadow-2xl backdrop-blur-md">
          <div className="rounded-2xl bg-slate-950/85 p-5">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Today&apos;s AI Plan</p>
                <h2 className="text-2xl font-black">Exam Readiness 82%</h2>
              </div>
              <span className="rounded-full bg-emerald-400 px-3 py-1 text-xs font-black text-slate-950">LIVE</span>
            </div>
            <div className="grid gap-3">
              {["Physics revision - Optics", "AI Quiz - Calculus", "Pomodoro focus block", "Weak topic review"].map((item, index) => (
                <div key={item} className="flex items-center justify-between rounded-xl bg-white/8 p-4">
                  <span>{item}</span>
                  <span className="text-sm font-bold text-emerald-300">{index + 1}:00 PM</span>
                </div>
              ))}
            </div>
            <div className="mt-5 grid grid-cols-3 gap-3">
              <Metric label="Focus" value="94%" />
              <Metric label="Streak" value="12d" />
              <Metric label="Tasks" value="7/9" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Metric({ label, value }) {
  return (
    <div className="rounded-xl bg-emerald-400/10 p-4 text-center">
      <strong className="block text-2xl text-emerald-300">{value}</strong>
      <span className="text-xs font-bold uppercase tracking-wide text-slate-400">{label}</span>
    </div>
  );
}

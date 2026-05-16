import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export default function CTASection() {
  return (
    <section className="bg-slate-950 px-6 py-24 text-white">
      <div className="mx-auto max-w-5xl text-center">
        <h2 className="text-4xl font-black tracking-tight md:text-6xl">Transform your study routine with AI.</h2>
        <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-slate-300">
          Register today and start building smarter schedules, better revision cycles, sharper quizzes, and stronger exam confidence.
        </p>
        <div className="mt-9 flex justify-center">
          <Link to="/register" className="inline-flex items-center gap-2 rounded-full bg-emerald-400 px-8 py-4 font-black text-slate-950 transition hover:-translate-y-0.5 hover:bg-emerald-300">
            Start Using IntelliStudy AI <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </div>
    </section>
  );
}

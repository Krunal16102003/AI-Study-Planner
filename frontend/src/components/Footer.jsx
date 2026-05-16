import { Brain, Github, Linkedin, Mail } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-white px-6 py-12">
      <div className="mx-auto grid max-w-7xl gap-8 border-t border-slate-200 pt-10 md:grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr]">
        <div>
          <div className="flex items-center gap-3 text-xl font-black text-slate-950"><Brain className="h-7 w-7 text-emerald-700" /> IntelliStudy AI</div>
          <p className="mt-4 max-w-sm leading-7 text-slate-600">
            AI Study Planner is a next-generation intelligent learning platform designed to help students optimize study schedules, improve consistency, and maximize academic performance.
          </p>
        </div>
        <FooterList title="Quick Links" items={["Features", "How It Works", "Analytics", "Testimonials"]} />
        <FooterList title="Platform" items={["AI Planner", "Quiz Generator", "Pomodoro", "AI Assistant"]} />
        <div>
          <h3 className="font-black text-slate-950">Contact</h3>
          <p className="mt-3 text-slate-600">support@intellistudy.ai</p>
          <div className="mt-4 flex gap-3 text-slate-600">
            <Mail className="h-5 w-5" />
            <Github className="h-5 w-5" />
            <Linkedin className="h-5 w-5" />
          </div>
        </div>
      </div>
      <div className="mx-auto mt-10 flex max-w-7xl flex-col justify-between gap-3 border-t border-slate-200 pt-6 text-sm text-slate-500 md:flex-row">
        <span>Created by Krunal Patil and Kush Panchal || All rights reserved || Copyright 2026</span>
        <span>Privacy Policy · Terms of Use</span>
      </div>
    </footer>
  );
}

function FooterList({ title, items }) {
  return (
    <div>
      <h3 className="font-black text-slate-950">{title}</h3>
      <ul className="mt-3 grid gap-2 text-slate-600">
        {items.map(item => <li key={item}>{item}</li>)}
      </ul>
    </div>
  );
}

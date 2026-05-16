import { Star } from "lucide-react";

const testimonials = [
  ["Aarav Mehta", "Engineering student", "The readiness score helped me stop guessing and focus on what mattered before exams.", "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80"],
  ["Sara Khan", "Medical aspirant", "Smart revision reminders made my study routine consistent without feeling overwhelming.", "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80"],
  ["Rohan Iyer", "Commerce student", "The AI quiz generator and analytics dashboard made my weak chapters obvious.", "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=200&q=80"],
];

export default function Testimonials() {
  return (
    <section className="bg-white px-6 py-24">
      <div className="mx-auto max-w-7xl">
        <div className="text-center">
          <p className="text-sm font-black uppercase tracking-[0.24em] text-emerald-700">Student Feedback</p>
          <h2 className="mt-3 text-4xl font-black tracking-tight text-slate-950 md:text-5xl">Built for real study pressure.</h2>
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {testimonials.map(([name, role, quote, image]) => (
            <article key={name} className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
              <div className="mb-5 flex gap-1 text-amber-400">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className="h-4 w-4 fill-current" />)}</div>
              <p className="leading-7 text-slate-700">"{quote}"</p>
              <div className="mt-6 flex items-center gap-3">
                <img className="h-12 w-12 rounded-full object-cover" src={image} alt={name} />
                <div>
                  <strong className="block text-slate-950">{name}</strong>
                  <span className="text-sm text-slate-500">{role}</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

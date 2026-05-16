import { BatteryCharging, CalendarCheck, HeartPulse, Repeat2, Target } from "lucide-react";

const benefits = [
  ["Better time management", CalendarCheck],
  ["Personalized planning", Target],
  ["Reduced exam stress", HeartPulse],
  ["Improved consistency", BatteryCharging],
  ["Smart revision habits", Repeat2],
];

export default function BenefitsSection() {
  return (
    <section className="bg-white px-6 py-24">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-3xl">
          <p className="text-sm font-black uppercase tracking-[0.24em] text-emerald-700">Benefits</p>
          <h2 className="mt-3 text-4xl font-black tracking-tight text-slate-950 md:text-5xl">Less stress, more structure, stronger outcomes.</h2>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-5">
          {benefits.map(([title, Icon]) => (
            <article key={title} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <Icon className="mb-4 h-7 w-7 text-emerald-700" />
              <h3 className="font-black text-slate-950">{title}</h3>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

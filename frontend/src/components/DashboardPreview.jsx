import React, { useState, useEffect } from "react";

export default function DashboardPreview() {
  return (
    <section id="dashboard" className="bg-slate-50 px-6 py-24">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.24em] text-emerald-700">Dashboard Preview</p>
            <h2 className="mt-3 text-4xl font-black tracking-tight text-slate-950 md:text-5xl">Know exactly where your preparation stands.</h2>
            <p className="mt-5 leading-8 text-slate-600">
              Track readiness scores, productivity statistics, completion rates, focus sessions, and subject-wise performance from one clean dashboard.
            </p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl">
            <div className="grid gap-4 md:grid-cols-4">
              <PreviewStat label="Readiness" value="86%" />
              <PreviewStat label="Focus" value="14h" />
              <PreviewStat label="Streak" value="9d" />
              <PreviewStat label="Tasks" value="31" />
            </div>
            <div className="mt-6 grid gap-5 md:grid-cols-[1fr_0.8fr]">
              <div className="rounded-2xl bg-slate-50 p-5">
                <h3 className="font-black text-slate-950">Weekly Study Pattern</h3>
                <div className="mt-6 flex h-44 items-end gap-3">
                  {[48, 86, 62, 118, 94, 130, 74].map((height, index) => (
                    <div key={height + index} className="flex flex-1 flex-col items-center gap-2">
                      <span className="w-full rounded-t-lg bg-emerald-500" style={{ height }} />
                      <small className="text-slate-500">D{index + 1}</small>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl bg-slate-950 p-5 text-white">
                <h3 className="font-black">Subject Readiness</h3>
                {["Physics", "Math", "Chemistry"].map((subject, index) => (
                  <div key={subject} className="mt-5">
                    <div className="mb-2 flex justify-between text-sm"><span>{subject}</span><span>{[82, 76, 68][index]}%</span></div>
                    <div className="h-2 rounded-full bg-white/10"><div className="h-2 rounded-full bg-emerald-400" style={{ width: `${[82, 76, 68][index]}%` }} /></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function PreviewStat({ label, value }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <strong className="block text-3xl font-black text-slate-950">{value}</strong>
      <span className="text-sm font-bold text-slate-500">{label}</span>
    </div>
  );
}

"use client";

import type { ReactNode } from "react";

const STEPS = ["Start", "Diagnostic", "Tutor", "Proof"];

export function Shell({
  step,
  onReset,
  children,
}: {
  step: number;
  onReset?: () => void;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col px-4 pb-10 pt-5 sm:px-6">
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-brand-600 text-lg text-white shadow-soft">
            🎓
          </div>
          <div>
            <p className="text-sm font-bold leading-tight text-ink">
              A Tutor for Every Learner
            </p>
            <p className="text-xs text-slate-500">Find the gap · Teach it · Prove it</p>
          </div>
        </div>
        {onReset && (
          <button
            onClick={onReset}
            className="rounded-full px-3 py-1.5 text-xs font-medium text-slate-500 ring-1 ring-black/5 transition hover:bg-white"
          >
            Start over
          </button>
        )}
      </header>

      <nav className="mt-5 flex items-center gap-1.5" aria-label="Progress">
        {STEPS.map((label, i) => {
          const n = i + 1;
          const active = n === step;
          const done = n < step;
          return (
            <div key={label} className="flex flex-1 items-center gap-1.5">
              <div
                className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                  active
                    ? "bg-brand-600 text-white"
                    : done
                    ? "bg-mint-500/15 text-mint-600"
                    : "bg-white text-slate-400 ring-1 ring-black/5"
                }`}
              >
                <span
                  className={`grid h-4 w-4 place-items-center rounded-full text-[10px] ${
                    active
                      ? "bg-white/20"
                      : done
                      ? "bg-mint-500 text-white"
                      : "bg-slate-100"
                  }`}
                >
                  {done ? "✓" : n}
                </span>
                <span className="hidden sm:inline">{label}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={`h-px flex-1 ${done ? "bg-mint-400" : "bg-slate-200"}`}
                />
              )}
            </div>
          );
        })}
      </nav>

      <main className="mt-6 flex-1">{children}</main>

      <footer className="mt-8 text-center text-[11px] text-slate-400">
        Built for the C3 hackathon · No streaks, no badges — just proof of learning.
      </footer>
    </div>
  );
}

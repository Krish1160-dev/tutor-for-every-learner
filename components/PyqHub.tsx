"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  PYQ_STATS,
  PYQ_YEARS,
  paperLabel,
  papersFor,
} from "@/lib/pyq";
import type {
  Language,
  PyqPaper,
  StudyConfig,
  Subject,
} from "@/lib/types";
import { Spinner } from "./ui";

const SUBJECT_META: { subject: Subject; emoji: string; blurb: string }[] = [
  { subject: "Physics", emoji: "⚛️", blurb: "Mechanics · E&M · Modern" },
  { subject: "Chemistry", emoji: "🧪", blurb: "Physical · Organic · Inorganic" },
  { subject: "Maths", emoji: "📐", blurb: "Algebra · Calculus · Geometry" },
];

type Props = {
  language: Language;
  busy?: boolean;
  onStart: (config: StudyConfig) => void;
};

export function PyqHub({ language, busy, onStart }: Props) {
  const [subject, setSubject] = useState<Subject>("Physics");
  const [year, setYear] = useState<number | "All">("All");

  const papers = useMemo(() => papersFor(subject, year), [subject, year]);

  const startPaper = (p: PyqPaper) => {
    onStart({
      standard: "JEE Aspirant",
      subject: p.subject,
      language,
      topic: `${p.subject} · JEE Main ${p.year} ${p.session} Shift ${p.shift}`,
      pyq: {
        year: p.year,
        session: p.session,
        shift: p.shift,
        subject: p.subject,
      },
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        <Stat value={`${PYQ_STATS.years} yrs`} label="PYQ coverage" />
        <Stat value={`${PYQ_STATS.papers}`} label="Paper sets" />
        <Stat value={`${PYQ_STATS.questions}`} label="Questions" />
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        {SUBJECT_META.map((s) => {
          const active = subject === s.subject;
          return (
            <button
              key={s.subject}
              onClick={() => setSubject(s.subject)}
              aria-pressed={active}
              className={`group rounded-2xl p-3 text-left ring-1 transition ${
                active
                  ? "bg-brand-600 text-white ring-brand-600 shadow-soft"
                  : "bg-white text-ink ring-black/5 hover:ring-brand-200"
              }`}
            >
              <span className="text-xl">{s.emoji}</span>
              <p className="mt-1 text-sm font-bold">{s.subject}</p>
              <p
                className={`text-[11px] ${
                  active ? "text-white/70" : "text-slate-500"
                }`}
              >
                {s.blurb}
              </p>
            </button>
          );
        })}
      </div>

      <div className="scroll-thin -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        <YearPill active={year === "All"} onClick={() => setYear("All")}>
          All
        </YearPill>
        {PYQ_YEARS.map((y) => (
          <YearPill key={y} active={year === y} onClick={() => setYear(y)}>
            {y}
          </YearPill>
        ))}
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {papers.map((p) => (
          <div
            key={p.id}
            className="flex items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3 ring-1 ring-black/5 transition hover:ring-brand-200"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-ink">
                {paperLabel(p)}
              </p>
              <p className="text-[11px] text-slate-500">
                {p.subject} · {p.questionCount} questions · step-by-step
                solutions
              </p>
            </div>
            <button
              onClick={() => startPaper(p)}
              disabled={busy}
              className="shrink-0 rounded-full bg-brand-600 px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
            >
              {busy ? <Spinner className="h-3.5 w-3.5" /> : "Start"}
            </button>
          </div>
        ))}
      </div>

      {papers.length === 0 && (
        <p className="rounded-2xl bg-white px-4 py-6 text-center text-sm text-slate-500 ring-1 ring-black/5">
          No paper sets for this filter yet.
        </p>
      )}

      <p className="text-[11px] leading-relaxed text-slate-400">
        Exam-style questions modelled on the JEE Main pattern, generated for
        practice. They are not verbatim past papers. Every set ends with
        step-by-step solutions and a fresh proof test.
      </p>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl bg-white px-3 py-2.5 text-center ring-1 ring-black/5">
      <p className="text-lg font-extrabold leading-tight text-ink">{value}</p>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>
    </div>
  );
}

function YearPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
        active
          ? "bg-ink text-white"
          : "bg-white text-slate-600 ring-1 ring-black/5 hover:bg-slate-50"
      }`}
    >
      {children}
    </button>
  );
}

"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { cacheKey, getCache, setCache } from "@/lib/cache";
import { postJSON } from "@/lib/client";
import {
  LANGUAGES,
  type ExamNotes,
  type FormulaCard,
  type FormulaSheet,
  type Language,
  type Standard,
  type Subject,
} from "@/lib/types";
import { MathBlock } from "./Math";
import { Spinner } from "./ui";

type Tab = "notes" | "formulas" | "practice";

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "notes", label: "Exam Notes", icon: "📝" },
  { id: "formulas", label: "Formula Sheet", icon: "∑" },
  { id: "practice", label: "Practice & Diagnose", icon: "🎯" },
];

type Props = {
  standard: Standard;
  subject: Subject;
  chapter: string;
  chapterNumber?: number;
  language: Language;
};

export function ChapterReader({
  standard,
  subject,
  chapter,
  chapterNumber,
  language,
}: Props) {
  const [tab, setTab] = useState<Tab>("notes");
  const [lang, setLang] = useState<Language>(language);

  const [notes, setNotes] = useState<ExamNotes | null>(null);
  const [sheet, setSheet] = useState<FormulaSheet | null>(null);

  const [notesLoading, setNotesLoading] = useState(false);
  const [notesError, setNotesError] = useState<string | null>(null);
  const [sheetLoading, setSheetLoading] = useState(false);
  const [sheetError, setSheetError] = useState<string | null>(null);

  const notesKey = cacheKey("exam-notes", standard, subject, chapter, lang);
  const sheetKey = cacheKey("formula-sheet", standard, subject, chapter, lang);

  const loadNotes = useCallback(
    async (force = false) => {
      if (!force) {
        const cached = getCache<ExamNotes>(notesKey);
        if (cached) {
          setNotes(cached);
          return;
        }
      }
      setNotesLoading(true);
      setNotesError(null);
      try {
        const res = await postJSON<{ notes: ExamNotes }>("/api/chapter-notes", {
          standard,
          subject,
          chapter,
          chapterNumber,
          language: lang,
        });
        setNotes(res.notes);
        setCache(notesKey, res.notes);
      } catch (e) {
        setNotesError(
          e instanceof Error ? e.message : "Could not load these notes."
        );
      } finally {
        setNotesLoading(false);
      }
    },
    [standard, subject, chapter, chapterNumber, lang, notesKey]
  );

  const loadSheet = useCallback(
    async (force = false) => {
      if (!force) {
        const cached = getCache<FormulaSheet>(sheetKey);
        if (cached) {
          setSheet(cached);
          return;
        }
      }
      setSheetLoading(true);
      setSheetError(null);
      try {
        const res = await postJSON<{ sheet: FormulaSheet }>(
          "/api/chapter-formulas",
          {
            standard,
            subject,
            chapter,
            chapterNumber,
            language: lang,
          }
        );
        setSheet(res.sheet);
        setCache(sheetKey, res.sheet);
      } catch (e) {
        setSheetError(
          e instanceof Error ? e.message : "Could not build this formula sheet."
        );
      } finally {
        setSheetLoading(false);
      }
    },
    [standard, subject, chapter, chapterNumber, lang, sheetKey]
  );

  // Reset when the chapter or language changes.
  useEffect(() => {
    setNotes(getCache<ExamNotes>(notesKey));
    setSheet(getCache<FormulaSheet>(sheetKey));
    setNotesError(null);
    setSheetError(null);
  }, [notesKey, sheetKey]);

  // Lazy-load only the tab the student is looking at.
  useEffect(() => {
    if (tab === "notes" && !notes && !notesLoading && !notesError) {
      void loadNotes();
    }
    if (tab === "formulas" && !sheet && !sheetLoading && !sheetError) {
      void loadSheet();
    }
  }, [
    tab,
    notes,
    sheet,
    notesLoading,
    sheetLoading,
    notesError,
    sheetError,
    loadNotes,
    loadSheet,
  ]);

  const practiceHref = (() => {
    const q = new URLSearchParams({
      practice: "1",
      standard,
      subject,
      chapter,
      lang,
    });
    if (typeof chapterNumber === "number") q.set("num", String(chapterNumber));
    return `/?${q.toString()}`;
  })();

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-24 pt-5 sm:px-6">
      <div className="flex items-center justify-between gap-3">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 ring-1 ring-black/5 transition hover:bg-slate-50"
        >
          ← Back to chapters
        </Link>
        <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-500 ring-1 ring-black/5">
          {standard} · {subject}
        </span>
      </div>

      <header className="mt-4">
        <div className="flex items-start gap-3">
          {typeof chapterNumber === "number" && (
            <span className="mt-0.5 grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-brand-50 text-sm font-extrabold text-brand-700">
              {String(chapterNumber).padStart(2, "0")}
            </span>
          )}
          <div className="min-w-0">
            <h1 className="text-balance text-2xl font-extrabold leading-tight tracking-tight text-ink sm:text-3xl">
              {chapter}
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              NCERT chapter · exam notes, formulas and a diagnostic.
            </p>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            Notes in
          </span>
          {LANGUAGES.map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              aria-pressed={lang === l}
              className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition ${
                lang === l
                  ? "bg-brand-600 text-white"
                  : "bg-white text-slate-600 ring-1 ring-black/5 hover:bg-slate-50"
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      </header>

      <nav
        className="sticky top-0 z-20 -mx-4 mt-5 border-b border-slate-200/70 bg-[#f6f7fb]/90 px-4 py-2 backdrop-blur sm:-mx-6 sm:px-6"
        aria-label="Chapter sections"
      >
        <div className="scroll-thin flex gap-1.5 overflow-x-auto pb-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              aria-current={tab === t.id}
              className={`shrink-0 rounded-full px-3.5 py-2 text-xs font-semibold transition ${
                tab === t.id
                  ? "bg-brand-600 text-white shadow-soft"
                  : "bg-white text-slate-600 ring-1 ring-black/5 hover:bg-slate-50"
              }`}
            >
              <span aria-hidden className="mr-1">
                {t.icon}
              </span>
              {t.label}
            </button>
          ))}
        </div>
      </nav>

      <main className="mt-4">
        {tab === "notes" && (
          <NotesTab
            notes={notes}
            loading={notesLoading}
            error={notesError}
            language={lang}
            onRetry={() => void loadNotes(true)}
          />
        )}

        {tab === "formulas" && (
          <FormulaTab
            sheet={sheet}
            loading={sheetLoading}
            error={sheetError}
            onRetry={() => void loadSheet(true)}
          />
        )}

        {tab === "practice" && (
          <PracticeTab
            standard={standard}
            subject={subject}
            chapter={chapter}
            chapterNumber={chapterNumber}
            href={practiceHref}
          />
        )}
      </main>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Exam notes
// ---------------------------------------------------------------------------

function NotesTab({
  notes,
  loading,
  error,
  language,
  onRetry,
}: {
  notes: ExamNotes | null;
  loading: boolean;
  error: string | null;
  language: Language;
  onRetry: () => void;
}) {
  if (loading && !notes) return <Loading label="Writing your exam notes…" />;
  if (error && !notes) return <Failure message={error} onRetry={onRetry} />;
  if (!notes) return null;

  return (
    <div className="animate-fade-up space-y-4">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
        Exam-focused notes · {language}
      </p>

      {notes.coreConcepts.length > 0 && (
        <SectionCard
          title="Core concepts & NCERT definitions"
          subtitle="Use these exact terms in your answers."
        >
          <dl className="space-y-2.5">
            {notes.coreConcepts.map((c, i) => (
              <div
                key={i}
                className="rounded-2xl bg-white px-3.5 py-3 ring-1 ring-black/5"
              >
                <dt className="text-sm font-bold text-ink">{c.term}</dt>
                <dd className="mt-1 text-sm leading-relaxed text-slate-600">
                  {c.definition}
                </dd>
              </div>
            ))}
          </dl>
        </SectionCard>
      )}

      {notes.mechanisms.length > 0 && (
        <SectionCard
          title="Key mechanisms explained simply"
          subtitle="How it actually works, in cause-and-effect order."
        >
          <div className="space-y-3">
            {notes.mechanisms.map((m, i) => (
              <div key={i} className="flex gap-3">
                <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-100 text-[11px] font-bold text-brand-700">
                  {i + 1}
                </span>
                <div>
                  <p className="text-sm font-semibold text-ink">{m.heading}</p>
                  <p className="mt-0.5 text-sm leading-relaxed text-slate-600">
                    {m.explanation}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {notes.boardPoints.length > 0 && (
        <section className="rounded-3xl bg-amber-50 px-4 py-4 ring-1 ring-amber-200">
          <p className="text-sm font-bold text-amber-900">
            ⭐ High-yield board exam points
          </p>
          <ul className="mt-2 space-y-1.5">
            {notes.boardPoints.map((point, i) => (
              <li
                key={i}
                className="flex gap-2 text-sm leading-relaxed text-amber-900/90"
              >
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {notes.commonMistakes.length > 0 && (
        <SectionCard
          title="Common mistakes & mark deductions"
          subtitle="What examiners actually cut marks for."
        >
          <div className="space-y-2">
            {notes.commonMistakes.map((m, i) => (
              <div
                key={i}
                className="rounded-2xl bg-white p-3 ring-1 ring-black/5"
              >
                <p className="flex gap-2 text-sm font-medium text-rose-700">
                  <span aria-hidden>✕</span>
                  <span>{m.mistake}</span>
                </p>
                <p className="mt-1.5 flex gap-2 text-sm leading-relaxed text-mint-600">
                  <span aria-hidden>✓</span>
                  <span>{m.fix}</span>
                </p>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {notes.examples.length > 0 && (
        <SectionCard
          title="Solved NCERT-style examples"
          subtitle="Write your answer in these steps."
        >
          <div className="space-y-3">
            {notes.examples.map((ex, i) => (
              <div
                key={i}
                className="rounded-2xl bg-white p-3.5 ring-1 ring-black/5"
              >
                <p className="text-[11px] font-bold uppercase tracking-wide text-brand-600">
                  Example {i + 1}
                </p>
                <p className="mt-1 text-sm font-semibold leading-relaxed text-ink">
                  {ex.problem}
                </p>
                <ol className="mt-2 space-y-1.5">
                  {ex.steps.map((step, j) => (
                    <li
                      key={j}
                      className="flex gap-2 text-sm leading-relaxed text-slate-600"
                    >
                      <span className="font-semibold text-slate-400">
                        {j + 1}.
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
                <p className="mt-2 rounded-xl bg-mint-500/10 px-2.5 py-1.5 text-sm font-semibold text-mint-600">
                  Answer: {ex.answer}
                </p>
              </div>
            ))}
          </div>
        </SectionCard>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Formula sheet
// ---------------------------------------------------------------------------

function FormulaTab({
  sheet,
  loading,
  error,
  onRetry,
}: {
  sheet: FormulaSheet | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}) {
  if (loading && !sheet) return <Loading label="Building your formula sheet…" />;
  if (error && !sheet) return <Failure message={error} onRetry={onRetry} />;
  if (!sheet) return null;

  return (
    <div className="animate-fade-up space-y-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
        {sheet.cards.length} examinable relations in this chapter
      </p>

      {sheet.cards.map((card, i) => (
        <FormulaCardView key={i} card={card} index={i + 1} />
      ))}
    </div>
  );
}

const KIND_LABEL: Record<FormulaCard["kind"], string> = {
  formula: "Formula",
  law: "Law / rule",
  reaction: "Reaction",
  constant: "Constant",
};

function FormulaCardView({
  card,
  index,
}: {
  card: FormulaCard;
  index: number;
}) {
  return (
    <article className="card overflow-hidden p-4 sm:p-5">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-50 text-[11px] font-bold text-brand-700">
            {index}
          </span>
          <h3 className="text-sm font-bold leading-snug text-ink">
            {card.name}
          </h3>
        </div>
        <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-500">
          {KIND_LABEL[card.kind]}
        </span>
      </div>

      <div className="mt-3 rounded-2xl bg-slate-50 px-3 py-4 ring-1 ring-black/5">
        {card.latex ? (
          <MathBlock
            latex={card.latex}
            className="text-center text-lg text-ink"
          />
        ) : (
          <p className="break-words text-center font-mono text-sm font-semibold text-ink">
            {card.expression}
          </p>
        )}
      </div>

      {card.symbols.length > 0 && (
        <div className="mt-3">
          <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
            Symbols & SI units
          </p>
          <div className="mt-1.5 overflow-hidden rounded-xl ring-1 ring-black/5">
            <table className="w-full border-collapse text-left text-xs">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-2.5 py-1.5 font-semibold">Symbol</th>
                  <th className="px-2.5 py-1.5 font-semibold">Meaning</th>
                  <th className="px-2.5 py-1.5 font-semibold">SI unit</th>
                </tr>
              </thead>
              <tbody>
                {card.symbols.map((s, i) => (
                  <tr
                    key={i}
                    className="border-t border-slate-100 text-slate-600"
                  >
                    <td className="whitespace-nowrap px-2.5 py-1.5 font-mono font-semibold text-ink">
                      {s.symbol}
                    </td>
                    <td className="px-2.5 py-1.5">{s.meaning}</td>
                    <td className="px-2.5 py-1.5">{s.unit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {card.whenToUse && (
        <div className="mt-3 rounded-xl bg-brand-50/70 px-3 py-2 ring-1 ring-brand-100">
          <p className="text-[11px] font-bold uppercase tracking-wide text-brand-700">
            When to use it
          </p>
          <p className="mt-0.5 text-sm leading-relaxed text-slate-700">
            {card.whenToUse}
          </p>
        </div>
      )}

      {card.quickExample.problem && (
        <div className="mt-3 rounded-xl bg-white px-3 py-2.5 ring-1 ring-black/5">
          <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
            Quick application
          </p>
          <p className="mt-1 text-sm font-medium leading-relaxed text-ink">
            {card.quickExample.problem}
          </p>
          {card.quickExample.steps.length > 0 && (
            <ol className="mt-1.5 space-y-1">
              {card.quickExample.steps.map((step, i) => (
                <li
                  key={i}
                  className="flex gap-2 text-xs leading-relaxed text-slate-600"
                >
                  <span className="font-semibold text-slate-400">
                    {i + 1}.
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          )}
          <p className="mt-1.5 text-xs font-semibold text-mint-600">
            {card.quickExample.answer}
          </p>
        </div>
      )}
    </article>
  );
}

// ---------------------------------------------------------------------------
// Practice tab
// ---------------------------------------------------------------------------

function PracticeTab({
  standard,
  subject,
  chapter,
  chapterNumber,
  href,
}: {
  standard: Standard;
  subject: Subject;
  chapter: string;
  chapterNumber?: number;
  href: string;
}) {
  return (
    <div className="animate-fade-up card space-y-4 p-5">
      <div>
        <h2 className="text-base font-bold text-ink">
          Prove you actually learned it
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-slate-600">
          A short diagnostic on{" "}
          <strong>
            {chapter}
            {typeof chapterNumber === "number"
              ? ` (Ch ${String(chapterNumber).padStart(2, "0")})`
              : ""}
          </strong>{" "}
          finds your exact gap. The tutor teaches only that gap, then a fresh
          retest measures the improvement.
        </p>
      </div>

      <ol className="space-y-2">
        {[
          ["Diagnostic", "5 questions that expose your specific misconception."],
          ["Tutor", "One focused explanation in your language, then a check."],
          ["Proof", "A new retest on the same ideas — before/after, no streaks."],
        ].map(([title, body], i) => (
          <li key={title} className="flex gap-3">
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-100 text-[11px] font-bold text-brand-700">
              {i + 1}
            </span>
            <div>
              <p className="text-sm font-semibold text-ink">{title}</p>
              <p className="text-sm leading-relaxed text-slate-600">{body}</p>
            </div>
          </li>
        ))}
      </ol>

      <Link href={href} className="btn-primary w-full py-3 text-sm">
        Start the diagnostic →
      </Link>

      <p className="text-center text-[11px] text-slate-400">
        {standard} · {subject} · NCERT scope
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shared bits
// ---------------------------------------------------------------------------

function SectionCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <section className="card p-4 sm:p-5">
      <h2 className="text-sm font-bold text-ink">{title}</h2>
      {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
      <div className="mt-3">{children}</div>
    </section>
  );
}

function Loading({ label }: { label: string }) {
  return (
    <div className="card flex items-center gap-3 p-6 text-sm font-medium text-slate-600">
      <Spinner className="text-brand-600" />
      {label}
    </div>
  );
}

function Failure({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="card p-5">
      <p className="text-sm text-rose-700">⚠️ {message}</p>
      <button
        onClick={onRetry}
        className="mt-3 rounded-full bg-brand-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-brand-700"
      >
        Retry
      </button>
    </div>
  );
}

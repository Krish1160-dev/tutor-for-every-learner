"use client";

import { useCallback, useEffect, useState } from "react";
import { cacheKey, getCache, setCache } from "@/lib/cache";
import { postJSON } from "@/lib/client";
import type {
  Chapter,
  Language,
  NotesResponse,
  Standard,
  StudyConfig,
  Subject,
} from "@/lib/types";
import { Spinner } from "./ui";

type Props = {
  standard: Standard;
  subject: Subject;
  language: Language;
  chapter: Chapter;
  busy?: boolean;
  onPractice: (config: StudyConfig) => void;
};

type Tab = "summary" | "notes";

export function ChapterCard({
  standard,
  subject,
  language,
  chapter,
  busy,
  onPractice,
}: Props) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("summary");
  const [data, setData] = useState<NotesResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const key = cacheKey(
    "notes",
    standard,
    subject,
    chapter.number,
    chapter.title,
    language
  );

  useEffect(() => {
    setData(getCache<NotesResponse>(key));
    setError(null);
  }, [key]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const parts: "both" | "summary" | "revision" = !data
      ? "both"
      : !data.summary
      ? "summary"
      : !data.revision
      ? "revision"
      : "both";
    try {
      const res = await postJSON<NotesResponse>("/api/notes", {
        standard,
        subject,
        chapter: chapter.title,
        chapterNumber: chapter.number,
        language,
        parts,
      });
      setData((prev) => {
        const merged: NotesResponse = {
          summary: res.summary ?? prev?.summary ?? null,
          revision: res.revision ?? prev?.revision ?? null,
          errors: res.errors,
        };
        setCache(key, merged);
        return merged;
      });
      if (!res.summary && res.revision) setTab("notes");
      if (res.summary && !res.revision) setTab("summary");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load the notes.");
    } finally {
      setLoading(false);
    }
  }, [standard, subject, chapter.title, chapter.number, language, key, data]);

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next && !data && !loading) void load();
  };

  return (
    <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-black/5 transition hover:ring-brand-200">
      <button
        onClick={toggle}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-4 py-3.5 text-left"
      >
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-50 text-xs font-extrabold text-brand-700">
          {String(chapter.number).padStart(2, "0")}
        </span>
        <span className="flex-1 text-sm font-semibold leading-snug text-ink">
          {chapter.title}
        </span>
        <span
          className={`text-xs text-slate-400 transition-transform ${
            open ? "rotate-180" : ""
          }`}
          aria-hidden
        >
          ▾
        </span>
      </button>

      {open && (
        <div className="border-t border-slate-100 px-4 pb-4 pt-3">
          <div className="flex flex-wrap gap-1.5">
            <TabButton
              active={tab === "summary"}
              onClick={() => setTab("summary")}
              label="📘 Book Summary"
            />
            <TabButton
              active={tab === "notes"}
              onClick={() => setTab("notes")}
              label="⚡ Revision Notes"
            />
          </div>

          <div className="mt-3 min-h-[60px]">
            {loading && (
              <div className="flex items-center gap-2 py-4 text-xs font-medium text-slate-500">
                <Spinner className="text-brand-600" />
                Preparing {tab === "summary" ? "the book summary" : "revision notes"}…
              </div>
            )}

            {!loading && error && (
              <div className="rounded-xl bg-rose-50 px-3 py-3 text-xs text-rose-700 ring-1 ring-rose-200">
                <p>⚠️ {error}</p>
                <button
                  onClick={() => void load()}
                  className="mt-2 rounded-full bg-white px-3 py-1 font-semibold text-rose-700 ring-1 ring-rose-200"
                >
                  Retry
                </button>
              </div>
            )}

            {!loading && !error && data && tab === "summary" && (
              <SummaryTab data={data} onRetry={() => void load()} />
            )}

            {!loading && !error && data && tab === "notes" && (
              <NotesTab
                data={data}
                language={language}
                onRetry={() => void load()}
              />
            )}
          </div>

          <button
            onClick={() =>
              onPractice({
                standard,
                subject,
                language,
                topic: chapter.title,
                chapter: chapter.title,
                chapterNumber: chapter.number,
              })
            }
            disabled={busy}
            className="btn-primary mt-4 w-full py-3 text-sm"
          >
            {busy ? (
              <>
                <Spinner /> Building the diagnostic…
              </>
            ) : (
              "Practice & diagnose this chapter →"
            )}
          </button>
        </div>
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
        active
          ? "bg-brand-600 text-white"
          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
      }`}
    >
      {label}
    </button>
  );
}

function RetryButton({
  onClick,
  label,
}: {
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className="mt-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-brand-700 ring-1 ring-brand-200"
    >
      {label}
    </button>
  );
}

function SummaryTab({
  data,
  onRetry,
}: {
  data: NotesResponse;
  onRetry: () => void;
}) {
  const summary = data.summary;
  if (!summary) {
    return (
      <div className="py-2">
        <p className="text-xs text-slate-500">
          The textbook summary is unavailable right now.
        </p>
        <RetryButton onClick={onRetry} label="Retry the summary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
        NCERT-style summary · English
      </p>

      {summary.sections.map((s, i) => (
        <div key={i}>
          <p className="text-sm font-bold text-ink">{s.heading}</p>
          <p className="mt-1 text-sm leading-relaxed text-slate-600">{s.body}</p>
        </div>
      ))}

      {summary.definitions.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Key definitions
          </p>
          <dl className="mt-1.5 space-y-1.5">
            {summary.definitions.map((d, i) => (
              <div key={i} className="text-sm leading-relaxed">
                <dt className="inline font-semibold text-ink">{d.term}: </dt>
                <dd className="inline text-slate-600">{d.meaning}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      {summary.formulas.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Formulas & key facts
          </p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {summary.formulas.map((f, i) => (
              <code
                key={i}
                className="rounded-lg bg-slate-100 px-2 py-1 text-xs text-slate-700"
              >
                {f}
              </code>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function NotesTab({
  data,
  language,
  onRetry,
}: {
  data: NotesResponse;
  language: string;
  onRetry: () => void;
}) {
  const revision = data.revision;
  if (!revision) {
    return (
      <div className="py-2">
        <p className="text-xs text-slate-500">
          Revision notes are unavailable right now.
        </p>
        <RetryButton onClick={onRetry} label="Retry the notes" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
        Exam-ready revision · {language}
      </p>

      <ul className="space-y-2">
        {revision.notes.map((n, i) => (
          <li key={i} className="flex gap-2 text-sm leading-relaxed text-slate-700">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
            <span>{n}</span>
          </li>
        ))}
      </ul>

      {revision.examples.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Solved examples
          </p>
          {revision.examples.map((ex, i) => (
            <div
              key={i}
              className="rounded-xl bg-slate-50 p-3 text-sm leading-relaxed text-slate-700 ring-1 ring-black/5"
            >
              <p className="font-semibold text-ink">{ex.problem}</p>
              <p className="mt-1 whitespace-pre-wrap text-slate-600">
                {ex.solution}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

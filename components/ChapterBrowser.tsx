"use client";

import { useCallback, useEffect, useState } from "react";
import { cacheKey, getCache, setCache } from "@/lib/cache";
import { postJSON } from "@/lib/client";
import { getSeedChapters } from "@/lib/ncert";
import type {
  Chapter,
  Language,
  Standard,
  StudyConfig,
  Subject,
} from "@/lib/types";
import { ChapterCard } from "./ChapterCard";
import { ErrorBox, Spinner } from "./ui";

type Props = {
  standard: Standard;
  subject: Subject;
  language: Language;
  busy?: boolean;
  onPractice: (config: StudyConfig) => void;
};

type ChaptersResponse = { chapters: Chapter[]; source?: string };

export function ChapterBrowser({
  standard,
  subject,
  language,
  busy,
  onPractice,
}: Props) {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const key = cacheKey("chapters", standard, subject);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await postJSON<ChaptersResponse>("/api/chapters", {
        standard,
        subject,
      });
      setChapters(res.chapters);
      setCache(key, res.chapters);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Could not load the chapter list."
      );
    } finally {
      setLoading(false);
    }
  }, [standard, subject, key]);

  useEffect(() => {
    setSearch("");
    setError(null);

    const seed = getSeedChapters(standard, subject);
    if (seed) {
      setChapters(seed);
      setLoading(false);
      return;
    }

    const cached = getCache<Chapter[]>(key);
    if (cached && cached.length > 0) {
      setChapters(cached);
      setLoading(false);
      return;
    }

    setChapters([]);
    void load();
  }, [standard, subject, key, load]);

  const q = search.trim().toLowerCase();
  const filtered = q
    ? chapters.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          String(c.number).padStart(2, "0") === q ||
          String(c.number) === q
      )
    : chapters;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-bold text-ink">
            NCERT chapters · {standard} {subject}
          </p>
          <p className="text-xs text-slate-500">
            Book summary, revision notes and a practice diagnostic for every
            chapter.
          </p>
        </div>
        {chapters.length > 0 && (
          <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-500 ring-1 ring-black/5">
            {chapters.length} chapters
          </span>
        )}
      </div>

      {chapters.length > 0 && (
        <div className="relative">
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-400">
            🔎
          </span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search a chapter (e.g. Electricity, Triangles, Ch 11)…"
            className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-9 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-brand-400 focus:ring-2 focus:ring-brand-200"
            maxLength={60}
          />
        </div>
      )}

      {loading && chapters.length === 0 && (
        <div className="card flex items-center gap-3 p-6 text-sm font-medium text-slate-600">
          <Spinner className="text-brand-600" />
          Loading the official chapter list…
        </div>
      )}

      {error && chapters.length === 0 && (
        <ErrorBox message={error} onRetry={() => void load()} />
      )}

      {chapters.length > 0 && (
        <div className="space-y-2">
          {filtered.map((chapter) => (
            <ChapterCard
              key={`${chapter.number}-${chapter.title}-${language}`}
              standard={standard}
              subject={subject}
              language={language}
              chapter={chapter}
              busy={busy}
              onPractice={onPractice}
            />
          ))}

          {filtered.length === 0 && (
            <p className="rounded-2xl bg-white px-4 py-6 text-center text-sm text-slate-500 ring-1 ring-black/5">
              No chapter matches “{search}”.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

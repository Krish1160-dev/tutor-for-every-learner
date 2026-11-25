"use client";

import Link from "next/link";
import { chapterHref } from "@/lib/slug";
import type { Chapter, Language, Standard, Subject } from "@/lib/types";

type Props = {
  standard: Standard;
  subject: Subject;
  language: Language;
  chapter: Chapter;
};

/**
 * A chapter is a doorway, not an accordion: it opens the dedicated reader page
 * with exam notes, a formula sheet and the practice loop.
 */
export function ChapterCard({ standard, subject, language, chapter }: Props) {
  return (
    <Link
      href={chapterHref({
        standard,
        subject,
        chapter: chapter.title,
        chapterNumber: chapter.number,
        language,
      })}
      className="group flex items-center gap-3 rounded-2xl bg-white px-4 py-3.5 ring-1 ring-black/5 transition hover:-translate-y-0.5 hover:shadow-soft hover:ring-brand-200"
    >
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-50 text-xs font-extrabold text-brand-700 transition group-hover:bg-brand-600 group-hover:text-white">
        {String(chapter.number).padStart(2, "0")}
      </span>

      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold leading-snug text-ink">
          {chapter.title}
        </span>
        <span className="mt-0.5 block truncate text-[11px] text-slate-400">
          Exam notes · Formula sheet · Practice
        </span>
      </span>

      <span
        className="shrink-0 text-sm text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-brand-600"
        aria-hidden
      >
        →
      </span>
    </Link>
  );
}

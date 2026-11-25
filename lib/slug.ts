import { STANDARDS, isSubject, type Standard, type Subject } from "./types";

/** URL-safe slug: "Class 10" -> "class-10", "Social Science" -> "social-science". */
export function toSlug(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function standardFromSlug(slug: string): Standard | null {
  const target = toSlug(decodeURIComponent(slug));
  return STANDARDS.find((s) => toSlug(s) === target) ?? null;
}

export function subjectFromSlug(slug: string): Subject | null {
  const decoded = decodeURIComponent(slug);
  if (isSubject(decoded)) return decoded;
  const target = toSlug(decoded);
  const candidates: Subject[] = [
    "Science",
    "Physics",
    "Chemistry",
    "Maths",
    "Biology",
    "Social Science",
    "English",
  ];
  return candidates.find((s) => toSlug(s) === target) ?? null;
}

/** Parse the [chapter] segment: "11" or "electricity". */
export function parseChapterSegment(segment: string): {
  number?: number;
  slugTitle?: string;
} {
  const decoded = decodeURIComponent(segment).trim();
  if (/^\d{1,2}$/.test(decoded)) return { number: Number(decoded) };
  return { slugTitle: decoded };
}

export function chapterHref(args: {
  standard: Standard;
  subject: Subject;
  chapter: string;
  chapterNumber?: number;
  language: string;
}): string {
  const segment =
    typeof args.chapterNumber === "number" && args.chapterNumber > 0
      ? String(args.chapterNumber)
      : toSlug(args.chapter);
  const query = new URLSearchParams({ title: args.chapter });
  if (typeof args.chapterNumber === "number" && args.chapterNumber > 0) {
    query.set("num", String(args.chapterNumber));
  }
  query.set("lang", args.language);
  return `/chapter/${toSlug(args.standard)}/${toSlug(
    args.subject
  )}/${segment}?${query.toString()}`;
}

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ChapterReader } from "@/components/ChapterReader";
import { getSeedChapters } from "@/lib/ncert";
import {
  parseChapterSegment,
  standardFromSlug,
  subjectFromSlug,
} from "@/lib/slug";
import { isLanguage, type Language } from "@/lib/types";

type PageProps = {
  params: Promise<{
    standard: string;
    subject: string;
    chapter: string;
  }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function resolveChapter(args: {
  standard: ReturnType<typeof standardFromSlug>;
  subject: ReturnType<typeof subjectFromSlug>;
  segment: string;
  title?: string;
  num?: string;
}): { chapter: string; chapterNumber?: number } {
  const parsed = parseChapterSegment(args.segment);

  const explicitNumber =
    typeof parsed.number === "number"
      ? parsed.number
      : args.num && /^\d{1,2}$/.test(args.num)
      ? Number(args.num)
      : undefined;

  const titleFromQuery = args.title?.trim();

  if (args.standard && args.subject && typeof explicitNumber === "number") {
    const seed = getSeedChapters(args.standard, args.subject);
    const match = seed?.find((c) => c.number === explicitNumber);
    if (match) return { chapter: match.title, chapterNumber: match.number };
  }

  if (titleFromQuery) {
    return {
      chapter: titleFromQuery,
      chapterNumber: explicitNumber,
    };
  }

  if (parsed.slugTitle) {
    const words = parsed.slugTitle
      .split("-")
      .filter(Boolean)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1));
    return { chapter: words.join(" ") || "Chapter", chapterNumber: undefined };
  }

  return {
    chapter: explicitNumber ? `Chapter ${explicitNumber}` : "Chapter",
    chapterNumber: explicitNumber,
  };
}

export async function generateMetadata({
  params,
  searchParams,
}: PageProps): Promise<Metadata> {
  const { standard: standardSlug, subject: subjectSlug, chapter: segment } =
    await params;
  const sp = await searchParams;

  const standard = standardFromSlug(standardSlug);
  const subject = subjectFromSlug(subjectSlug);
  const { chapter } = resolveChapter({
    standard,
    subject,
    segment,
    title: first(sp.title),
    num: first(sp.num),
  });

  return {
    title: `${chapter} · ${standard ?? "NCERT"} ${subject ?? ""} — A Tutor for Every Learner`,
    description: `Exam notes, a formula sheet and a diagnostic for ${chapter}.`,
  };
}

export default async function ChapterPage({ params, searchParams }: PageProps) {
  const { standard: standardSlug, subject: subjectSlug, chapter: segment } =
    await params;
  const sp = await searchParams;

  const standard = standardFromSlug(standardSlug);
  const subject = subjectFromSlug(subjectSlug);
  if (!standard || !subject) notFound();

  const { chapter, chapterNumber } = resolveChapter({
    standard,
    subject,
    segment,
    title: first(sp.title),
    num: first(sp.num),
  });

  const rawLang = first(sp.lang);
  const language: Language = isLanguage(rawLang) ? rawLang : "English";

  return (
    <ChapterReader
      standard={standard}
      subject={subject}
      chapter={chapter}
      chapterNumber={chapterNumber}
      language={language}
    />
  );
}

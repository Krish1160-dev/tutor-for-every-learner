import { supabaseAdmin } from "./supabase/admin";
import type {
  ExamNotes,
  FormulaSheet,
  Language,
  Standard,
  Subject,
} from "./types";

export type ChapterCacheKey = {
  standard: Standard;
  subject: Subject;
  chapter: string;
  language: Language;
};

export type ChapterCacheRow = {
  examNotes: ExamNotes | null;
  formulaSheet: FormulaSheet | null;
};

/**
 * Shared, server-side chapter cache. One row per
 * (standard, subject, chapter, language); notes and formulas live in separate
 * JSONB columns so either half can be filled independently.
 *
 * Every function is a no-op returning null / void when Supabase is not
 * configured, so the app still works with local generation only.
 */
export async function readChapterCache(
  key: ChapterCacheKey
): Promise<ChapterCacheRow | null> {
  const db = supabaseAdmin();
  if (!db) return null;

  const { data, error } = await db
    .from("chapter_cache")
    .select("exam_notes, formula_sheet")
    .eq("standard", key.standard)
    .eq("subject", key.subject)
    .eq("chapter", key.chapter)
    .eq("language", key.language)
    .maybeSingle();

  if (error) {
    console.error("[chapter_cache] read failed", error.message);
    return null;
  }
  if (!data) return null;

  return {
    examNotes: (data.exam_notes as ExamNotes | null) ?? null,
    formulaSheet: (data.formula_sheet as FormulaSheet | null) ?? null,
  };
}

export async function writeChapterCache(
  key: ChapterCacheKey,
  patch: Partial<ChapterCacheRow> & { chapterNumber?: number }
): Promise<void> {
  const db = supabaseAdmin();
  if (!db) return;

  const row: Record<string, unknown> = {
    standard: key.standard,
    subject: key.subject,
    chapter: key.chapter,
    language: key.language,
    updated_at: new Date().toISOString(),
  };

  if (typeof patch.chapterNumber === "number") {
    row.chapter_number = patch.chapterNumber;
  }
  if (patch.examNotes) row.exam_notes = patch.examNotes;
  if (patch.formulaSheet) row.formula_sheet = patch.formulaSheet;

  const { error } = await db
    .from("chapter_cache")
    .upsert(row, { onConflict: "standard,subject,chapter,language" });

  if (error) {
    console.error("[chapter_cache] write failed", error.message);
  }
}

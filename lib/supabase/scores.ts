"use client";

import { supabaseBrowser } from "./client";
import type { Language, Standard, Subject } from "../types";

/**
 * Saves a finished before/after result for the signed-in student.
 * Silently does nothing when Supabase is unconfigured or the user is signed
 * out — RLS also rejects rows whose user_id is not the caller's.
 */
export async function saveDiagnosticScore(args: {
  standard: Standard;
  subject: Subject;
  language: Language;
  chapter?: string;
  topic: string;
  beforeScore: number;
  afterScore: number;
  total: number;
}): Promise<void> {
  const supabase = supabaseBrowser();
  if (!supabase) return;

  try {
    const { data } = await supabase.auth.getUser();
    const user = data.user;
    if (!user) return;

    await supabase.from("diagnostic_results").insert({
      user_id: user.id,
      standard: args.standard,
      subject: args.subject,
      language: args.language,
      chapter: args.chapter ?? null,
      topic: args.topic || null,
      before_score: args.beforeScore,
      after_score: args.afterScore,
      total: args.total,
    });
  } catch {
    // Progress saving must never interrupt the learning loop.
  }
}

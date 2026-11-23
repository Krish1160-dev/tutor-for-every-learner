import type { JudgeResult, Question, TutorTurn } from "./types";

/**
 * Validate and normalize AI-generated questions. Throws if there are fewer
 * valid questions than requested so the caller can retry.
 */
export function sanitizeQuestions(input: unknown, expected: number): Question[] {
  const candidate =
    Array.isArray(input)
      ? input
      : input && typeof input === "object" && "questions" in input
      ? (input as { questions: unknown }).questions
      : null;

  if (!Array.isArray(candidate)) {
    throw new Error("AI response did not contain a questions array");
  }

  const out: Question[] = [];

  for (const item of candidate) {
    if (!item || typeof item !== "object") continue;
    const q = item as Record<string, unknown>;

    if (typeof q.question !== "string" || !q.question.trim()) continue;

    const options = Array.isArray(q.options)
      ? q.options.map((o) => String(o))
      : [];
    if (options.length !== 4) continue;

    const correct = Number(q.correct);
    if (!Number.isInteger(correct) || correct < 0 || correct > 3) continue;

    const tags: Record<string, string> = {};
    if (q.tags && typeof q.tags === "object") {
      for (const [key, value] of Object.entries(
        q.tags as Record<string, unknown>
      )) {
        const idx = Number(key);
        if (
          Number.isInteger(idx) &&
          idx >= 0 &&
          idx <= 3 &&
          idx !== correct &&
          typeof value === "string" &&
          value.trim()
        ) {
          tags[String(idx)] = value.trim();
        }
      }
    }

    out.push({
      id: out.length + 1,
      question: q.question.trim(),
      options,
      correct,
      tags,
      explanation:
        typeof q.explanation === "string" ? q.explanation.trim() : "",
    });
  }

  if (out.length < expected) {
    throw new Error(
      `Only ${out.length} valid question(s) generated, needed ${expected}`
    );
  }

  return out.slice(0, expected);
}

export function sanitizeTutor(input: unknown): TutorTurn {
  if (!input || typeof input !== "object") {
    throw new Error("Invalid tutor response");
  }
  const o = input as Record<string, unknown>;

  if (
    typeof o.explanation !== "string" ||
    !o.explanation.trim() ||
    typeof o.checkQuestion !== "string" ||
    !o.checkQuestion.trim()
  ) {
    throw new Error("Tutor response missing explanation or check question");
  }

  return {
    explanation: o.explanation.trim(),
    checkQuestion: o.checkQuestion.trim(),
    correctIdea:
      typeof o.correctIdea === "string" && o.correctIdea.trim()
        ? o.correctIdea.trim()
        : o.checkQuestion.trim(),
  };
}

export function sanitizeJudge(input: unknown): JudgeResult {
  if (!input || typeof input !== "object") {
    throw new Error("Invalid judge response");
  }
  const o = input as Record<string, unknown>;

  if (typeof o.understood !== "boolean") {
    throw new Error("Judge response missing boolean 'understood'");
  }

  return {
    understood: o.understood,
    reason: typeof o.reason === "string" ? o.reason.trim() : "",
  };
}

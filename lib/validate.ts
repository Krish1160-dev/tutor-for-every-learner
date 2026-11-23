import type {
  Chapter,
  ChapterRevision,
  ChapterSummary,
  JudgeResult,
  Question,
  TutorTurn,
} from "./types";

function asArray(input: unknown, key: string): unknown[] {
  if (Array.isArray(input)) return input;
  if (input && typeof input === "object" && key in input) {
    const value = (input as Record<string, unknown>)[key];
    if (Array.isArray(value)) return value;
  }
  return [];
}

/**
 * Validate and normalize AI-generated questions. Throws if there are fewer
 * valid questions than requested so the caller can retry.
 */
export function sanitizeQuestions(
  input: unknown,
  expected: number,
  opts: { requireSolution?: boolean } = {}
): Question[] {
  const candidate = asArray(input, "questions");
  if (candidate.length === 0) {
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

    const solution =
      typeof q.solution === "string" && q.solution.trim()
        ? q.solution.trim()
        : undefined;

    if (opts.requireSolution && !solution) continue;

    out.push({
      id: out.length + 1,
      question: q.question.trim(),
      options,
      correct,
      tags,
      explanation:
        typeof q.explanation === "string" ? q.explanation.trim() : "",
      ...(solution ? { solution } : {}),
    });
  }

  if (out.length < expected) {
    throw new Error(
      `Only ${out.length} valid question(s) generated, needed ${expected}`
    );
  }

  return out.slice(0, expected).map(shuffleOptions);
}

/**
 * AI models tend to put the correct answer first. Shuffle the options so the
 * position carries no signal, remapping the correct index and misconception
 * tags with it.
 */
export function shuffleOptions(q: Question): Question {
  const order = [0, 1, 2, 3];
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }

  const options = order.map((i) => q.options[i]);
  const correct = order.indexOf(q.correct);

  const tags: Record<string, string> = {};
  for (const [key, value] of Object.entries(q.tags)) {
    const oldIndex = Number(key);
    const newIndex = order.indexOf(oldIndex);
    if (newIndex >= 0 && newIndex !== correct) {
      tags[String(newIndex)] = value;
    }
  }

  return { ...q, options, correct, tags };
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

export function sanitizeChapters(input: unknown): Chapter[] {
  const raw = asArray(input, "chapters");
  if (raw.length === 0) throw new Error("No chapters returned");

  const seen = new Set<number>();
  const out: Chapter[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const c = item as Record<string, unknown>;
    const number = Number(c.number);
    if (!Number.isInteger(number) || number < 1 || number > 99) continue;
    if (typeof c.title !== "string" || !c.title.trim()) continue;
    if (seen.has(number)) continue;
    seen.add(number);
    out.push({ number, title: c.title.trim() });
  }

  if (out.length < 4) {
    throw new Error(`Only ${out.length} valid chapters returned`);
  }

  return out.sort((a, b) => a.number - b.number);
}

export function sanitizeSummary(input: unknown): ChapterSummary {
  const o =
    input && typeof input === "object"
      ? (input as Record<string, unknown>)
      : {};

  const sections = asArray(o.sections, "sections")
    .map((s) => {
      if (!s || typeof s !== "object") return null;
      const row = s as Record<string, unknown>;
      const heading = typeof row.heading === "string" ? row.heading.trim() : "";
      const body = typeof row.body === "string" ? row.body.trim() : "";
      return heading && body ? { heading, body } : null;
    })
    .filter((s): s is { heading: string; body: string } => Boolean(s));

  const definitions = asArray(o.definitions, "definitions")
    .map((d) => {
      if (!d || typeof d !== "object") return null;
      const row = d as Record<string, unknown>;
      const term = typeof row.term === "string" ? row.term.trim() : "";
      const meaning =
        typeof row.meaning === "string" ? row.meaning.trim() : "";
      return term && meaning ? { term, meaning } : null;
    })
    .filter((d): d is { term: string; meaning: string } => Boolean(d));

  const formulas = asArray(o.formulas, "formulas")
    .map((f) => String(f).trim())
    .filter(Boolean)
    .slice(0, 12);

  if (sections.length === 0 && definitions.length === 0) {
    throw new Error("Empty chapter summary");
  }

  return { sections, definitions, formulas };
}

export function sanitizeRevision(input: unknown): ChapterRevision {
  const o =
    input && typeof input === "object"
      ? (input as Record<string, unknown>)
      : {};

  const notes = asArray(o.notes, "notes")
    .map((n) => String(n).trim())
    .filter(Boolean)
    .slice(0, 18);

  const examples = asArray(o.examples, "examples")
    .map((e) => {
      if (!e || typeof e !== "object") return null;
      const row = e as Record<string, unknown>;
      const problem =
        typeof row.problem === "string" ? row.problem.trim() : "";
      const solution =
        typeof row.solution === "string" ? row.solution.trim() : "";
      return problem && solution ? { problem, solution } : null;
    })
    .filter((e): e is { problem: string; solution: string } => Boolean(e))
    .slice(0, 4);

  if (notes.length === 0) throw new Error("Empty revision notes");

  return { notes, examples };
}

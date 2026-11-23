import {
  isLanguage,
  isStandard,
  isSubject,
  levelForStandard,
  type Language,
  type Standard,
  type Subject,
} from "./types";

export class InputError extends Error {}

export type RequestContext = {
  topic: string;
  standard: Standard;
  subject: Subject;
  language: Language;
  level: string;
  chapter?: string;
  chapterNumber?: number;
};

export function parseContext(body: unknown): RequestContext {
  if (!body || typeof body !== "object") {
    throw new InputError("Invalid request body.");
  }
  const o = body as Record<string, unknown>;

  const topic = String(o.topic ?? "").trim();
  const standard = o.standard;
  const subject = o.subject;
  const language = o.language;

  if (!isStandard(standard)) throw new InputError("Choose a class first.");
  if (!isSubject(subject)) throw new InputError("Choose a subject first.");
  if (!isLanguage(language)) throw new InputError("Choose a language first.");
  if (topic.length < 2) throw new InputError("Add a topic first.");

  return {
    topic,
    standard,
    subject,
    language,
    level: levelForStandard(standard),
    chapter:
      typeof o.chapter === "string" && o.chapter.trim()
        ? o.chapter.trim()
        : undefined,
    chapterNumber:
      typeof o.chapterNumber === "number" && Number.isFinite(o.chapterNumber)
        ? o.chapterNumber
        : undefined,
  };
}

export function errorResponse(
  err: unknown,
  fallback: string
): { message: string; status: number } {
  if (err instanceof InputError) {
    return { message: err.message, status: 400 };
  }
  return { message: fallback, status: 502 };
}

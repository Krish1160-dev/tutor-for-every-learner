import { NextResponse } from "next/server";
import { generateJSON } from "@/lib/gemini";
import { examNotesPrompt, type PromptPair } from "@/lib/prompts";
import { sanitizeExamNotes } from "@/lib/validate";
import { InputError, errorResponse } from "@/lib/context";
import { readChapterCache, writeChapterCache } from "@/lib/chapterCache";
import { isLanguage, isStandard, isSubject } from "@/lib/types";
import type { ExamNotes } from "@/lib/types";

export const maxDuration = 60;

type Generation = PromptPair & { maxTokens?: number; temperature?: number };

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);

    const standard = body?.standard;
    const subject = body?.subject;
    const chapter = String(body?.chapter ?? "").trim();
    const chapterNumber =
      typeof body?.chapterNumber === "number" ? body.chapterNumber : undefined;
    const language = body?.language;

    if (!isStandard(standard)) throw new InputError("Choose a class first.");
    if (!isSubject(subject)) throw new InputError("Choose a subject first.");
    if (!chapter) throw new InputError("Choose a chapter first.");
    if (!isLanguage(language)) throw new InputError("Choose a language first.");

    const key = { standard, subject, chapter, language };

    // 1. Shared cache first — a chapter is generated once, then served forever.
    const cached = await readChapterCache(key);
    if (cached?.examNotes) {
      return NextResponse.json({ notes: cached.examNotes, source: "cache" });
    }

    // 2. Generate, validate, then persist for the next student.
    const base: Generation = {
      ...examNotesPrompt({ standard, subject, chapter, chapterNumber, language }),
      maxTokens: 2600,
      temperature: 0.4,
    };

    const notes: ExamNotes = await attempt(base);
    await writeChapterCache(key, { examNotes: notes, chapterNumber });

    return NextResponse.json({ notes, source: "ai" });
  } catch (err) {
    console.error("[api/chapter-notes]", err);
    const { message, status } = errorResponse(
      err,
      "Could not prepare these exam notes right now. Please tap retry."
    );
    return NextResponse.json({ error: message }, { status });
  }
}

async function attempt(base: Generation): Promise<ExamNotes> {
  try {
    return sanitizeExamNotes(await generateJSON<unknown>(base));
  } catch (first) {
    try {
      return sanitizeExamNotes(
        await generateJSON<unknown>({
          ...base,
          user:
            base.user +
            "\n\nIMPORTANT: Return ONLY the JSON object in the exact shape requested. No prose, no markdown fences.",
        })
      );
    } catch {
      throw first;
    }
  }
}

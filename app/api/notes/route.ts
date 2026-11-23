import { NextResponse } from "next/server";
import { generateJSON } from "@/lib/gemini";
import { notesPrompt, revisionPrompt, type PromptPair } from "@/lib/prompts";
import { sanitizeRevision, sanitizeSummary } from "@/lib/validate";
import { InputError, errorResponse } from "@/lib/context";
import { isLanguage, isSubject } from "@/lib/types";
import type { ChapterRevision, ChapterSummary } from "@/lib/types";

export const maxDuration = 60;

type Generation = PromptPair & { maxTokens?: number; temperature?: number };

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);

    const standard = String(body?.standard ?? "").trim();
    const subject = body?.subject;
    const chapter = String(body?.chapter ?? "").trim();
    const chapterNumber =
      typeof body?.chapterNumber === "number" ? body.chapterNumber : undefined;
    const language = body?.language;

    if (!standard) throw new InputError("Choose a class first.");
    if (!isSubject(subject)) throw new InputError("Choose a subject first.");
    if (!chapter) throw new InputError("Choose a chapter first.");
    if (!isLanguage(language)) throw new InputError("Choose a language first.");

    const summaryBase: Generation = {
      ...notesPrompt({ standard, subject, chapter, chapterNumber }),
      maxTokens: 2200,
      temperature: 0.5,
    };
    const revisionBase: Generation = {
      ...revisionPrompt({
        standard,
        subject,
        chapter,
        chapterNumber,
        language,
      }),
      maxTokens: 2200,
      temperature: 0.5,
    };

    // Sequential, not parallel: the free AI tier limits tokens per minute and
    // two simultaneous generations trip the limit.
    const requested = body?.parts;
    const parts =
      requested === "summary" || requested === "revision"
        ? requested
        : "both";

    const summaryResult =
      parts === "revision" ? null : await attempt(summaryBase);
    if (parts === "both") await sleep(700);
    const revisionResult =
      parts === "summary" ? null : await attempt(revisionBase);

    const errors: string[] = [];
    let summary: ChapterSummary | null = null;
    let revision: ChapterRevision | null = null;

    if (summaryResult?.ok) {
      try {
        summary = sanitizeSummary(summaryResult.value);
      } catch {
        errors.push("summary");
      }
    } else if (summaryResult) {
      errors.push("summary");
      console.error("[api/notes] summary failed", summaryResult.error);
    }

    if (revisionResult?.ok) {
      try {
        revision = sanitizeRevision(revisionResult.value);
      } catch {
        errors.push("revision");
      }
    } else if (revisionResult) {
      errors.push("revision");
      console.error("[api/notes] revision failed", revisionResult.error);
    }

    if (!summary && !revision) {
      return NextResponse.json(
        {
          error: "Could not prepare these notes right now. Please tap retry.",
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      summary,
      revision,
      ...(errors.length ? { errors } : {}),
    });
  } catch (err) {
    console.error("[api/notes]", err);
    const { message, status } = errorResponse(
      err,
      "Could not prepare these notes right now. Please tap retry."
    );
    return NextResponse.json({ error: message }, { status });
  }
}

type Attempt =
  | { ok: true; value: unknown }
  | { ok: false; error: unknown };

async function attempt(base: Generation): Promise<Attempt> {
  try {
    return { ok: true, value: await generateJSON<unknown>(base) };
  } catch (error) {
    try {
      return {
        ok: true,
        value: await generateJSON<unknown>({
          ...base,
          user:
            base.user +
            "\n\nIMPORTANT: Return ONLY the JSON object in the exact shape requested. No prose.",
        }),
      };
    } catch (retryError) {
      return { ok: false, error: error ?? retryError };
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

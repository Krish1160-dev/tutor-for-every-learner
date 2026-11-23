import { NextResponse } from "next/server";
import { generateJSON } from "@/lib/gemini";
import { proofPrompt } from "@/lib/prompts";
import { sanitizeQuestions } from "@/lib/validate";
import type { Language, Level } from "@/lib/types";

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const topic = String(body?.topic ?? "").trim();
    const level = body?.level as Level;
    const language = body?.language as Language;

    if (!topic || !level || !language) {
      return NextResponse.json(
        { error: "Topic, level and language are required." },
        { status: 400 }
      );
    }

    const diagnostic = Array.isArray(body?.diagnostic)
      ? body.diagnostic
          .filter((d: unknown) => d && typeof d === "object")
          .map((d: { question?: unknown; explanation?: unknown }) => ({
            question: String(d.question ?? ""),
            explanation: String(d.explanation ?? ""),
          }))
      : [];

    const base = proofPrompt({ topic, level, language, diagnostic });
    const expected = diagnostic.length || 5;

    try {
      const raw = await generateJSON<unknown>(base);
      return NextResponse.json({
        questions: sanitizeQuestions(raw, expected),
      });
    } catch {
      const retry = {
        ...base,
        user:
          base.user +
          `\n\nIMPORTANT: Return ONLY the JSON object with exactly ${expected} complete, valid questions. No prose.`,
      };
      const raw = await generateJSON<unknown>(retry);
      return NextResponse.json({
        questions: sanitizeQuestions(raw, expected),
      });
    }
  } catch (err) {
    console.error("[api/proof]", err);
    return NextResponse.json(
      {
        error:
          "The tutor could not build the retest right now. Please tap retry.",
      },
      { status: 502 }
    );
  }
}

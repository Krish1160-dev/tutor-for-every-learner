import { NextResponse } from "next/server";
import { generateJSON } from "@/lib/gemini";
import { diagnosticPrompt } from "@/lib/prompts";
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

    const base = diagnosticPrompt({ topic, level, language, count: 5 });

    try {
      const raw = await generateJSON<unknown>(base);
      return NextResponse.json({ questions: sanitizeQuestions(raw, 5) });
    } catch {
      const retry = {
        ...base,
        user:
          base.user +
          "\n\nIMPORTANT: Return ONLY the JSON object with exactly 5 complete, valid questions. No prose.",
      };
      const raw = await generateJSON<unknown>(retry);
      return NextResponse.json({ questions: sanitizeQuestions(raw, 5) });
    }
  } catch (err) {
    console.error("[api/diagnostic]", err);
    return NextResponse.json(
      {
        error:
          "The tutor could not generate questions right now. Please tap retry.",
      },
      { status: 502 }
    );
  }
}

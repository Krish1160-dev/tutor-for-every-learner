import { NextResponse } from "next/server";
import { generateJSON } from "@/lib/gemini";
import { diagnosticPrompt } from "@/lib/prompts";
import { sanitizeQuestions } from "@/lib/validate";
import { errorResponse, parseContext } from "@/lib/context";

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const ctx = parseContext(body);

    const base = diagnosticPrompt({ ...ctx, count: 5 });

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
    const { message, status } = errorResponse(
      err,
      "The tutor could not generate questions right now. Please tap retry."
    );
    return NextResponse.json({ error: message }, { status });
  }
}

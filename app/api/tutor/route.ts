import { NextResponse } from "next/server";
import { generateJSON } from "@/lib/gemini";
import { tutorPrompt } from "@/lib/prompts";
import { sanitizeTutor } from "@/lib/validate";
import { InputError, errorResponse, parseContext } from "@/lib/context";

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const ctx = parseContext(body);

    const mistake = String(body?.mistake ?? "").trim();
    if (!mistake) throw new InputError("A misconception is required.");

    const attempt = Math.min(Math.max(Number(body?.attempt) || 1, 1), 3);
    const previous = Array.isArray(body?.previous)
      ? body.previous.map((p: unknown) => String(p)).filter(Boolean)
      : [];

    const prompt = tutorPrompt({
      ...ctx,
      mistake,
      attempt,
      previous,
    });

    const raw = await generateJSON<unknown>(prompt);
    return NextResponse.json(sanitizeTutor(raw));
  } catch (err) {
    console.error("[api/tutor]", err);
    const { message, status } = errorResponse(
      err,
      "The tutor could not prepare an explanation right now. Please tap retry."
    );
    return NextResponse.json({ error: message }, { status });
  }
}

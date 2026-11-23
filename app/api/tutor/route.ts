import { NextResponse } from "next/server";
import { generateJSON } from "@/lib/gemini";
import { tutorPrompt } from "@/lib/prompts";
import { sanitizeTutor } from "@/lib/validate";
import type { Language, Level } from "@/lib/types";

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const topic = String(body?.topic ?? "").trim();
    const level = body?.level as Level;
    const language = body?.language as Language;
    const mistake = String(body?.mistake ?? "").trim();
    const attempt = Math.min(Math.max(Number(body?.attempt) || 1, 1), 3);
    const previous = Array.isArray(body?.previous)
      ? body.previous.map((p: unknown) => String(p)).filter(Boolean)
      : [];

    if (!topic || !level || !language || !mistake) {
      return NextResponse.json(
        { error: "Topic, level, language and mistake are required." },
        { status: 400 }
      );
    }

    const prompt = tutorPrompt({
      topic,
      level,
      language,
      mistake,
      attempt,
      previous,
    });

    const raw = await generateJSON<unknown>(prompt);
    return NextResponse.json(sanitizeTutor(raw));
  } catch (err) {
    console.error("[api/tutor]", err);
    return NextResponse.json(
      {
        error:
          "The tutor could not prepare an explanation right now. Please tap retry.",
      },
      { status: 502 }
    );
  }
}

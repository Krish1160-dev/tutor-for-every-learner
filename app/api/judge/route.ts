import { NextResponse } from "next/server";
import { generateJSON } from "@/lib/gemini";
import { judgePrompt } from "@/lib/prompts";
import { sanitizeJudge } from "@/lib/validate";
import type { Language } from "@/lib/types";

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const checkQuestion = String(body?.checkQuestion ?? "").trim();
    const correctIdea = String(body?.correctIdea ?? "").trim();
    const reply = String(body?.reply ?? "").trim();
    const language = (body?.language as Language) || "English";

    if (!checkQuestion || !reply) {
      return NextResponse.json(
        { error: "A check question and a reply are required." },
        { status: 400 }
      );
    }

    const prompt = judgePrompt({
      checkQuestion,
      correctIdea,
      reply,
      language,
    });

    const raw = await generateJSON<unknown>(prompt);
    return NextResponse.json(sanitizeJudge(raw));
  } catch (err) {
    console.error("[api/judge]", err);
    return NextResponse.json(
      {
        error:
          "The tutor could not check that answer right now. Please tap retry.",
      },
      { status: 502 }
    );
  }
}

import { NextResponse } from "next/server";
import { generateJSON } from "@/lib/gemini";
import { chaptersPrompt } from "@/lib/prompts";
import { sanitizeChapters } from "@/lib/validate";
import { InputError, errorResponse } from "@/lib/context";
import { getSeedChapters } from "@/lib/ncert";
import { isStandard, isSubject } from "@/lib/types";

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const standard = body?.standard;
    const subject = body?.subject;

    if (!isStandard(standard)) throw new InputError("Choose a class first.");
    if (!isSubject(subject)) throw new InputError("Choose a subject first.");

    const seed = getSeedChapters(standard, subject);
    if (seed) {
      return NextResponse.json({ chapters: seed, source: "seed" });
    }

    const base = chaptersPrompt({ standard, subject });
    try {
      const raw = await generateJSON<unknown>(base);
      return NextResponse.json({
        chapters: sanitizeChapters(raw),
        source: "ai",
      });
    } catch {
      const retry = {
        ...base,
        user:
          base.user +
          "\n\nIMPORTANT: Return ONLY the JSON object with a complete chapters array. No prose.",
      };
      const raw = await generateJSON<unknown>(retry);
      return NextResponse.json({
        chapters: sanitizeChapters(raw),
        source: "ai",
      });
    }
  } catch (err) {
    console.error("[api/chapters]", err);
    const { message, status } = errorResponse(
      err,
      "Could not load the chapter list right now. Please tap retry."
    );
    return NextResponse.json({ error: message }, { status });
  }
}

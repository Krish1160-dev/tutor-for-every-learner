import { NextResponse } from "next/server";
import { generateJSON } from "@/lib/gemini";
import { pyqPrompt } from "@/lib/prompts";
import { sanitizeQuestions } from "@/lib/validate";
import { InputError, errorResponse } from "@/lib/context";
import { isSubject } from "@/lib/types";

export const maxDuration = 60;

const SESSIONS = ["Jan", "Apr"];

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);

    const year = Number(body?.year);
    const session = String(body?.session ?? "").trim();
    const shift = Number(body?.shift);
    const subject = body?.subject;

    if (!Number.isInteger(year) || year < 2020 || year > 2030) {
      throw new InputError("Choose a valid exam year.");
    }
    if (!SESSIONS.includes(session)) {
      throw new InputError("Choose a valid session.");
    }
    if (!Number.isInteger(shift) || shift < 1 || shift > 2) {
      throw new InputError("Choose a valid shift.");
    }
    if (!isSubject(subject)) throw new InputError("Choose a subject first.");

    const base = pyqPrompt({ year, session, shift, subject });

    try {
      const raw = await generateJSON<unknown>(base);
      return NextResponse.json({
        questions: sanitizeQuestions(raw, 5, { requireSolution: true }),
      });
    } catch {
      const retry = {
        ...base,
        user:
          base.user +
          "\n\nIMPORTANT: Return ONLY the JSON object with exactly 5 complete questions, each with a step-by-step 'solution'. No prose.",
      };
      const raw = await generateJSON<unknown>(retry);
      return NextResponse.json({
        questions: sanitizeQuestions(raw, 5, { requireSolution: true }),
      });
    }
  } catch (err) {
    console.error("[api/pyq]", err);
    const { message, status } = errorResponse(
      err,
      "Could not load this PYQ set right now. Please tap retry."
    );
    return NextResponse.json({ error: message }, { status });
  }
}

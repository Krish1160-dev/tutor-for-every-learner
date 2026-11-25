import { NextResponse } from "next/server";
import { generateJSON } from "@/lib/gemini";
import { formulaSheetPrompt, type PromptPair } from "@/lib/prompts";
import { sanitizeFormulaSheet } from "@/lib/validate";
import { InputError, errorResponse } from "@/lib/context";
import { readChapterCache, writeChapterCache } from "@/lib/chapterCache";
import { isLanguage, isStandard, isSubject } from "@/lib/types";
import type { FormulaSheet } from "@/lib/types";

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

    const cached = await readChapterCache(key);
    if (cached?.formulaSheet) {
      return NextResponse.json({
        sheet: cached.formulaSheet,
        source: "cache",
      });
    }

    const base: Generation = {
      ...formulaSheetPrompt({
        standard,
        subject,
        chapter,
        chapterNumber,
        language,
      }),
      maxTokens: 2800,
      temperature: 0.3,
    };

    const sheet: FormulaSheet = await attempt(base);
    await writeChapterCache(key, { formulaSheet: sheet, chapterNumber });

    return NextResponse.json({ sheet, source: "ai" });
  } catch (err) {
    console.error("[api/chapter-formulas]", err);
    const { message, status } = errorResponse(
      err,
      "Could not build this formula sheet right now. Please tap retry."
    );
    return NextResponse.json({ error: message }, { status });
  }
}

async function attempt(base: Generation): Promise<FormulaSheet> {
  try {
    return sanitizeFormulaSheet(await generateJSON<unknown>(base));
  } catch (first) {
    try {
      return sanitizeFormulaSheet(
        await generateJSON<unknown>({
          ...base,
          user:
            base.user +
            "\n\nIMPORTANT: Return ONLY the JSON object with a complete cards array. Every card needs name, kind, symbols, whenToUse and quickExample. No prose, no markdown fences.",
        })
      );
    } catch {
      throw first;
    }
  }
}

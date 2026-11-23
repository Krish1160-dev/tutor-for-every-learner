import { NextResponse } from "next/server";
import { hasGeminiKey } from "@/lib/gemini";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    ok: true,
    gemini: hasGeminiKey(),
    groq: Boolean(process.env.GROQ_API_KEY),
  });
}

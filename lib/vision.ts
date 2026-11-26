import { GoogleGenAI } from "@google/genai";
import { parseJSON } from "./gemini";
import { doubtSystemPrompt } from "./prompts";
import { sanitizeDoubtSolution } from "./validate";
import type { DoubtSolution, Language } from "./types";

// Same constraint as the text models: on the free tier only Flash-Lite answers,
// and disabling thinking is what keeps a photo answer at a few seconds.
const VISION_MODELS = ["gemini-3.1-flash-lite", "gemini-3.1-flash-lite-preview"];

export function hasVisionKey(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

/**
 * Read a photo of a question and solve it with Gemini Vision.
 * The prompt forces a re-check of arithmetic/algebra before the final answer.
 */
export async function solveDoubtImage(args: {
  imageBase64: string;
  mimeType: string;
  note?: string;
  standard?: string;
  subject?: string;
  language: Language;
}): Promise<DoubtSolution> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("MISSING_GEMINI_KEY");

  const ai = new GoogleGenAI({ apiKey, httpOptions: { apiVersion: "v1beta" } });

  const note = args.note?.trim();
  const userText = [
    "Solve the question shown in this photo.",
    note ? `The student added this note: "${note}"` : "",
    "Extract the question carefully, then solve it step by step.",
  ]
    .filter(Boolean)
    .join("\n");

  const systemInstruction = doubtSystemPrompt({
    standard: args.standard,
    subject: args.subject,
    language: args.language,
  });

  let lastError: unknown = null;

  for (const model of VISION_MODELS) {
    const started = Date.now();
    try {
      const response = await ai.models.generateContent({
        model,
        contents: [
          {
            role: "user",
            parts: [
              {
                inlineData: {
                  mimeType: args.mimeType,
                  data: args.imageBase64,
                },
              },
              { text: userText },
            ],
          },
        ],
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          temperature: 0.1,
          maxOutputTokens: 2048,
          thinkingConfig: { thinkingBudget: 0 },
        },
      });

      const text = response.text ?? "";
      if (!text.trim()) throw new Error(`${model} returned empty text`);

      console.log(
        `[vision] ${model} ${Date.now() - started}ms, ${text.length} chars`
      );

      try {
        return sanitizeDoubtSolution(parseJSON<unknown>(text));
      } catch (parseError) {
        console.error(
          `[vision] ${model} unusable JSON:`,
          text.slice(0, 600)
        );
        throw parseError;
      }
    } catch (error) {
      lastError = error;
      console.error(`[vision] ${model} failed`, error);
    }
  }

  throw lastError ?? new Error("Vision request failed");
}

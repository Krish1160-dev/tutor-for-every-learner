import { GoogleGenAI } from "@google/genai";
import { parseJSON } from "./gemini";
import { doubtSystemPrompt } from "./prompts";
import { sanitizeDoubtSolution } from "./validate";
import type { DoubtSolution, Language } from "./types";

const VISION_MODELS = ["gemini-2.5-flash", "gemini-2.0-flash"];

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

  const ai = new GoogleGenAI({ apiKey });

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
        },
      });

      const text = response.text ?? "";
      if (!text.trim()) throw new Error(`${model} returned empty text`);

      return sanitizeDoubtSolution(parseJSON<unknown>(text));
    } catch (error) {
      lastError = error;
      console.error(`[vision] ${model} failed`, error);
    }
  }

  throw lastError ?? new Error("Vision request failed");
}

import type { PromptPair } from "./prompts";

const GEMINI_MODELS = ["gemini-2.5-flash", "gemini-2.0-flash"];

type GenerateOptions = PromptPair & {
  temperature?: number;
  maxTokens?: number;
};

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  ms = 45000
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function callGemini(opts: GenerateOptions): Promise<string> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("MISSING_GEMINI_KEY");

  let lastError: unknown = null;

  for (const model of GEMINI_MODELS) {
    try {
      const res = await fetchWithTimeout(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(
          key
        )}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: opts.system }] },
            contents: [{ role: "user", parts: [{ text: opts.user }] }],
            generationConfig: {
              responseMimeType: "application/json",
              temperature: opts.temperature ?? 0.6,
              maxOutputTokens: opts.maxTokens ?? 4096,
            },
          }),
        }
      );

      if (!res.ok) {
        const body = await res.text();
        throw new Error(
          `Gemini ${model} ${res.status}: ${body.slice(0, 300)}`
        );
      }

      const data = await res.json();
      const parts = data?.candidates?.[0]?.content?.parts;
      const text = Array.isArray(parts)
        ? parts.map((p: { text?: string }) => p.text ?? "").join("")
        : "";
      if (!text.trim()) throw new Error(`Gemini ${model} returned empty text`);
      return text;
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError ?? new Error("Gemini request failed");
}

async function callGroq(opts: GenerateOptions): Promise<string> {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error("MISSING_GROQ_KEY");

  const res = await fetchWithTimeout(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL || "openai/gpt-oss-120b",
        messages: [
          { role: "system", content: opts.system },
          { role: "user", content: opts.user },
        ],
        temperature: opts.temperature ?? 0.6,
        max_tokens: opts.maxTokens ?? 4096,
        response_format: { type: "json_object" },
      }),
    }
  );

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Groq ${res.status}: ${body.slice(0, 300)}`);
  }

  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content ?? "";
  if (!text.trim()) throw new Error("Groq returned empty text");
  return text;
}

function extractJSON(raw: string): string {
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();

  try {
    JSON.parse(cleaned);
    return cleaned;
  } catch {
    // fall through to bracket extraction
  }

  const firstObj = cleaned.indexOf("{");
  const firstArr = cleaned.indexOf("[");
  let start = -1;
  if (firstObj === -1) start = firstArr;
  else if (firstArr === -1) start = firstObj;
  else start = Math.min(firstObj, firstArr);

  if (start === -1) return cleaned;

  const open = cleaned[start];
  const close = open === "{" ? "}" : "]";
  const end = cleaned.lastIndexOf(close);
  return end > start ? cleaned.slice(start, end + 1) : cleaned;
}

export function parseJSON<T>(raw: string): T {
  return JSON.parse(extractJSON(raw)) as T;
}

/**
 * Ask the AI for JSON. Tries Gemini (with model fallback) first, then Groq
 * as a backup. Throws a descriptive error if everything fails.
 */
export async function generateJSON<T>(opts: GenerateOptions): Promise<T> {
  const errors: string[] = [];

  try {
    const raw = await callGemini(opts);
    return parseJSON<T>(raw);
  } catch (err) {
    errors.push(err instanceof Error ? err.message : String(err));
  }

  try {
    const raw = await callGroq(opts);
    return parseJSON<T>(raw);
  } catch (err) {
    errors.push(err instanceof Error ? err.message : String(err));
  }

  throw new Error(`AI generation failed: ${errors.join(" | ")}`);
}

export function hasGeminiKey(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

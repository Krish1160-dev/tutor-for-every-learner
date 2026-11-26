import type { PromptPair } from "./prompts";

// Free-tier reality (Nov 2026): the 3.5–3.8 Flash models answer 503 "high demand"
// and Pro answers 429 quota. Flash-Lite is the only model this key can call, and
// it is fast once thinking is disabled. Groq remains the text backup.
const GEMINI_MODELS = ["gemini-3.1-flash-lite"];

type GenerateOptions = PromptPair & {
  temperature?: number;
  maxTokens?: number;
};

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  ms = 20000
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
    const started = Date.now();
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
              // Thinking tokens count against maxOutputTokens and can turn a
              // 2-second answer into a 4-minute one. Off for a snappy tutor.
              thinkingConfig: { thinkingBudget: 0 },
            },
          }),
        }
      );

      if (!res.ok) {
        const body = await res.text();
        console.error(
          `[gemini] ${model} HTTP ${res.status} after ${Date.now() - started}ms`
        );
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
      console.log(
        `[gemini] ${model} ok ${Date.now() - started}ms ${text.length} chars`
      );
      return text;
    } catch (err) {
      lastError = err;
      if (Date.now() - started > 40000) {
        console.error(`[gemini] ${model} slow/failed ${Date.now() - started}ms`);
      }
    }
  }

  throw lastError ?? new Error("Gemini request failed");
}

async function callGroq(opts: GenerateOptions): Promise<string> {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error("MISSING_GROQ_KEY");

  const request = () =>
    fetchWithTimeout(
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

  for (let attempt = 0; attempt < 2; attempt++) {
    const res = await request();

    if (res.status === 429) {
      const body = await res.text();
      if (attempt === 0) {
        // Free tier is token-per-minute limited. Wait for the window to clear.
        const match = body.match(/try again in ([\d.]+)s/i);
        const waitMs = Math.min((match ? Number(match[1]) : 8) + 1, 18) * 1000;
        await new Promise((resolve) => setTimeout(resolve, waitMs));
        continue;
      }
      throw new Error(`Groq 429: ${body.slice(0, 300)}`);
    }

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Groq ${res.status}: ${body.slice(0, 300)}`);
    }

    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content ?? "";
    if (!text.trim()) throw new Error("Groq returned empty text");
    return text;
  }

  throw new Error("Groq request failed");
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

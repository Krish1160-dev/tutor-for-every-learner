"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { postJSON } from "@/lib/client";
import { supabaseBrowser } from "@/lib/supabase/client";
import { LANGUAGES, type DoubtSolution, type Language } from "@/lib/types";
import { Spinner } from "./ui";

const DISCLAIMER =
  "AI can make mistakes. Please verify critical steps with your NCERT textbook or teacher.";

async function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read that image. Try a JPG or PNG."));
    };
    img.src = url;
  });
}

/** Shrink phone photos before upload so the request stays well under limits. */
async function downscale(
  file: File,
  maxSide = 1500
): Promise<{ dataUrl: string; mimeType: string }> {
  const img = await loadImage(file);
  const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
  const width = Math.max(1, Math.round(img.width * scale));
  const height = Math.max(1, Math.round(img.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not process that image.");

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(img, 0, 0, width, height);

  return { dataUrl: canvas.toDataURL("image/jpeg", 0.82), mimeType: "image/jpeg" };
}

export function DoubtSolver({ language = "English" }: { language?: Language }) {
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [lang, setLang] = useState<Language>(language);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [solution, setSolution] = useState<DoubtSolution | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLang(language);
  }, [language]);

  const close = useCallback(() => {
    setOpen(false);
    setError(null);
  }, []);

  const reset = useCallback(() => {
    setPreview(null);
    setNote("");
    setError(null);
    setSolution(null);
    setBusy(false);
    if (inputRef.current) inputRef.current.value = "";
  }, []);

  const pick = useCallback(async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    setSolution(null);
    try {
      const { dataUrl } = await downscale(file);
      setPreview(dataUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not read that image.");
    }
  }, []);

  const solve = useCallback(async () => {
    if (!preview) {
      setError("Add a photo of the question first.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await postJSON<{ solution: DoubtSolution }>("/api/doubt", {
        image: preview,
        mimeType: "image/jpeg",
        note: note.trim(),
        language: lang,
      });
      setSolution(res.solution);
      void saveDoubt(note.trim(), res.solution);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Could not solve that photo. Please try again."
      );
    } finally {
      setBusy(false);
    }
  }, [preview, note, lang]);

  return (
    <>
      <button
        onClick={() => {
          setOpen(true);
          setError(null);
        }}
        className="fixed bottom-5 right-4 z-40 flex items-center gap-2 rounded-full bg-brand-600 px-4 py-3 text-sm font-semibold text-white shadow-soft ring-1 ring-white/20 transition hover:bg-brand-700 active:scale-[0.98] sm:bottom-6 sm:right-6"
        aria-label="Ask a doubt with a photo"
      >
        <span aria-hidden className="text-base">
          📷
        </span>
        Ask a doubt
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-0 backdrop-blur-sm sm:items-center sm:p-6">
          <button
            className="absolute inset-0 cursor-default"
            aria-label="Close"
            onClick={close}
          />

          <div className="relative flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl bg-white shadow-soft sm:rounded-3xl">
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
              <div>
                <p className="text-sm font-bold text-ink">Camera doubt solver</p>
                <p className="text-xs text-slate-500">
                  Photograph any textbook or exam question.
                </p>
              </div>
              <button
                onClick={close}
                className="rounded-full px-2 py-1 text-sm text-slate-400 transition hover:bg-slate-100"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              {solution ? (
                <SolutionView solution={solution} />
              ) : (
                <div className="space-y-4">
                  <input
                    ref={inputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={(e) => void pick(e.target.files?.[0])}
                    className="hidden"
                  />

                  {preview ? (
                    <div className="relative overflow-hidden rounded-2xl ring-1 ring-black/5">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={preview}
                        alt="Question preview"
                        className="max-h-64 w-full object-contain bg-slate-50"
                      />
                      <button
                        onClick={() => {
                          setPreview(null);
                          setSolution(null);
                          if (inputRef.current) inputRef.current.value = "";
                        }}
                        className="absolute right-2 top-2 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-slate-600 ring-1 ring-black/5"
                      >
                        Retake
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => inputRef.current?.click()}
                      className="flex w-full flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/60 px-4 py-8 text-center transition hover:border-brand-300 hover:bg-brand-50/40"
                    >
                      <span className="text-2xl" aria-hidden>
                        📸
                      </span>
                      <span className="text-sm font-semibold text-ink">
                        Take a photo or upload
                      </span>
                      <span className="text-xs text-slate-500">
                        Crop to the question. Bright light, steady hand.
                      </span>
                    </button>
                  )}

                  <div>
                    <label
                      htmlFor="doubt-note"
                      className="mb-1.5 block text-xs font-semibold text-slate-600"
                    >
                      Add a note (optional)
                    </label>
                    <textarea
                      id="doubt-note"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      rows={2}
                      maxLength={400}
                      placeholder="e.g. I don't understand step 2, or solve only part (b)"
                      className="w-full resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-200"
                    />
                  </div>

                  <div>
                    <p className="mb-1.5 text-xs font-semibold text-slate-600">
                      Answer language
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {LANGUAGES.map((l) => (
                        <button
                          key={l}
                          onClick={() => setLang(l)}
                          aria-pressed={lang === l}
                          className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                            lang === l
                              ? "bg-brand-600 text-white"
                              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                          }`}
                        >
                          {l}
                        </button>
                      ))}
                    </div>
                  </div>

                  {error && (
                    <p className="rounded-xl bg-rose-50 px-3 py-2 text-xs text-rose-700 ring-1 ring-rose-200">
                      ⚠️ {error}
                    </p>
                  )}

                  <button
                    onClick={() => void solve()}
                    disabled={busy || !preview}
                    className="btn-primary w-full py-3 text-sm"
                  >
                    {busy ? (
                      <>
                        <Spinner /> Reading your question…
                      </>
                    ) : (
                      "Solve this question →"
                    )}
                  </button>
                </div>
              )}
            </div>

            {solution && (
              <div className="border-t border-slate-100 px-5 py-3">
                <button
                  onClick={reset}
                  className="w-full rounded-xl bg-slate-100 px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
                >
                  Solve another question
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function SolutionView({ solution }: { solution: DoubtSolution }) {
  return (
    <div className="space-y-4">
      <Section title="1. Given data" tone="slate">
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
          {solution.given}
        </p>
      </Section>

      <Section title="2. Concept / formula used" tone="brand">
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
          {solution.concept}
        </p>
      </Section>

      <Section title="3. Step-by-step solution" tone="slate">
        <ol className="space-y-2">
          {solution.steps.map((step, i) => (
            <li
              key={i}
              className="flex gap-2.5 text-sm leading-relaxed text-slate-700"
            >
              <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-brand-100 text-[10px] font-bold text-brand-700">
                {i + 1}
              </span>
              <span className="whitespace-pre-wrap">{step}</span>
            </li>
          ))}
        </ol>
      </Section>

      <Section title="4. Final answer" tone="mint">
        <p className="whitespace-pre-wrap text-sm font-semibold leading-relaxed text-mint-600">
          {solution.finalAnswer}
        </p>
      </Section>

      <p className="rounded-xl bg-amber-50 px-3 py-2 text-[11px] leading-relaxed text-amber-700 ring-1 ring-amber-200">
        {DISCLAIMER}
      </p>
    </div>
  );
}

function Section({
  title,
  tone,
  children,
}: {
  title: string;
  tone: "slate" | "brand" | "mint";
  children: ReactNode;
}) {
  const ring =
    tone === "brand"
      ? "ring-brand-100 bg-brand-50/50"
      : tone === "mint"
      ? "ring-mint-500/30 bg-mint-500/5"
      : "ring-slate-100 bg-slate-50/70";

  return (
    <section className={`rounded-2xl px-3.5 py-3 ring-1 ${ring}`}>
      <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-500">
        {title}
      </p>
      {children}
    </section>
  );
}

/** Fire-and-forget save for signed-in students; RLS keeps rows private. */
async function saveDoubt(note: string, solution: DoubtSolution) {
  const supabase = supabaseBrowser();
  if (!supabase) return;
  try {
    const { data } = await supabase.auth.getUser();
    const user = data.user;
    if (!user) return;
    await supabase.from("doubts").insert({
      user_id: user.id,
      note: note || null,
      answer: solution,
    });
  } catch {
    // Saving is a bonus; never block the answer.
  }
}

"use client";

import { useState } from "react";
import { PRESETS } from "@/lib/presets";
import {
  LANGUAGES,
  LEVELS,
  type Language,
  type Level,
  type Preset,
  type TutorConfig,
} from "@/lib/types";
import { ErrorBox, Spinner } from "./ui";

type Props = {
  defaultConfig: TutorConfig;
  loading: boolean;
  error: string | null;
  onStart: (config: TutorConfig, preset?: Preset) => void;
};

export function StartScreen({ defaultConfig, loading, error, onStart }: Props) {
  const [topic, setTopic] = useState(defaultConfig.topic);
  const [level, setLevel] = useState<Level>(defaultConfig.level);
  const [language, setLanguage] = useState<Language>(defaultConfig.language);

  const canStart = topic.trim().length > 1 && !loading;

  return (
    <div className="animate-fade-up space-y-6">
      <section className="text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-semibold text-brand-700 ring-1 ring-brand-100">
          <span className="h-1.5 w-1.5 rounded-full bg-mint-500" /> Proof, not
          busywork
        </span>
        <h1 className="mt-4 text-balance text-3xl font-extrabold leading-tight tracking-tight text-ink sm:text-4xl">
          Find your exact gap.
          <br />
          Learn it. <span className="text-brand-600">Prove it.</span>
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-pretty text-slate-600">
          Any topic, any level, your language. Take a quick diagnostic, get
          taught the one thing you&apos;re stuck on, then retest to see real
          improvement.
        </p>
      </section>

      {error && <ErrorBox message={error} />}

      <section>
        <h2 className="mb-2.5 text-sm font-semibold text-slate-500">
          Try a quick demo
        </h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              onClick={() =>
                onStart(
                  { topic: p.topic, level: p.level, language: p.language },
                  p
                )
              }
              disabled={loading}
              className="group card flex flex-col items-start gap-2 p-4 text-left transition hover:-translate-y-0.5 hover:shadow-soft disabled:opacity-60"
            >
              <span className="text-2xl">{p.emoji}</span>
              <span className="text-sm font-bold text-ink">{p.title}</span>
              <span className="text-xs text-slate-500">{p.blurb}</span>
              <span className="mt-1 text-xs font-semibold text-brand-600 group-hover:underline">
                Start →
              </span>
            </button>
          ))}
        </div>
      </section>

      <div className="flex items-center gap-3 text-xs font-medium text-slate-400">
        <div className="h-px flex-1 bg-slate-200" /> or build your own{" "}
        <div className="h-px flex-1 bg-slate-200" />
      </div>

      <section className="card space-y-5 p-5 sm:p-6">
        <div>
          <label
            htmlFor="topic"
            className="mb-1.5 block text-sm font-semibold text-ink"
          >
            What do you want to learn?
          </label>
          <input
            id="topic"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. Photosynthesis, Fractions, Newton's Laws…"
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base outline-none transition placeholder:text-slate-400 focus:border-brand-400 focus:ring-2 focus:ring-brand-200"
            maxLength={80}
          />
        </div>

        <div>
          <p className="mb-1.5 text-sm font-semibold text-ink">Learner level</p>
          <div className="flex flex-wrap gap-2">
            {LEVELS.map((l) => (
              <button
                key={l}
                onClick={() => setLevel(l)}
                className={`chip ${level === l ? "chip-active" : "chip-idle"}`}
                aria-pressed={level === l}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-1.5 text-sm font-semibold text-ink">Explain in</p>
          <div className="flex flex-wrap gap-2">
            {LANGUAGES.map((l) => (
              <button
                key={l}
                onClick={() => setLanguage(l)}
                className={`chip ${
                  language === l ? "chip-active" : "chip-idle"
                }`}
                aria-pressed={language === l}
              >
                {l}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-slate-400">
            Questions stay in English; explanations and feedback are in your
            language.
          </p>
        </div>

        <button
          onClick={() => onStart({ topic: topic.trim(), level, language })}
          disabled={!canStart}
          className="btn-primary w-full"
        >
          {loading ? (
            <>
              <Spinner /> Building your diagnostic…
            </>
          ) : (
            "Start the diagnostic →"
          )}
        </button>
      </section>
    </div>
  );
}

"use client";

import { useState } from "react";
import { PRESETS } from "@/lib/presets";
import {
  LANGUAGES,
  STANDARDS,
  defaultSubjectFor,
  isJee,
  subjectsFor,
  type Language,
  type Preset,
  type Standard,
  type StudyConfig,
  type Subject,
} from "@/lib/types";
import { ChapterBrowser } from "./ChapterBrowser";
import { PyqHub } from "./PyqHub";
import { ErrorBox, Spinner } from "./ui";

type Props = {
  defaultConfig: StudyConfig;
  loading: boolean;
  error: string | null;
  onStart: (config: StudyConfig, preset?: Preset) => void;
};

export function StudyHub({ defaultConfig, loading, error, onStart }: Props) {
  const [standard, setStandard] = useState<Standard>(defaultConfig.standard);
  const [subject, setSubject] = useState<Subject>(defaultConfig.subject);
  const [language, setLanguage] = useState<Language>(defaultConfig.language);
  const [topic, setTopic] = useState("");

  const subjects = subjectsFor(standard);
  const activeSubject = subjects.includes(subject) ? subject : subjects[0];
  const jee = isJee(standard);
  const topicReady = topic.trim().length > 1 && !loading;

  const chooseStandard = (next: Standard) => {
    setStandard(next);
    const nextSubjects = subjectsFor(next);
    if (!nextSubjects.includes(subject)) {
      setSubject(defaultSubjectFor(next));
    }
  };

  return (
    <div className="animate-fade-up space-y-6">
      <section className="text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-semibold text-brand-700 ring-1 ring-brand-100">
          <span className="h-1.5 w-1.5 rounded-full bg-mint-500" />
          Class 6–12 NCERT · JEE Main PYQs
        </span>
        <h1 className="mt-4 text-balance text-3xl font-extrabold leading-tight tracking-tight text-ink sm:text-4xl">
          Find your exact gap.
          <br />
          Learn it. <span className="text-brand-600">Prove it.</span>
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-pretty text-slate-600">
          Pick your class and subject. Study chapter notes, practise a
          diagnostic, then retest to prove real improvement — in English, Hindi,
          Tamil or Telugu.
        </p>
      </section>

      {error && <ErrorBox message={error} />}

      <section>
        <h2 className="mb-2.5 text-sm font-semibold text-slate-500">
          ⚡ Instant demo · no AI needed
        </h2>
        <div className="grid gap-2 sm:grid-cols-3">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              onClick={() => onStart(p.config, p)}
              disabled={loading}
              className="group card flex items-center gap-3 p-3 text-left transition hover:-translate-y-0.5 hover:shadow-soft disabled:opacity-60"
            >
              <span className="text-xl">{p.emoji}</span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-bold text-ink">
                  {p.title}
                </span>
                <span className="block truncate text-[11px] text-slate-500">
                  {p.blurb}
                </span>
              </span>
              <span className="ml-auto text-xs font-semibold text-brand-600 group-hover:underline">
                →
              </span>
            </button>
          ))}
        </div>
      </section>

      <section className="card space-y-4 p-4 sm:p-5">
        <div>
          <p className="mb-1.5 text-sm font-semibold text-ink">
            Class / standard
          </p>
          <div className="scroll-thin -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
            {STANDARDS.map((s) => (
              <button
                key={s}
                onClick={() => chooseStandard(s)}
                aria-pressed={standard === s}
                className={`chip shrink-0 ${
                  standard === s ? "chip-active" : "chip-idle"
                }`}
              >
                {s === "JEE Aspirant" ? "🎯 JEE" : s.replace("Class ", "Class ")}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-1.5 text-sm font-semibold text-ink">Subject</p>
          <div className="flex flex-wrap gap-2">
            {subjects.map((s) => (
              <button
                key={s}
                onClick={() => setSubject(s)}
                aria-pressed={activeSubject === s}
                className={`chip ${
                  activeSubject === s ? "chip-active" : "chip-idle"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-1.5 text-sm font-semibold text-ink">Language</p>
          <div className="flex flex-wrap gap-2">
            {LANGUAGES.map((l) => (
              <button
                key={l}
                onClick={() => setLanguage(l)}
                aria-pressed={language === l}
                className={`chip ${
                  language === l ? "chip-active" : "chip-idle"
                }`}
              >
                {l}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-slate-400">
            Questions stay in English; explanations, feedback and revision notes
            are in your language.
          </p>
        </div>
      </section>

      <section className="card p-4 sm:p-5">
        {jee ? (
          <PyqHub language={language} busy={loading} onStart={onStart} />
        ) : (
          <ChapterBrowser
            key={`${standard}-${activeSubject}-${language}`}
            standard={standard}
            subject={activeSubject}
            language={language}
            busy={loading}
            onPractice={onStart}
          />
        )}
      </section>

      <div className="flex items-center gap-3 text-xs font-medium text-slate-400">
        <div className="h-px flex-1 bg-slate-200" /> or learn any topic{" "}
        <div className="h-px flex-1 bg-slate-200" />
      </div>

      <section className="card space-y-3 p-4 sm:p-5">
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
            placeholder="e.g. Photosynthesis, Newton's Laws, Quadratic Equations…"
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base outline-none transition placeholder:text-slate-400 focus:border-brand-400 focus:ring-2 focus:ring-brand-200"
            maxLength={80}
          />
          <p className="mt-1.5 text-xs text-slate-400">
            {jee
              ? "JEE-level questions"
              : `${standard} ${activeSubject} · NCERT scope`}{" "}
            · {language}
          </p>
        </div>

        <button
          onClick={() =>
            onStart({
              standard,
              subject: activeSubject,
              language,
              topic: topic.trim(),
            })
          }
          disabled={!topicReady}
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

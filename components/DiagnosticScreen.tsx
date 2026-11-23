"use client";

import type { Question, TutorConfig } from "@/lib/types";
import { ErrorBox, LoadingCard } from "./ui";

const LETTERS = ["A", "B", "C", "D"];

type Props = {
  config: TutorConfig;
  questions: Question[];
  index: number;
  beforeScore: number | null;
  weakest: string;
  isStretch: boolean;
  loading: boolean;
  error: string | null;
  onAnswer: (choice: number) => void;
  onContinue: () => void;
  onRetry: () => void;
};

export function DiagnosticScreen({
  config,
  questions,
  index,
  beforeScore,
  weakest,
  isStretch,
  loading,
  error,
  onAnswer,
  onContinue,
  onRetry,
}: Props) {
  if (loading && questions.length === 0) {
    return (
      <LoadingCard
        label={`Building 5 diagnostic questions on ${config.topic}…`}
      />
    );
  }

  if (error && questions.length === 0) {
    return <ErrorBox message={error} onRetry={onRetry} />;
  }

  if (questions.length === 0) {
    return <ErrorBox message="No questions loaded." onRetry={onRetry} />;
  }

  if (beforeScore !== null) {
    const pct = Math.round((beforeScore / questions.length) * 100);
    return (
      <div className="animate-pop space-y-4">
        <div className="card p-6 text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-400">
            Your before score
          </p>
          <p className="mt-2 text-6xl font-extrabold text-ink">
            {beforeScore}
            <span className="text-2xl text-slate-400">/{questions.length}</span>
          </p>
          <div className="mx-auto mt-4 h-2.5 w-full max-w-xs overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full animate-bar rounded-full bg-brand-500"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="mt-3 text-sm text-slate-500">
            {config.topic} · {config.level}
          </p>
        </div>

        <div className="card p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-500">
            {isStretch ? "Stretch concept" : "Your exact gap"}
          </p>
          <p className="mt-1.5 text-lg font-bold leading-snug text-ink">
            {weakest}
          </p>
          <p className="mt-1.5 text-sm text-slate-500">
            {isStretch
              ? "You aced the diagnostic — nice. Let's stretch you with a harder idea."
              : "This is the misconception behind your wrong answers. Let's fix it."}
          </p>
        </div>

        <button onClick={onContinue} className="btn-primary w-full">
          Teach me this →
        </button>
      </div>
    );
  }

  const q = questions[index];
  const progress = ((index + 1) / questions.length) * 100;

  return (
    <div className="animate-fade-up space-y-4">
      <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
        <span>Diagnostic · {config.topic}</span>
        <span>
          {index + 1} of {questions.length}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-white ring-1 ring-black/5">
        <div
          className="h-full rounded-full bg-brand-500 transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div key={q.id} className="card animate-pop p-5 sm:p-6">
        <p className="text-lg font-bold leading-snug text-ink">{q.question}</p>
        <div className="mt-4 grid gap-2.5">
          {q.options.map((opt, i) => (
            <button
              key={i}
              onClick={() => onAnswer(i)}
              className="option"
              disabled={loading}
            >
              <span className="option-letter">{LETTERS[i]}</span>
              <span className="flex-1">{opt}</span>
            </button>
          ))}
        </div>
      </div>
      <p className="text-center text-xs text-slate-400">
        No feedback yet — this is your honest starting point.
      </p>
    </div>
  );
}

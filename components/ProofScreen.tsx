"use client";

import type { Question, StudyConfig } from "@/lib/types";
import { configTitle } from "@/lib/types";
import { ErrorBox, LoadingCard } from "./ui";

const LETTERS = ["A", "B", "C", "D"];

type Props = {
  config: StudyConfig;
  questions: Question[];
  index: number;
  loading: boolean;
  error: string | null;
  onAnswer: (choice: number) => void;
  onRetry: () => void;
};

export function ProofScreen({
  config,
  questions,
  index,
  loading,
  error,
  onAnswer,
  onRetry,
}: Props) {
  if (loading && questions.length === 0) {
    return (
      <LoadingCard
        label={`Building 5 new questions on ${configTitle(config)}…`}
      />
    );
  }

  if (error && questions.length === 0) {
    return <ErrorBox message={error} onRetry={onRetry} />;
  }

  if (questions.length === 0) {
    return <ErrorBox message="No retest questions loaded." onRetry={onRetry} />;
  }

  const q = questions[index];
  const progress = ((index + 1) / questions.length) * 100;

  return (
    <div className="animate-fade-up space-y-4">
      <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
        <span>Proof · {configTitle(config)}</span>
        <span>
          {index + 1} of {questions.length}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-white ring-1 ring-black/5">
        <div
          className="h-full rounded-full bg-mint-500 transition-all"
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
        New questions, same concepts — so this measures learning, not memory.
      </p>
    </div>
  );
}

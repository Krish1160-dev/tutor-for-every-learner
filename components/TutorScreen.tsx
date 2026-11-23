"use client";

import { useState } from "react";
import type { JudgeResult, StudyConfig, TutorTurn } from "@/lib/types";
import { ErrorBox, LoadingCard, Spinner } from "./ui";

type Props = {
  config: StudyConfig;
  weakest: string;
  isStretch: boolean;
  tutor: TutorTurn | null;
  attempt: number;
  judge: JudgeResult | null;
  loading: boolean;
  error: string | null;
  onSubmitReply: (text: string) => void;
  onRetryExplanation: () => void;
  onContinue: () => void;
  onSkip: () => void;
  onRetryTutor: () => void;
};

export function TutorScreen({
  config,
  weakest,
  isStretch,
  tutor,
  attempt,
  judge,
  loading,
  error,
  onSubmitReply,
  onRetryExplanation,
  onContinue,
  onSkip,
  onRetryTutor,
}: Props) {
  const [text, setText] = useState("");

  if (!tutor) {
    if (error) {
      return (
        <div className="space-y-3">
          <ErrorBox message={error} onRetry={onRetryTutor} />
          <button
            onClick={onSkip}
            className="mx-auto block text-xs font-medium text-slate-400 hover:text-slate-600"
          >
            Skip to the proof →
          </button>
        </div>
      );
    }
    return <LoadingCard label={`Preparing a ${config.language} explanation…`} />;
  }

  const understood = judge?.understood === true;
  const canRetry = !understood && attempt < 3;

  return (
    <div className="animate-fade-up space-y-4">
      <div className="card p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-amber-500">
          {isStretch ? "Stretch concept" : "The gap we're fixing"}
        </p>
        <p className="mt-1 text-base font-bold text-ink">{weakest}</p>
      </div>

      <div className="card p-5 sm:p-6">
        <div className="mb-3 flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-brand-100 text-sm">
            🧑‍🏫
          </span>
          <div>
            <p className="text-sm font-bold text-ink">Your tutor</p>
            <p className="text-xs text-slate-400">
              Explaining in {config.language} · attempt {attempt} of 3
            </p>
          </div>
        </div>
        <div className="prose-tutor whitespace-pre-wrap text-[15px] leading-relaxed text-slate-700">
          {tutor.explanation}
        </div>
      </div>

      <div className="card border-brand-100 bg-brand-50/40 p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">
          Check your understanding
        </p>
        <p className="mt-1.5 text-base font-semibold text-ink">
          {tutor.checkQuestion}
        </p>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          placeholder={`Type your answer in ${config.language}…`}
          className="mt-3 w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base outline-none transition placeholder:text-slate-400 focus:border-brand-400 focus:ring-2 focus:ring-brand-200"
        />

        {error && (
          <div className="mt-3">
            <ErrorBox message={error} />
          </div>
        )}

        {!judge && (
          <button
            onClick={() => onSubmitReply(text.trim())}
            disabled={text.trim().length < 2 || loading}
            className="btn-primary mt-3 w-full"
          >
            {loading ? (
              <>
                <Spinner /> Checking…
              </>
            ) : (
              "Check my answer"
            )}
          </button>
        )}

        {judge && (
          <div
            className={`mt-3 rounded-2xl px-4 py-3 text-sm ${
              understood
                ? "bg-mint-500/10 text-mint-700 ring-1 ring-mint-500/30"
                : "bg-amber-50 text-amber-800 ring-1 ring-amber-200"
            }`}
          >
            <p className="font-bold">
              {understood ? "✅ You've got it!" : "🌱 Not quite yet"}
            </p>
            {judge.reason && <p className="mt-1">{judge.reason}</p>}
          </div>
        )}
      </div>

      {judge && understood && (
        <button onClick={onContinue} className="btn-mint w-full">
          Continue to the proof →
        </button>
      )}

      {judge && !understood && canRetry && (
        <button
          onClick={() => {
            setText("");
            onRetryExplanation();
          }}
          disabled={loading}
          className="btn-primary w-full"
        >
          {loading ? (
            <>
              <Spinner /> Thinking of another way…
            </>
          ) : (
            "Explain it a different way"
          )}
        </button>
      )}

      {judge && !understood && !canRetry && (
        <div className="space-y-2">
          <p className="text-center text-xs text-slate-500">
            That&apos;s 3 tries — let&apos;s move on and see what sticks.
          </p>
          <button onClick={onContinue} className="btn-primary w-full">
            Continue to the proof →
          </button>
        </div>
      )}

      {!judge && (
        <button
          onClick={onSkip}
          className="mx-auto block text-xs font-medium text-slate-400 hover:text-slate-600"
        >
          Skip to the proof →
        </button>
      )}
    </div>
  );
}

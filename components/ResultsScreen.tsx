"use client";

import type { Question, StudyConfig } from "@/lib/types";
import { configSubtitle, configTitle } from "@/lib/types";

const LETTERS = ["A", "B", "C", "D"];

type Props = {
  config: StudyConfig;
  beforeScore: number;
  afterScore: number;
  total: number;
  fixed: string[];
  stillWorking: string[];
  diagnostic: Question[];
  diagAnswers: number[];
  proof: Question[];
  proofAnswers: number[];
  onRestart: () => void;
  onReplay: () => void;
};

export function ResultsScreen({
  config,
  beforeScore,
  afterScore,
  total,
  fixed,
  stillWorking,
  diagnostic,
  diagAnswers,
  proof,
  proofAnswers,
  onRestart,
  onReplay,
}: Props) {
  const delta = afterScore - beforeScore;
  const improved = delta > 0;
  const same = delta === 0;
  const hasSolutions =
    proof.some((q) => q.solution) || diagnostic.some((q) => q.solution);

  return (
    <div className="animate-fade-up space-y-4">
      <div className="card overflow-hidden">
        <div className="bg-gradient-to-br from-brand-600 to-brand-800 px-6 py-6 text-white">
          <p className="text-xs font-semibold uppercase tracking-widest text-white/70">
            Proof of learning
          </p>
          <h2 className="mt-1 text-2xl font-extrabold">
            {configTitle(config)}
          </h2>
          <p className="text-sm text-white/70">{configSubtitle(config)}</p>

          <div className="mt-5 flex items-end justify-center gap-5">
            <div className="text-center">
              <p className="text-xs font-semibold uppercase tracking-wide text-white/60">
                Before
              </p>
              <p className="text-5xl font-extrabold">
                {beforeScore}
                <span className="text-xl text-white/50">/{total}</span>
              </p>
            </div>
            <div className="pb-3 text-2xl text-white/50">→</div>
            <div className="text-center">
              <p className="text-xs font-semibold uppercase tracking-wide text-white/60">
                After
              </p>
              <p className="text-5xl font-extrabold text-mint-300">
                {afterScore}
                <span className="text-xl text-white/50">/{total}</span>
              </p>
            </div>
          </div>

          <p className="mt-4 text-center text-sm font-semibold">
            {improved
              ? `+${delta} correct — real improvement.`
              : same
              ? "No change this time — that's honest data."
              : `${delta} correct — the retest was harder.`}
          </p>
        </div>

        <div className="space-y-4 p-5 sm:p-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Gaps you fixed
            </p>
            {fixed.length > 0 ? (
              <ul className="mt-2 space-y-1.5">
                {fixed.map((f, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-sm text-slate-700"
                  >
                    <span className="mt-0.5 text-mint-500">✓</span>{" "}
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-1 text-sm text-slate-500">
                No gaps fixed yet. That&apos;s okay — try another explanation or
                topic.
              </p>
            )}
          </div>

          {stillWorking.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Still working on
              </p>
              <ul className="mt-2 space-y-1.5">
                {stillWorking.map((f, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-sm text-slate-700"
                  >
                    <span className="mt-0.5 text-amber-500">•</span>{" "}
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="rounded-2xl bg-slate-50 p-4 text-xs leading-relaxed text-slate-500">
            <strong className="text-slate-700">Why this counts:</strong> the
            retest used different questions on the same concepts. A higher score
            can&apos;t come from memorising the first set — it comes from
            understanding.
          </div>

          <div className="grid gap-2.5 sm:grid-cols-2">
            <button onClick={onReplay} className="btn-primary">
              Run it again
            </button>
            <button onClick={onRestart} className="btn-ghost">
              {config.pyq ? "Choose another paper" : "Choose another chapter"}
            </button>
          </div>
        </div>
      </div>

      {proof.length > 0 && (
        <details className="card group p-4 sm:p-5">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
            <span>
              <span className="block text-sm font-bold text-ink">
                📝 Proof question review
              </span>
              <span className="block text-xs text-slate-500">
                Your answers, correct answers
                {hasSolutions ? " and step-by-step solutions" : ""}.
              </span>
            </span>
            <span className="text-xs text-slate-400 transition-transform group-open:rotate-180">
              ▾
            </span>
          </summary>
          <div className="mt-4 space-y-4">
            <ReviewList
              questions={proof}
              answers={proofAnswers}
              showSolution
            />
          </div>
        </details>
      )}

      {diagnostic.length > 0 && (
        <details className="card group p-4 sm:p-5">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
            <span>
              <span className="block text-sm font-bold text-ink">
                🔍 Diagnostic review
              </span>
              <span className="block text-xs text-slate-500">
                See the starting questions and the exact ideas behind them.
              </span>
            </span>
            <span className="text-xs text-slate-400 transition-transform group-open:rotate-180">
              ▾
            </span>
          </summary>
          <div className="mt-4 space-y-4">
            <ReviewList
              questions={diagnostic}
              answers={diagAnswers}
              showSolution
            />
          </div>
        </details>
      )}
    </div>
  );
}

function ReviewList({
  questions,
  answers,
  showSolution,
}: {
  questions: Question[];
  answers: number[];
  showSolution?: boolean;
}) {
  return (
    <div className="space-y-3">
      {questions.map((q, i) => {
        const chosen = answers[i];
        const correct = chosen === q.correct;
        return (
          <div
            key={i}
            className="rounded-2xl bg-slate-50 p-3.5 ring-1 ring-black/5"
          >
            <p className="text-sm font-semibold leading-snug text-ink">
              {i + 1}. {q.question}
            </p>

            <div className="mt-2 space-y-1 text-xs">
              <p className={correct ? "text-mint-700" : "text-rose-700"}>
                <span className="font-semibold">Your answer:</span>{" "}
                {typeof chosen === "number"
                  ? `${LETTERS[chosen] ?? ""} ${q.options[chosen] ?? ""}`
                  : "Not answered"}
                {typeof chosen === "number" && (correct ? " ✓" : " ✗")}
              </p>
              {!correct && (
                <p className="text-slate-700">
                  <span className="font-semibold">Correct answer:</span>{" "}
                  {LETTERS[q.correct]} {q.options[q.correct]}
                </p>
              )}
            </div>

            {q.explanation && (
              <p className="mt-2 text-xs leading-relaxed text-slate-600">
                <span className="font-semibold text-slate-700">Why:</span>{" "}
                {q.explanation}
              </p>
            )}

            {showSolution && q.solution && (
              <div className="mt-2 rounded-xl bg-white p-2.5 text-xs leading-relaxed text-slate-600 ring-1 ring-black/5">
                <p className="mb-1 font-semibold text-slate-700">
                  Step-by-step solution
                </p>
                <p className="whitespace-pre-wrap">{q.solution}</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

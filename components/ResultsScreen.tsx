"use client";

import type { TutorConfig } from "@/lib/types";

type Props = {
  config: TutorConfig;
  beforeScore: number;
  afterScore: number;
  total: number;
  fixed: string[];
  stillWorking: string[];
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
  onRestart,
  onReplay,
}: Props) {
  const delta = afterScore - beforeScore;
  const improved = delta > 0;
  const same = delta === 0;

  return (
    <div className="animate-fade-up space-y-4">
      <div className="card overflow-hidden">
        <div className="bg-gradient-to-br from-brand-600 to-brand-800 px-6 py-6 text-white">
          <p className="text-xs font-semibold uppercase tracking-widest text-white/70">
            Proof of learning
          </p>
          <h2 className="mt-1 text-2xl font-extrabold">{config.topic}</h2>
          <p className="text-sm text-white/70">
            {config.level} · {config.language}
          </p>

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
              Try another topic
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

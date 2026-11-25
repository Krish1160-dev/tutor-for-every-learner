"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Shell } from "@/components/Shell";
import { StudyHub } from "@/components/StudyHub";
import { DiagnosticScreen } from "@/components/DiagnosticScreen";
import { TutorScreen } from "@/components/TutorScreen";
import { ProofScreen } from "@/components/ProofScreen";
import { ResultsScreen } from "@/components/ResultsScreen";
import { cloneQuestions, findPresetById } from "@/lib/presets";
import { postJSON } from "@/lib/client";
import { saveDiagnosticScore } from "@/lib/supabase/scores";
import {
  apiConfig,
  isLanguage,
  isStandard,
  isSubject,
  normalizeConfig,
  type JudgeResult,
  type Preset,
  type Question,
  type StudyConfig,
  type TutorTurn,
} from "@/lib/types";

type Stage = "start" | "diagnostic" | "tutor" | "proof" | "results";

const SESSION_KEY = "tutor-session-v3";

const DEFAULT_CONFIG: StudyConfig = {
  standard: "Class 10",
  subject: "Science",
  language: "English",
  topic: "",
};

export default function Page() {
  const [hydrated, setHydrated] = useState(false);
  const [stage, setStage] = useState<Stage>("start");
  const [config, setConfig] = useState<StudyConfig>(DEFAULT_CONFIG);
  const [diagnostic, setDiagnostic] = useState<Question[]>([]);
  const [diagIndex, setDiagIndex] = useState(0);
  const [diagAnswers, setDiagAnswers] = useState<number[]>([]);
  const [beforeScore, setBeforeScore] = useState<number | null>(null);
  const [wrongTags, setWrongTags] = useState<string[]>([]);
  const [weakest, setWeakest] = useState("");
  const [isStretch, setIsStretch] = useState(false);
  const [tutor, setTutor] = useState<TutorTurn | null>(null);
  const [tutorAttempt, setTutorAttempt] = useState(1);
  const [tutorExplanations, setTutorExplanations] = useState<string[]>([]);
  const [judge, setJudge] = useState<JudgeResult | null>(null);
  const [reply, setReply] = useState("");
  const [proof, setProof] = useState<Question[]>([]);
  const [proofIndex, setProofIndex] = useState(0);
  const [proofAnswers, setProofAnswers] = useState<number[]>([]);
  const [afterScore, setAfterScore] = useState<number | null>(null);
  const [usedPresetId, setUsedPresetId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const savedRef = useRef<string | null>(null);

  // ---- restore a previous session -------------------------------------
  useEffect(() => {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (raw) {
        const s = JSON.parse(raw);
        if (s && typeof s === "object") {
          setConfig(normalizeConfig(s.config));
          setDiagnostic(Array.isArray(s.diagnostic) ? s.diagnostic : []);
          setDiagIndex(Number(s.diagIndex) || 0);
          setDiagAnswers(Array.isArray(s.diagAnswers) ? s.diagAnswers : []);
          setBeforeScore(
            typeof s.beforeScore === "number" ? s.beforeScore : null
          );
          setWrongTags(Array.isArray(s.wrongTags) ? s.wrongTags : []);
          setWeakest(typeof s.weakest === "string" ? s.weakest : "");
          setIsStretch(Boolean(s.isStretch));
          setTutor(s.tutor ?? null);
          setTutorAttempt(Number(s.tutorAttempt) || 1);
          setTutorExplanations(
            Array.isArray(s.tutorExplanations) ? s.tutorExplanations : []
          );
          setJudge(s.judge ?? null);
          setReply(typeof s.reply === "string" ? s.reply : "");
          setProof(Array.isArray(s.proof) ? s.proof : []);
          setProofIndex(Number(s.proofIndex) || 0);
          setProofAnswers(
            Array.isArray(s.proofAnswers) ? s.proofAnswers : []
          );
          setAfterScore(
            typeof s.afterScore === "number" ? s.afterScore : null
          );
          setUsedPresetId(
            typeof s.usedPresetId === "string" ? s.usedPresetId : null
          );

          let safeStage: Stage = s.stage ?? "start";
          if (
            safeStage === "diagnostic" &&
            (!Array.isArray(s.diagnostic) || s.diagnostic.length === 0)
          ) {
            safeStage = "start";
          }
          if (safeStage === "tutor" && !s.tutor) {
            safeStage = s.beforeScore !== null ? "diagnostic" : "start";
          }
          if (
            safeStage === "proof" &&
            (!Array.isArray(s.proof) || s.proof.length === 0)
          ) {
            safeStage = s.tutor ? "tutor" : "diagnostic";
          }
          if (safeStage === "results" && typeof s.afterScore !== "number") {
            safeStage = "proof";
          }
          setStage(safeStage);
        }
      }
    } catch {
      // ignore corrupt storage
    }
    setHydrated(true);
  }, []);

  // ---- persist the session --------------------------------------------
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(
        SESSION_KEY,
        JSON.stringify({
          stage,
          config,
          diagnostic,
          diagIndex,
          diagAnswers,
          beforeScore,
          wrongTags,
          weakest,
          isStretch,
          tutor,
          tutorAttempt,
          tutorExplanations,
          judge,
          reply,
          proof,
          proofIndex,
          proofAnswers,
          afterScore,
          usedPresetId,
        })
      );
    } catch {
      // storage may be full or blocked
    }
  }, [
    hydrated,
    stage,
    config,
    diagnostic,
    diagIndex,
    diagAnswers,
    beforeScore,
    wrongTags,
    weakest,
    isStretch,
    tutor,
    tutorAttempt,
    tutorExplanations,
    judge,
    reply,
    proof,
    proofIndex,
    proofAnswers,
    afterScore,
    usedPresetId,
  ]);

  const reset = useCallback(() => {
    try {
      localStorage.removeItem(SESSION_KEY);
    } catch {
      // ignore
    }
    setStage("start");
    setDiagnostic([]);
    setDiagIndex(0);
    setDiagAnswers([]);
    setBeforeScore(null);
    setWrongTags([]);
    setWeakest("");
    setIsStretch(false);
    setTutor(null);
    setTutorAttempt(1);
    setTutorExplanations([]);
    setJudge(null);
    setReply("");
    setProof([]);
    setProofIndex(0);
    setProofAnswers([]);
    setAfterScore(null);
    setUsedPresetId(null);
    setLoading(false);
    setError(null);
  }, []);

  // ---- start a new diagnostic -----------------------------------------
  const start = useCallback(
    async (nextConfig: StudyConfig, preset?: Preset) => {
      setError(null);
      setConfig(nextConfig);
      setDiagnostic([]);
      setDiagIndex(0);
      setDiagAnswers([]);
      setBeforeScore(null);
      setWrongTags([]);
      setWeakest("");
      setIsStretch(false);
      setTutor(null);
      setTutorAttempt(1);
      setTutorExplanations([]);
      setJudge(null);
      setReply("");
      setProof([]);
      setProofIndex(0);
      setProofAnswers([]);
      setAfterScore(null);
      setUsedPresetId(preset?.id ?? null);

      if (preset) {
        setDiagnostic(cloneQuestions(preset.diagnostic));
        setStage("diagnostic");
        return;
      }

      setLoading(true);
      try {
        if (nextConfig.pyq) {
          const data = await postJSON<{ questions: Question[] }>("/api/pyq", {
            year: nextConfig.pyq.year,
            session: nextConfig.pyq.session,
            shift: nextConfig.pyq.shift,
            subject: nextConfig.pyq.subject,
          });
          setDiagnostic(data.questions);
        } else {
          const data = await postJSON<{ questions: Question[] }>(
            "/api/diagnostic",
            apiConfig(nextConfig)
          );
          setDiagnostic(data.questions);
        }
        setStage("diagnostic");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong.");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // ---- deep link from a chapter page: /?practice=1&... -----------------
  useEffect(() => {
    if (!hydrated) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("practice") !== "1") return;

    const standard = params.get("standard");
    const subject = params.get("subject");
    const chapter = params.get("chapter") ?? "";
    const lang = params.get("lang");
    const num = Number(params.get("num"));

    if (!isStandard(standard) || !isSubject(subject) || !chapter) return;

    // Clear the query so a refresh does not silently restart the loop.
    window.history.replaceState({}, "", "/");

    void start({
      standard,
      subject,
      language: isLanguage(lang) ? lang : "English",
      topic: chapter,
      chapter,
      chapterNumber: Number.isFinite(num) && num > 0 ? num : undefined,
    });
  }, [hydrated, start]);

  // ---- persist a finished result for signed-in students ----------------
  useEffect(() => {
    if (stage !== "results") return;
    if (beforeScore === null || afterScore === null) return;

    const signature = [
      config.standard,
      config.subject,
      config.chapter ?? config.topic,
      beforeScore,
      afterScore,
      diagnostic.length,
    ].join("|");

    if (savedRef.current === signature) return;
    savedRef.current = signature;

    void saveDiagnosticScore({
      standard: config.standard,
      subject: config.subject,
      language: config.language,
      chapter: config.chapter,
      topic: config.topic,
      beforeScore,
      afterScore,
      total: diagnostic.length,
    });
  }, [stage, beforeScore, afterScore, config, diagnostic.length]);

  // ---- diagnostic answers ---------------------------------------------
  const answerDiagnostic = useCallback(
    (choice: number) => {
      if (beforeScore !== null) return;
      const answers = [...diagAnswers, choice];
      setDiagAnswers(answers);

      if (answers.length >= diagnostic.length) {
        const score = diagnostic.reduce(
          (acc, q, i) => acc + (answers[i] === q.correct ? 1 : 0),
          0
        );
        const tags: string[] = [];
        diagnostic.forEach((q, i) => {
          if (answers[i] !== q.correct) {
            const tag = q.tags[String(answers[i])];
            if (tag) tags.push(tag);
          }
        });
        setBeforeScore(score);
        setWrongTags(tags);
        const picked = pickWeakest(tags, diagnostic);
        setWeakest(picked.weakest);
        setIsStretch(picked.isStretch);
      } else {
        setDiagIndex((i) => i + 1);
      }
    },
    [beforeScore, diagAnswers, diagnostic]
  );

  // ---- tutor ----------------------------------------------------------
  const startTutor = useCallback(async () => {
    setStage("tutor");
    setTutor(null);
    setError(null);
    setLoading(true);
    setJudge(null);
    setReply("");
    setTutorAttempt(1);
    setTutorExplanations([]);
    try {
      const turn = await postJSON<TutorTurn>("/api/tutor", {
        ...apiConfig(config),
        mistake: weakest,
        attempt: 1,
        previous: [],
      });
      setTutor(turn);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "The tutor could not explain this right now."
      );
    } finally {
      setLoading(false);
    }
  }, [config, weakest]);

  const submitReply = useCallback(
    async (text: string) => {
      if (!tutor) return;
      setError(null);
      setLoading(true);
      setReply(text);
      setJudge(null);
      try {
        const result = await postJSON<JudgeResult>("/api/judge", {
          checkQuestion: tutor.checkQuestion,
          correctIdea: tutor.correctIdea,
          reply: text,
          language: config.language,
        });
        setJudge(result);
      } catch (e) {
        setError(
          e instanceof Error ? e.message : "Could not check your answer."
        );
      } finally {
        setLoading(false);
      }
    },
    [tutor, config.language]
  );

  const retryExplanation = useCallback(async () => {
    if (!tutor) return;
    const attempt = Math.min(tutorAttempt + 1, 3);
    const previous = [...tutorExplanations, tutor.explanation];
    setError(null);
    setLoading(true);
    setJudge(null);
    setReply("");
    setTutor(null);
    setTutorAttempt(attempt);
    setTutorExplanations(previous);
    try {
      const turn = await postJSON<TutorTurn>("/api/tutor", {
        ...apiConfig(config),
        mistake: weakest,
        attempt,
        previous,
      });
      setTutor(turn);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Could not re-explain right now."
      );
    } finally {
      setLoading(false);
    }
  }, [tutor, tutorAttempt, tutorExplanations, config, weakest]);

  // ---- proof ----------------------------------------------------------
  const startProof = useCallback(async () => {
    setError(null);
    setStage("proof");
    setProof([]);
    setProofIndex(0);
    setProofAnswers([]);
    setAfterScore(null);

    const preset = findPresetById(usedPresetId);
    if (preset) {
      setProof(cloneQuestions(preset.proof));
      return;
    }

    setLoading(true);
    try {
      const data = await postJSON<{ questions: Question[] }>("/api/proof", {
        ...apiConfig(config),
        diagnostic: diagnostic.map((q) => ({
          question: q.question,
          explanation: q.explanation,
        })),
      });
      setProof(data.questions);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Could not build the retest right now."
      );
    } finally {
      setLoading(false);
    }
  }, [usedPresetId, config, diagnostic]);

  const answerProof = useCallback(
    (choice: number) => {
      if (afterScore !== null) return;
      const answers = [...proofAnswers, choice];
      setProofAnswers(answers);

      if (answers.length >= proof.length) {
        const score = proof.reduce(
          (acc, q, i) => acc + (answers[i] === q.correct ? 1 : 0),
          0
        );
        setAfterScore(score);
        setStage("results");
      } else {
        setProofIndex((i) => i + 1);
      }
    },
    [afterScore, proofAnswers, proof]
  );

  // ---- derived: which gaps were fixed / are still open ----------------
  const fixed: string[] = [];
  const stillWorking: string[] = [];
  diagnostic.forEach((q, i) => {
    const diagWrong = diagAnswers[i] !== q.correct;
    if (!diagWrong) return;
    const tag = q.tags[String(diagAnswers[i])] || "a misconception";
    const proofQ = proof[i];
    const proofRight = proofQ ? proofAnswers[i] === proofQ.correct : false;
    if (proofRight) fixed.push(tag);
    else stillWorking.push(tag);
  });

  const step =
    stage === "start" ? 1 : stage === "diagnostic" ? 2 : stage === "tutor" ? 3 : 4;

  const replay = useCallback(() => {
    const preset = findPresetById(usedPresetId);
    start(config, preset);
  }, [usedPresetId, config, start]);

  if (!hydrated) {
    return (
      <div className="grid min-h-dvh place-items-center text-sm text-slate-400">
        Loading…
      </div>
    );
  }

  return (
    <Shell step={step} onReset={stage !== "start" ? reset : undefined}>
      {stage === "start" && (
        <StudyHub
          defaultConfig={config}
          loading={loading}
          error={error}
          onStart={start}
        />
      )}

      {stage === "diagnostic" && (
        <DiagnosticScreen
          config={config}
          questions={diagnostic}
          index={diagIndex}
          beforeScore={beforeScore}
          weakest={weakest}
          isStretch={isStretch}
          loading={loading}
          error={error}
          onAnswer={answerDiagnostic}
          onContinue={startTutor}
          onRetry={replay}
        />
      )}

      {stage === "tutor" && (
        <TutorScreen
          config={config}
          weakest={weakest}
          isStretch={isStretch}
          tutor={tutor}
          attempt={tutorAttempt}
          judge={judge}
          loading={loading}
          error={error}
          onSubmitReply={submitReply}
          onRetryExplanation={retryExplanation}
          onContinue={startProof}
          onSkip={startProof}
          onRetryTutor={startTutor}
        />
      )}

      {stage === "proof" && (
        <ProofScreen
          config={config}
          questions={proof}
          index={proofIndex}
          loading={loading}
          error={error}
          onAnswer={answerProof}
          onRetry={startProof}
        />
      )}

      {stage === "results" && (
        <ResultsScreen
          config={config}
          beforeScore={beforeScore ?? 0}
          afterScore={afterScore ?? 0}
          total={diagnostic.length}
          fixed={fixed}
          stillWorking={stillWorking}
          diagnostic={diagnostic}
          diagAnswers={diagAnswers}
          proof={proof}
          proofAnswers={proofAnswers}
          onRestart={reset}
          onReplay={replay}
        />
      )}
    </Shell>
  );
}

function pickWeakest(
  tags: string[],
  qs: Question[]
): { weakest: string; isStretch: boolean } {
  if (tags.length === 0) {
    for (const q of [...qs].reverse()) {
      const first = Object.values(q.tags)[0];
      if (first) return { weakest: first, isStretch: true };
    }
    return {
      weakest: "applying the core idea to a new situation",
      isStretch: true,
    };
  }

  const counts = new Map<string, number>();
  for (const t of tags) counts.set(t, (counts.get(t) ?? 0) + 1);

  let best = tags[0];
  let bestCount = -1;
  for (const [t, c] of counts) {
    if (c > bestCount) {
      best = t;
      bestCount = c;
    }
  }
  return { weakest: best, isStretch: false };
}

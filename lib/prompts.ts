import type { Language, Level } from "./types";

export type PromptPair = { system: string; user: string };

export function diagnosticPrompt(args: {
  topic: string;
  level: Level;
  language: Language;
  count: number;
  exclude?: string[];
}): PromptPair {
  const { topic, level, language, count, exclude } = args;
  const excludeBlock =
    exclude && exclude.length
      ? `\nDo NOT reuse or closely paraphrase any of these already-used questions:\n${exclude
          .map((q, i) => `${i + 1}. ${q}`)
          .join("\n")}\n`
      : "";

  return {
    system:
      "You are an expert teacher and assessment designer. You write diagnostic multiple-choice questions that reveal specific misconceptions. You always reply with valid JSON only.",
    user: `Create ${count} multiple-choice questions on the topic "${topic}" for a "${level}" learner.${excludeBlock}
Requirements:
- Exactly 4 options per question, with exactly one correct answer.
- Every WRONG option must target one specific, common misconception a learner at this level actually has.
- Tag each wrong option with a short misconception label (max 6 words).
- No repeated questions; vary the numbers, contexts, and wording.
- Give a concise one-sentence explanation of the correct answer.
- Questions and options must be written in English.

Return JSON only, exactly in this shape:
{"questions":[{"id":1,"question":"...","options":["...","...","...","..."],"correct":0,"tags":{"1":"misconception label","2":"...","3":"..."},"explanation":"..."}]}

"correct" is the zero-based index (0-3) of the correct option. "tags" maps the zero-based index of each WRONG option to its misconception label. Do not tag the correct option.`,
  };
}

export function proofPrompt(args: {
  topic: string;
  level: Level;
  language: Language;
  diagnostic: { question: string; explanation: string }[];
}): PromptPair {
  const { topic, level, language, diagnostic } = args;
  const list = diagnostic
    .map(
      (d, i) =>
        `${i + 1}. Concept tested: "${d.question}" (correct idea: ${d.explanation})`
    )
    .join("\n");

  return {
    system:
      "You are an expert teacher and assessment designer. You write fair post-test multiple-choice questions that measure whether a learner truly understood a concept. You always reply with valid JSON only.",
    user: `Create exactly ${
      diagnostic.length || 5
    } NEW multiple-choice questions on the topic "${topic}" for a "${level}" learner. These are a post-test after teaching.

The learner's diagnostic questions were:
${list || "(no diagnostic provided — test the core ideas of the topic)"}

For each diagnostic question, write ONE new question that tests the SAME concept, in the SAME ORDER, but with different numbers, wording, and situations. Do not copy or closely paraphrase the diagnostic questions.

Requirements:
- Exactly 4 options per question, with exactly one correct answer.
- Every WRONG option must target one specific, common misconception a learner at this level actually has.
- Tag each wrong option with a short misconception label (max 6 words).
- Give a concise one-sentence explanation of the correct answer.
- Questions and options must be written in English.

Return JSON only, exactly in this shape:
{"questions":[{"id":1,"question":"...","options":["...","...","...","..."],"correct":0,"tags":{"1":"misconception label","2":"...","3":"..."},"explanation":"..."}]}

"correct" is the zero-based index (0-3) of the correct option. "tags" maps the zero-based index of each WRONG option to its misconception label. Do not tag the correct option.`,
  };
}

export function tutorPrompt(args: {
  topic: string;
  level: Level;
  language: Language;
  mistake: string;
  attempt: number;
  previous: string[];
}): PromptPair {
  const { topic, level, language, mistake, attempt, previous } = args;
  const prevBlock =
    previous.length > 0
      ? `\nPrevious explanations (do NOT repeat these approaches, examples, or wording):\n${previous
          .map((p, i) => `${i + 1}. ${p}`)
          .join("\n")}\n`
      : "";

  return {
    system:
      "You are a patient, encouraging tutor. You explain exactly one misconception at a time, in the learner's language, and then check understanding with one question. You always reply with valid JSON only.",
    user: `Learner profile: topic "${topic}", level "${level}", language "${language}".
Their weakest misconception: "${mistake}".
This is attempt ${attempt} of 3.${prevBlock}
1. Explain this ONE misconception in simple words with one concrete real-life example. Maximum 120 words.
2. End with ONE short check question that tests the same idea. Do NOT reveal its answer.

If this is a re-explanation, use a clearly DIFFERENT approach or example from any previous explanation.
Write the explanation and the check question in ${language}. Keep technical terms in English when there is no common translation.

Return JSON only: {"explanation":"...","checkQuestion":"...","correctIdea":"one short sentence describing the correct idea, in English"}`,
  };
}

export function judgePrompt(args: {
  checkQuestion: string;
  correctIdea: string;
  reply: string;
  language: Language;
}): PromptPair {
  const { checkQuestion, correctIdea, reply, language } = args;
  return {
    system:
      "You are a strict but fair grader. You decide whether a learner's answer shows genuine understanding rather than luck or guessing. You always reply with valid JSON only.",
    user: `Check question: ${checkQuestion}
Correct idea: ${correctIdea}
Learner's reply: ${reply}
Learner's language: ${language}

Decide whether the reply shows real understanding of the correct idea. A correct answer with a clear reason counts as understanding; a guess, a restatement of the question, or an unrelated answer does not.
Return JSON only: {"understood": true, "reason": "one short sentence in ${language}"}`,
  };
}

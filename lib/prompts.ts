import type { Language, Subject } from "./types";

export type PromptPair = { system: string; user: string };

export type QuizContext = {
  topic: string;
  /** e.g. "Class 10 (NCERT syllabus)" or "JEE Aspirant (Class 11–12 level)" */
  level: string;
  subject: Subject;
  language: Language;
  chapter?: string;
  chapterNumber?: number;
};

function contextLines(ctx: QuizContext): string {
  const lines = [`- Standard: ${ctx.level}`, `- Subject: ${ctx.subject}`];
  if (ctx.chapter) {
    lines.push(
      `- NCERT chapter: ${ctx.chapter}${
        ctx.chapterNumber ? ` (Chapter ${ctx.chapterNumber})` : ""
      }`
    );
  }
  lines.push(`- Topic: ${ctx.topic}`);
  return lines.join("\n");
}

const QUESTION_SCHEMA = `{"questions":[{"id":1,"question":"...","options":["...","...","...","..."],"correct":0,"tags":{"1":"misconception label","2":"...","3":"..."},"explanation":"one-sentence explanation"}]}`;

const QUESTION_RULES = `Requirements:
- Exactly 4 options per question, with exactly one correct answer.
- Every WRONG option must target one specific, common misconception a learner at this level actually has.
- Tag each wrong option with a short misconception label (max 6 words).
- No repeated questions; vary numbers, contexts, and wording.
- Vary where the correct answer appears (A, B, C, D) — do not always put it first.
- Questions and options must be written in English.`;

export function diagnosticPrompt(args: QuizContext & {
  count: number;
  exclude?: string[];
}): PromptPair {
  const { count, exclude } = args;
  const excludeBlock =
    exclude && exclude.length
      ? `\nDo NOT reuse or closely paraphrase any of these already-used questions:\n${exclude
          .map((q, i) => `${i + 1}. ${q}`)
          .join("\n")}\n`
      : "";

  return {
    system:
      "You are an expert Indian curriculum teacher and assessment designer. You write diagnostic multiple-choice questions that reveal specific misconceptions. You always reply with valid JSON only.",
    user: `Create ${count} multiple-choice questions for this learner:
${contextLines(args)}${excludeBlock}
${QUESTION_RULES}
- Follow the NCERT scope for this standard and subject. Stay within the chapter when one is named.
- Give a concise one-sentence explanation of the correct answer.

Return JSON only, exactly in this shape:
${QUESTION_SCHEMA}

"correct" is the zero-based index (0-3) of the correct option. "tags" maps the zero-based index of each WRONG option to its misconception label. Do not tag the correct option.`,
  };
}

export function proofPrompt(args: QuizContext & {
  diagnostic: { question: string; explanation: string }[];
  pyq?: boolean;
}): PromptPair {
  const { diagnostic, pyq } = args;
  const list = diagnostic
    .map(
      (d, i) =>
        `${i + 1}. Concept tested: "${d.question}" (correct idea: ${d.explanation})`
    )
    .join("\n");

  return {
    system:
      "You are an expert Indian curriculum teacher and assessment designer. You write fair post-test multiple-choice questions that measure whether a learner truly understood a concept. You always reply with valid JSON only.",
    user: `Create exactly ${
      diagnostic.length || 5
    } NEW multiple-choice questions for this learner. These are a post-test after teaching.

${contextLines(args)}

The learner's diagnostic questions were:
${list || "(no diagnostic provided — test the core ideas of the topic)"}

For each diagnostic question, write ONE new question that tests the SAME concept, in the SAME ORDER, but with different numbers, wording, and situations. Do not copy or closely paraphrase the diagnostic questions.

${QUESTION_RULES}
- Match the original difficulty.${
      pyq
        ? "\n- Keep the JEE Main style: single correct option, exam-style numerical or conceptual questions, Class 11–12 scope.\n- Include a concise step-by-step \"solution\" (3 to 5 short steps) for every question."
        : ""
    }
- Give a concise one-sentence explanation of the correct answer.

Return JSON only, exactly in this shape:
${
      pyq
        ? `{"questions":[{"id":1,"question":"...","options":["...","...","...","..."],"correct":0,"tags":{"1":"misconception label","2":"...","3":"..."},"explanation":"one-sentence explanation","solution":"Step 1: ...\\nStep 2: ..."}]}`
        : QUESTION_SCHEMA
    }

"correct" is the zero-based index (0-3) of the correct option. "tags" maps the zero-based index of each WRONG option to its misconception label. Do not tag the correct option.`,
  };
}

export function tutorPrompt(args: QuizContext & {
  mistake: string;
  attempt: number;
  previous: string[];
}): PromptPair {
  const { mistake, attempt, previous } = args;
  const prevBlock =
    previous.length > 0
      ? `\nPrevious explanations (do NOT repeat these approaches, examples, or wording):\n${previous
          .map((p, i) => `${i + 1}. ${p}`)
          .join("\n")}\n`
      : "";

  return {
    system:
      "You are a patient, encouraging tutor for Indian school and JEE students. You explain exactly one misconception at a time, in the learner's language, and then check understanding with one question. You always reply with valid JSON only.",
    user: `Learner profile:
${contextLines(args)}
Their weakest misconception: "${mistake}".
This is attempt ${attempt} of 3.${prevBlock}
1. Explain this ONE misconception in simple words with one concrete real-life or exam-style example. Maximum 120 words.
2. End with ONE short check question that tests the same idea. Do NOT reveal its answer.

If this is a re-explanation, use a clearly DIFFERENT approach or example from any previous explanation.
Write the explanation and the check question in ${args.language}. Keep technical terms and symbols in English when there is no common translation.

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

// ---------------------------------------------------------------------------
// NCERT chapter browser
// ---------------------------------------------------------------------------

export function chaptersPrompt(args: {
  standard: string;
  subject: Subject;
}): PromptPair {
  return {
    system:
      "You are an expert on the Indian NCERT curriculum. You know the latest rationalised NCERT syllabus and the exact official chapter titles. You always reply with valid JSON only.",
    user: `List the official NCERT chapters for ${args.standard} ${args.subject}, using the latest rationalised syllabus (2023 onwards).
- Use the exact chapter titles as printed in the NCERT textbook.
- Number them from 1 in textbook order.
- Only include chapters that are part of the current syllabus.
- 8 to 18 chapters.

Return JSON only, exactly in this shape:
{"chapters":[{"number":1,"title":"Chapter title"},{"number":2,"title":"Chapter title"}]}`,
  };
}

export function notesPrompt(args: {
  standard: string;
  subject: Subject;
  chapter: string;
  chapterNumber?: number;
}): PromptPair {
  return {
    system:
      "You are an expert Indian curriculum teacher writing a reliable NCERT textbook summary. You always reply with valid JSON only.",
    user: `Write a textbook-style summary of this NCERT chapter:
- Standard: ${args.standard}
- Subject: ${args.subject}
- Chapter: ${args.chapter}${
      args.chapterNumber ? ` (Chapter ${args.chapterNumber})` : ""
    }

Requirements:
- 4 to 7 sections that follow the textbook's flow. Each heading is short; each body is 2 to 4 clear sentences.
- 4 to 8 key definitions. The term is short and the meaning is one sentence.
- 0 to 8 important formulas or key facts, written as plain strings (use readable notation such as "V = IR").
- Everything in English. Be accurate and exam-relevant; no invented facts.

Return JSON only, exactly in this shape:
{"sections":[{"heading":"...","body":"..."}],"definitions":[{"term":"...","meaning":"..."}],"formulas":["..."]}`,
  };
}

export function revisionPrompt(args: {
  standard: string;
  subject: Subject;
  chapter: string;
  chapterNumber?: number;
  language: Language;
}): PromptPair {
  const { language } = args;
  return {
    system:
      "You are an expert Indian curriculum teacher writing concise, exam-ready revision notes. You always reply with valid JSON only.",
    user: `Write revision notes for this NCERT chapter:
- Standard: ${args.standard}
- Subject: ${args.subject}
- Chapter: ${args.chapter}${
      args.chapterNumber ? ` (Chapter ${args.chapterNumber})` : ""
    }

Requirements:
- 8 to 12 concise revision bullets that a student can revise the night before an exam. Include key terms, causes, steps, and common exam points.
- 2 solved examples: one straightforward and one exam-style, each with a short step-by-step solution.
- Write ALL notes, examples and solutions in ${language}. Keep technical terms and formulas in English where that is how students learn them.
- Be accurate and specific to this chapter; no generic filler.

Return JSON only, exactly in this shape:
{"notes":["...","..."],"examples":[{"problem":"...","solution":"..."}]}`,
  };
}

// ---------------------------------------------------------------------------
// JEE PYQ hub
// ---------------------------------------------------------------------------

export function pyqPrompt(args: {
  year: number;
  session: string;
  shift: number;
  subject: Subject;
}): PromptPair {
  const { year, session, shift, subject } = args;
  return {
    system:
      "You are an expert JEE Main paper setter. You write exam-realistic single-correct questions with rigorous step-by-step solutions. You always reply with valid JSON only.",
    user: `Create 5 JEE Main style questions for ${subject}, modelled on JEE Main ${year} Session ${session} Shift ${shift}.

Requirements:
- Class 11–12 JEE Main scope, single correct option out of 4.
- Mix numerical and conceptual questions. Use realistic JEE wording, units and data.
- Cover 5 different concepts from the ${subject} syllabus; do not repeat a concept.
- Vary where the correct answer appears (A, B, C, D) — do not always put it first.
- Every WRONG option must target a specific common error.
- "explanation": one sentence stating the correct idea.
- "solution": a genuine step-by-step worked solution (3 to 6 short steps, with the formula used and the final answer). Use \\n between steps.
- All text in English.

Return JSON only, exactly in this shape:
{"questions":[{"id":1,"question":"...","options":["...","...","...","..."],"correct":0,"tags":{"1":"common error","2":"common error","3":"common error"},"explanation":"...","solution":"Step 1: ...\\nStep 2: ..."}]}

"correct" is the zero-based index (0-3) of the correct option. Do not tag the correct option.`,
  };
}

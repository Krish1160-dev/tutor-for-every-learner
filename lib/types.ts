export type Standard =
  | "Class 6"
  | "Class 7"
  | "Class 8"
  | "Class 9"
  | "Class 10"
  | "Class 11"
  | "Class 12"
  | "JEE Aspirant";

export type Subject =
  | "Science"
  | "Physics"
  | "Chemistry"
  | "Maths"
  | "Biology"
  | "Social Science"
  | "English";

export type Language = "English" | "Hindi" | "Tamil" | "Telugu";

export type Question = {
  id: number;
  question: string;
  options: string[];
  /** zero-based index of the correct option */
  correct: number;
  /** maps the zero-based index of a WRONG option -> misconception label */
  tags: Record<string, string>;
  explanation: string;
  /** optional step-by-step worked solution (used for PYQ sets) */
  solution?: string;
};

export type TutorTurn = {
  explanation: string;
  checkQuestion: string;
  correctIdea: string;
};

export type JudgeResult = {
  understood: boolean;
  reason: string;
};

export type Chapter = {
  number: number;
  title: string;
};

export type ChapterSummary = {
  sections: { heading: string; body: string }[];
  definitions: { term: string; meaning: string }[];
  formulas: string[];
};

export type ChapterRevision = {
  notes: string[];
  examples: { problem: string; solution: string }[];
};

export type NotesResponse = {
  summary: ChapterSummary | null;
  revision: ChapterRevision | null;
  errors?: string[];
};

// ---------------------------------------------------------------------------
// Full-page chapter reader
// ---------------------------------------------------------------------------

export type SolvedExample = {
  problem: string;
  steps: string[];
  answer: string;
};

/** Board-exam-oriented notes shown on the chapter page. */
export type ExamNotes = {
  coreConcepts: { term: string; definition: string }[];
  mechanisms: { heading: string; explanation: string }[];
  boardPoints: string[];
  commonMistakes: { mistake: string; fix: string }[];
  examples: SolvedExample[];
};

export type FormulaKind = "formula" | "law" | "reaction" | "constant";

export type FormulaCard = {
  name: string;
  kind: FormulaKind;
  /** KaTeX source, without $ delimiters. Preferred when present. */
  latex?: string;
  /** Plain-text fallback, used for word equations or reactions. */
  expression?: string;
  symbols: { symbol: string; meaning: string; unit: string }[];
  whenToUse: string;
  quickExample: SolvedExample;
};

export type FormulaSheet = {
  cards: FormulaCard[];
};

/** Structured answer returned by the camera doubt solver. */
export type DoubtSolution = {
  given: string;
  concept: string;
  steps: string[];
  finalAnswer: string;
};

export type ChapterRef = {
  standard: Standard;
  subject: Subject;
  chapter: string;
  chapterNumber?: number;
  language: Language;
};

export type PyqSelection = {
  year: number;
  session: string;
  shift: number;
  subject: Subject;
};

export type PyqPaper = PyqSelection & {
  id: string;
  questionCount: number;
};

/** Everything the diagnostic → tutor → proof loop needs to know. */
export type StudyConfig = {
  standard: Standard;
  subject: Subject;
  language: Language;
  /** free-form topic, chapter title, or PYQ paper label */
  topic: string;
  chapter?: string;
  chapterNumber?: number;
  pyq?: PyqSelection;
};

/** Bundled quick-demo presets (hand-verified question banks). */
export type Preset = {
  id: string;
  emoji: string;
  title: string;
  blurb: string;
  config: StudyConfig;
  diagnostic: Question[];
  proof: Question[];
};

export const STANDARDS: Standard[] = [
  "Class 6",
  "Class 7",
  "Class 8",
  "Class 9",
  "Class 10",
  "Class 11",
  "Class 12",
  "JEE Aspirant",
];

export const LANGUAGES: Language[] = ["English", "Hindi", "Tamil", "Telugu"];

export const JEE_SUBJECTS: Subject[] = ["Physics", "Chemistry", "Maths"];

export const SUBJECTS_BY_STANDARD: Record<Standard, Subject[]> = {
  "Class 6": ["Science", "Maths", "Social Science", "English"],
  "Class 7": ["Science", "Maths", "Social Science", "English"],
  "Class 8": ["Science", "Maths", "Social Science", "English"],
  "Class 9": ["Science", "Maths", "Social Science", "English"],
  "Class 10": ["Science", "Maths", "Social Science", "English"],
  "Class 11": ["Physics", "Chemistry", "Maths", "Biology", "English"],
  "Class 12": ["Physics", "Chemistry", "Maths", "Biology", "English"],
  "JEE Aspirant": JEE_SUBJECTS,
};

export function subjectsFor(standard: Standard): Subject[] {
  return SUBJECTS_BY_STANDARD[standard] ?? ["Science"];
}

export function defaultSubjectFor(standard: Standard): Subject {
  return subjectsFor(standard)[0];
}

export function isJee(standard: Standard): boolean {
  return standard === "JEE Aspirant";
}

/** Human-readable level used in AI prompts. */
export function levelForStandard(standard: Standard): string {
  return isJee(standard)
    ? "JEE Aspirant (Class 11–12 level, JEE Main pattern)"
    : `${standard} (NCERT syllabus)`;
}

export function isStandard(value: unknown): value is Standard {
  return (
    typeof value === "string" && (STANDARDS as string[]).includes(value)
  );
}

export function isLanguage(value: unknown): value is Language {
  return (
    typeof value === "string" && (LANGUAGES as string[]).includes(value)
  );
}

const SUBJECT_NAMES: Subject[] = [
  "Science",
  "Physics",
  "Chemistry",
  "Maths",
  "Biology",
  "Social Science",
  "English",
];

export function isSubject(value: unknown): value is Subject {
  return (
    typeof value === "string" && (SUBJECT_NAMES as string[]).includes(value)
  );
}

export function configTitle(c: StudyConfig): string {
  if (c.pyq) {
    return `${c.pyq.subject} · JEE Main ${c.pyq.year} ${c.pyq.session} Shift ${c.pyq.shift}`;
  }
  return c.chapter || c.topic || "Your topic";
}

export function configSubtitle(c: StudyConfig): string {
  if (c.pyq) return `PYQ set · ${c.language}`;
  if (c.chapter) {
    const num =
      typeof c.chapterNumber === "number"
        ? ` · Ch ${String(c.chapterNumber).padStart(2, "0")}`
        : "";
    return `${c.standard} · ${c.subject}${num} · ${c.language}`;
  }
  return `${c.standard} · ${c.subject} · ${c.language}`;
}

/** Config sent to the AI routes (level is derived, never stored twice). */
export function apiConfig(c: StudyConfig) {
  return {
    standard: c.standard,
    subject: c.subject,
    language: c.language,
    topic: c.topic,
    chapter: c.chapter,
    chapterNumber: c.chapterNumber,
    level: levelForStandard(c.standard),
    pyq: Boolean(c.pyq),
  };
}

export function normalizeConfig(raw: unknown): StudyConfig {
  const fallback: StudyConfig = {
    standard: "Class 10",
    subject: "Science",
    language: "English",
    topic: "",
  };
  if (!raw || typeof raw !== "object") return fallback;
  const o = raw as Record<string, unknown>;

  const standard = isStandard(o.standard)
    ? o.standard
    : isStandard(o.level)
    ? (o.level as Standard)
    : fallback.standard;

  const subjects = subjectsFor(standard);
  let subject = isSubject(o.subject) ? o.subject : fallback.subject;
  if (!subjects.includes(subject)) subject = subjects[0];

  const language = isLanguage(o.language) ? o.language : fallback.language;
  const topic = typeof o.topic === "string" ? o.topic : "";

  const pyq =
    o.pyq && typeof o.pyq === "object"
      ? (o.pyq as PyqSelection)
      : undefined;

  return {
    standard,
    subject,
    language,
    topic,
    chapter: typeof o.chapter === "string" ? o.chapter : undefined,
    chapterNumber:
      typeof o.chapterNumber === "number" ? o.chapterNumber : undefined,
    pyq,
  };
}

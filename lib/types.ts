export type Level = "Grade 5" | "High School" | "Competitive";
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

export type TutorConfig = {
  topic: string;
  level: Level;
  language: Language;
};

export type Preset = {
  id: string;
  emoji: string;
  title: string;
  blurb: string;
  topic: string;
  level: Level;
  language: Language;
  diagnostic: Question[];
  proof: Question[];
};

export const LEVELS: Level[] = ["Grade 5", "High School", "Competitive"];
export const LANGUAGES: Language[] = ["English", "Hindi", "Tamil", "Telugu"];

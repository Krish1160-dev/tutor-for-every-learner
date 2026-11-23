import type { PyqPaper, Subject } from "./types";

export const PYQ_YEARS = [2026, 2025, 2024, 2023, 2022] as const;
export const PYQ_SESSIONS = ["Jan", "Apr"] as const;
export const PYQ_SHIFTS = [1, 2] as const;
export const PYQ_SUBJECTS: Subject[] = ["Physics", "Chemistry", "Maths"];

function buildPapers(): PyqPaper[] {
  const papers: PyqPaper[] = [];
  for (const year of PYQ_YEARS) {
    for (const session of PYQ_SESSIONS) {
      for (const shift of PYQ_SHIFTS) {
        for (const subject of PYQ_SUBJECTS) {
          papers.push({
            id: `${year}-${session}-${shift}-${subject}`.toLowerCase(),
            year,
            session,
            shift,
            subject,
            questionCount: 5,
          });
        }
      }
    }
  }
  return papers;
}

export const PYQ_PAPERS: PyqPaper[] = buildPapers();

export const PYQ_STATS = {
  years: PYQ_YEARS.length,
  papers: PYQ_PAPERS.length,
  questions: PYQ_PAPERS.reduce((sum, p) => sum + p.questionCount, 0),
};

export function papersFor(subject: Subject, year: number | "All"): PyqPaper[] {
  return PYQ_PAPERS.filter(
    (p) => p.subject === subject && (year === "All" || p.year === year)
  );
}

export function paperLabel(p: PyqPaper): string {
  return `JEE Main ${p.year} · Session ${p.session} · Shift ${p.shift}`;
}

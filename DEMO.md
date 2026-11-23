# 🎬 Demo & Submission Kit

## The 3-minute demo

One job: show a learner **failing → being taught → succeeding**, then show the breadth (NCERT + JEE).

| Time | Beat | What to do / say |
| --- | --- | --- |
| 0:00–0:15 | **Hook** | "Most students never get a personal tutor. We built one that finds your exact gap, teaches it in your language, and proves you improved." |
| 0:15–0:35 | **Breadth** | On the start screen, point at the class selector (Class 6–12 + JEE) and the NCERT chapter list. "Every NCERT chapter, plus five years of JEE Main." |
| 0:35–0:50 | **Study material** | Open **Class 10 → Science → Electricity**. Show the **Book Summary** tab (definitions + formulas) and switch to **Revision Notes** — flip the language to **Telugu** to prove multilingual notes. |
| 0:50–1:20 | **Diagnostic** | Tap **Practice & diagnose this chapter**. Answer the 5 questions, deliberately getting 2–3 wrong. Point at **Before score** and **Your exact gap**. |
| 1:20–1:55 | **Teaching** | Let the tutor explain. Miss the check question **once** so judges see the **different explanation**, then answer correctly. |
| 1:55–2:30 | **Proof** | Run the 5 new questions. Show **Before → After**, the **gaps fixed**, and open the review to show explanations. |
| 2:30–3:00 | **JEE + close** | Back to start → **JEE** → **Physics** → **2025 · Session Apr · Shift 1** → Start. Show a real-style PYQ and its **step-by-step solution** in the review. Close: "Not streaks or badges. Proof that someone learned." |

**Honesty rule:** only show scores you actually got. Never fake or pre-fill results. One honest improvement beats an impossible 5/5. JEE questions are **exam-style**, not verbatim past papers — say so if asked.

## Fast fallback demo (30 seconds)

If the venue network dies, use the **instant demo** buttons. They run from bundled, hand-verified question banks with **zero** AI calls:

1. **Fractions & Decimals** — Class 6 Maths, English
2. **Photosynthesis** — Class 10 Science, Telugu
3. **Kinematics** — JEE Physics, English

Scores, misconception detection, proof and results all work offline; only the tutor explanation needs the network.

## Pre-demo checklist (1 hour before)

- [ ] Live link opens on **phone** and **laptop**.
- [ ] One NCERT chapter run tested end-to-end (notes + diagnostic + proof).
- [ ] One JEE PYQ run tested (solutions visible).
- [ ] Backup video recorded and saved on phone **and** laptop.
- [ ] Every bundled preset question verified (they're hand-checked).
- [ ] Phone charged; mobile hotspot ready.
- [ ] Script practised out loud 3 times.
- [ ] `GEMINI_API_KEY` and `GROQ_API_KEY` set in Vercel.

## Risk → quick fix

| Risk | Fix |
| --- | --- |
| Gemini rate limit | Groq fallback fires automatically. Notes generation is sequential with a 429-aware retry. |
| Groq free-tier token limit | Cached after the first load. Use a seeded chapter (Class 10 Science/Maths, Class 9 Science/Maths, Class 12 Physics, Class 6 Maths, Class 11 Physics) for an instant chapter list. |
| Both AI providers fail | Presets still run the whole assessment loop from bundled question banks. |
| Venue internet down | Phone hotspot. If that fails, play the backup video. |
| AI writes a bad question | Structure is validated, options are shuffled, and generation retries once. |
| Telugu/Hindi sounds unnatural | Keep technical terms in English; have a native speaker sanity-check one explanation. |
| Tempted to add features | No new features after Day 5. Bugs only. |

## Submission text (draft)

**Problem.** Most learners have no personal tutor. They get videos and worksheets that keep them busy but never show whether they actually understood. When they're stuck, nobody pinpoints *why*.

**Solution.** *A Tutor for Every Learner* is an AI study hub for **Class 6–12 NCERT and JEE Main**, in English, Hindi, Tamil or Telugu. Students pick their class and subject, browse a searchable NCERT chapter list with textbook summaries and exam-ready revision notes, and launch a diagnostic for any chapter. JEE aspirants get a PYQ hub across five years of sessions and shifts. Every run follows the same loop: a diagnostic finds the exact misconception, the tutor explains it in the learner's language and adapts if they don't get it, then a retest on **new** questions proves whether they improved.

**How it proves learning.** The Before score comes from the diagnostic. The After score comes from **different questions on the same concepts**. A higher score can't come from memorising the first set. We show the gaps fixed and the ones still open — honest data, no streaks or badges. Correct options are shuffled so position never gives the answer away.

**How it was built.** Next.js + React + TypeScript + Tailwind; Google Gemini 2.5 Flash for generation, tutoring and free-text grading; Groq as an automatic fallback; deployed on Vercel with server-side keys. NCERT chapter seeds keep the common paths instant; AI-generated content is cached in the browser. Built with AI assistance for the C3 hackathon.

**What's next.** More exam boards and state syllabi, a teacher dashboard with class-level gap maps, spaced review of fixed vs still-open misconceptions, and offline packs for low-connectivity classrooms.

## Likely judge questions

**"How do you prove learning?"**
> The learner takes a diagnostic, gets taught, then takes a retest with different questions on the same concepts. The score change is the proof.

**"Is this just ChatGPT with a textbook?"**
> ChatGPT won't tell you *which specific misconception* you have, adapt across attempts, and then measure you on new questions. The code owns the assessment loop — scoring, tags, option shuffling, before/after proof — and the AI handles language.

**"Are these real PYQs?"**
> They are exam-style questions modelled on the JEE Main pattern with full step-by-step solutions. We label them honestly as practice, not verbatim past papers.

**"What if the AI is wrong?"**
> Demo presets use hand-verified banks. For AI content we validate every question's structure and retry; the tutor's check question is graded against an explicit correct idea. Chapter lists for the most-used classes are seeded from the official NCERT syllabus.

**"Does it scale / cost money?"**
> No login, no database, no per-user storage. Presets and chapter seeds are static; generated content is cached in the browser. Gemini's free tier plus Groq fallback keeps it near zero cost for a classroom pilot.

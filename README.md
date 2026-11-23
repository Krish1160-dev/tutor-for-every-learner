# 🎓 A Tutor for Every Learner

> **Find your exact gap. Learn it. Prove it.**

An AI tutor for **Class 6–12 NCERT and JEE Main** that finds a learner's specific misconception, teaches it, and **proves improvement** with a before-and-after score.

Built for the **C3 hackathon** — problem statement: *"A tutor for every learner."*

---

## The problem

Most learners never get a personal tutor. They get worksheets, videos, and streaks — activities that keep them busy but never prove they understood anything. When they get stuck, nobody pinpoints *why*.

## What it does

### Study hub (Class 6–12 NCERT)

- **Class selector** — Class 6, 7, 8, 9, 10, 11, 12 and **JEE Aspirant**.
- **Subject selector** that follows the class (Science, Maths, Social Science, English; Physics, Chemistry, Maths, Biology for 11–12).
- **Searchable chapter list** with collapsible cards. Each chapter has three tabs:
  1. **NCERT Book Summary** — textbook-style sections, key definitions and formulas.
  2. **Revision Notes** — exam-ready bullets and solved examples in English, Hindi, Tamil or Telugu.
  3. **Practice & Diagnose** — launches the 5-question diagnostic → tutor → proof loop for that exact chapter.
- Chapter lists are seeded for the most-used combinations and generated + cached for everything else.

### JEE Main PYQ hub

- Summary stats, three subject cards (Physics · Chemistry · Maths) and year pills (All · 2026 · 2025 · 2024 · 2023 · 2022).
- Paper cards for every session and shift. **Start** launches 5 exam-style questions into the same diagnostic → tutor → proof loop.
- Every question includes a **step-by-step solution** in the results review.
- Honest labelling: these are **exam-style questions modelled on the JEE Main pattern**, not verbatim past papers.

### The learning loop (unchanged)

| Step | What happens |
| --- | --- |
| **1. Start** | Pick a class/subject/chapter, a JEE paper, any topic, or one of three instant presets. |
| **2. Diagnostic** | Five multiple-choice questions. Every wrong option is tagged with a specific **misconception**. The score becomes the learner's **Before** score. |
| **3. Tutor** | The app finds the learner's **weakest misconception** and explains it in their language. It asks a check question, judges the free-text reply, and re-explains the same idea a different way up to 3 times. |
| **4. Proof** | Five **new** questions on the same concepts. The screen shows **Before vs After**, the gaps fixed, and the ones still open — plus a full question review with solutions. |

## Why this proves learning

The retest uses **different questions on the same concepts**. A higher score cannot come from memorising the diagnostic — it comes from understanding. Correct options are shuffled server-side so answer position carries no signal. No streaks. No badges. No leaderboards. Just honest before-and-after data.

## Features

- 📚 **Class 6–12 NCERT** chapter browser with summaries, notes and chapter-level diagnostics.
- 🎯 **JEE Main PYQ hub** across 5 years, 2 sessions and 2 shifts.
- 🌍 **Any topic** — free-form learning stays available for everything else.
- 🗣️ **Multilingual** — explanations, feedback and revision notes in English, Hindi, Tamil or Telugu.
- 🧠 **Misconception-level feedback** — not just "3 wrong", but *which* wrong idea.
- 🔁 **Adaptive tutoring** — a different explanation, not a repeated one.
- 🛡️ **Graceful AI fallback** — Gemini first, Groq automatically as backup, friendly retry if both fail.
- ⚡ **3 instant demo presets** — Fractions, Photosynthesis, Kinematics — backed by bundled, hand-verified question banks so a live demo never depends on a fresh AI call.
- 📱 **Mobile-first** — large touch targets, readable type, works on any phone.
- 💾 **No login, no database** — generated content and progress are cached in `localStorage`.

## Tech stack

- **Next.js 15** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS** for the design system
- **Google Gemini 2.5 Flash** for generation, tutoring and grading
- **Groq** (`openai/gpt-oss-120b`) as an automatic fallback
- **Vercel** for hosting

API keys live **server-side** in Next.js route handlers — never in the browser.

## Architecture

```
Browser (React)
  │
  ├── /api/chapters     ─┐
  ├── /api/notes        │
  ├── /api/pyq          ├──►  Gemini 2.5 Flash  ──►  (fallback) Groq
  ├── /api/diagnostic   │
  ├── /api/proof        │
  ├── /api/tutor        │
  └── /api/judge      ──┘
        │
        └── keys read from server env (GEMINI_API_KEY, GROQ_API_KEY)
```

**Division of labour:** the code owns everything that must be reliable — scoring, misconception tags, option shuffling, before/after proof, chapter seeds. The AI handles language-heavy work — chapter lists, notes, questions and explanations — with strict JSON validation and a retry.

## Getting started

```bash
# 1. Install dependencies
npm install

# 2. Add your keys
cp .env.local.example .env.local
# then edit .env.local and paste your GEMINI_API_KEY
# (optional but recommended) add GROQ_API_KEY for the backup

# 3. Run
npm run dev
```

Open <http://localhost:3000>.

Get a free Gemini key at <https://aistudio.google.com/apikey>.
Get a free Groq key at <https://console.groq.com/keys>.

> **Free-tier note:** Groq's free tier limits tokens per minute. Notes generation is sequential with a 429-aware retry, and generated content is cached in the browser. Add a Gemini key for the smoothest experience.

## Deploy to Vercel

1. Push this repo to GitHub.
2. Import it at <https://vercel.com/new>.
3. Add `GEMINI_API_KEY` (and optionally `GROQ_API_KEY`) under **Settings → Environment Variables**.
4. Deploy. Vercel gives you a public link that works on phones.

## Project structure

```
app/
  page.tsx                 # state machine for the 4 learning screens
  layout.tsx
  globals.css
  api/
    chapters/route.ts      # NCERT chapter list (seed or AI)
    notes/route.ts         # book summary + revision notes (partial retry)
    pyq/route.ts           # JEE Main style questions with solutions
    diagnostic/route.ts    # 5 diagnostic MCQs
    proof/route.ts         # 5 new post-test MCQs
    tutor/route.ts         # explanation + check question
    judge/route.ts         # grade a free-text reply
    health/route.ts        # key presence check
components/
  Shell.tsx                # layout + progress
  StudyHub.tsx             # class/subject/language + mode selector
  ChapterBrowser.tsx       # searchable NCERT chapter list
  ChapterCard.tsx          # summary / notes / practice tabs
  PyqHub.tsx               # JEE PYQ dashboard
  DiagnosticScreen.tsx
  TutorScreen.tsx
  ProofScreen.tsx
  ResultsScreen.tsx        # before/after + solutions review
  ui.tsx
lib/
  types.ts
  presets.ts               # 3 bundled, hand-verified question banks
  ncert.ts                 # hand-checked chapter seeds
  pyq.ts                   # paper/session/shift metadata
  prompts.ts               # AI prompt templates
  gemini.ts                # Gemini + Groq client with rate-limit retry
  validate.ts              # strict JSON validation + option shuffling
  cache.ts                 # localStorage cache with TTL
  context.ts               # request validation
  client.ts                # fetch helper
```

## Roadmap

- More exam boards and state syllabi
- Teacher dashboard with class-level gap maps
- Spaced review of fixed vs still-open misconceptions
- Offline preset packs for low-connectivity classrooms

---

Built with AI for the **C3 hackathon**. No streaks, no badges — just proof that someone learned.

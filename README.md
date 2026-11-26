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
- **Searchable chapter list.** Every chapter opens a **dedicated full-page reader** at `/chapter/[standard]/[subject]/[chapter]` with three tabs:
  1. **Exam Notes** — NCERT definitions in exam-ready wording, key mechanisms explained simply, high-yield board points, common mark-losing mistakes, and 2–3 solved NCERT-style examples.
  2. **Formula Sheet** — every examinable relation in that chapter as a card: the formula typeset in KaTeX, what each symbol means with SI units, when to use it, and one quick solved application. Theory chapters get laws, rules and reaction templates instead.
  3. **Practice & Diagnose** — launches the 5-question diagnostic → tutor → proof loop for that exact chapter.
- Chapter lists are seeded for the most-used combinations and generated + cached for everything else.

### Camera doubt solver

- A floating **📷 Ask a doubt** button on every page opens the camera (`accept="image/*" capture="environment"`) or an upload.
- The photo goes to a server route that reads the question with **Gemini Vision**, re-checks its own arithmetic and algebra, and answers in the student's language.
- Every answer is structured: **1. Given data → 2. Concept / formula used → 3. Step-by-step solution → 4. Final answer**, with a fixed disclaimer underneath: *"AI can make mistakes. Please verify critical steps with your NCERT textbook or teacher."*
- Signed-in students get their doubts saved privately (Row Level Security).

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

- 📚 **Class 6–12 NCERT** chapter browser that opens a full-page reader with exam notes and a KaTeX formula sheet.
- 📷 **Camera doubt solver** — photograph any question, get a verified four-part solution.
- 🎯 **JEE Main PYQ hub** across 5 years, 2 sessions and 2 shifts.
- 🌍 **Any topic** — free-form learning stays available for everything else.
- 🗣️ **Multilingual** — explanations, feedback, notes and formulas in English, Hindi, Tamil or Telugu.
- 🧠 **Misconception-level feedback** — not just "3 wrong", but *which* wrong idea.
- 🔁 **Adaptive tutoring** — a different explanation, not a repeated one.
- 🛡️ **Graceful AI fallback** — Gemini first, Groq automatically as backup, friendly retry if both fail.
- ⚡ **3 instant demo presets** — Fractions, Photosynthesis, Kinematics — backed by bundled, hand-verified question banks so a live demo never depends on a fresh AI call.
- 📱 **Mobile-first** — large touch targets, readable type, works on any phone.
- 🔐 **Optional accounts** — Google or email sign-in saves diagnostic scores and camera doubts; the app works fully signed out.
- 🗄️ **Shared chapter cache** — each chapter's notes and formula sheet are generated once, then served to every student instantly.

## Tech stack

- **Next.js 15** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS** for the design system, **KaTeX** for formulas
- **Google Gemini 3.1 Flash-Lite** for generation, tutoring, grading and **vision** (thinking disabled for latency)
- **Groq** (`openai/gpt-oss-120b`) as an automatic text fallback
- **Supabase** (`@supabase/ssr`) for optional auth, saved scores and the shared chapter cache
- **Vercel** for hosting

API keys live **server-side** in Next.js route handlers — never in the browser. The Supabase anon key is public by design; Row Level Security does the access control.

## Architecture

```
Browser (React)
  │
  ├── /chapter/[standard]/[subject]/[chapter]     full-page reader (3 tabs)
  ├── /api/chapters     ─┐
  ├── /api/notes         │
  ├── /api/pyq           │
  ├── /api/diagnostic    ├──►  Gemini 2.5 Flash  ──►  (fallback) Groq
  ├── /api/proof         │
  ├── /api/tutor         │
  ├── /api/judge         │
  ├── /api/chapter-notes │
  ├── /api/chapter-formulas
  └── /api/doubt       ──┘      Gemini 3.1 Flash-Lite Vision (image + note)
        │
        ├── keys read from server env
        └── chapter_cache (Supabase) — read first, write once per chapter
```

**Division of labour:** the code owns everything that must be reliable — scoring, misconception tags, option shuffling, before/after proof, chapter seeds. The AI handles language-heavy work — chapter lists, notes, questions and explanations — with strict JSON validation and a retry.

## Getting started

```bash
# 1. Install dependencies
npm install

# 2. Add your keys
cp .env.example .env.local
# then edit .env.local (see the key list below)

# 3. Run
npm run dev
```

Open <http://localhost:3000>.

### Required `.env.local` keys

| Key | Required | What it powers |
| --- | --- | --- |
| `GEMINI_API_KEY` | **yes** | All AI generation **and the camera doubt solver (vision)**. Free key: <https://aistudio.google.com/apikey> |
| `GROQ_API_KEY` | recommended | Text fallback when Gemini is rate-limited. Free key: <https://console.groq.com/keys> |
| `GROQ_MODEL` | optional | Defaults to `openai/gpt-oss-120b`. |
| `NEXT_PUBLIC_SUPABASE_URL` | optional | Auth + shared chapter cache. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | optional | Public client key, protected by RLS. |
| `SUPABASE_SERVICE_ROLE_KEY` | optional | Server-only writes to `chapter_cache`. **Never** prefix with `NEXT_PUBLIC_`. |

Everything except `GEMINI_API_KEY` is optional: with no Supabase keys the app runs fully signed out, caching only in the browser.

### Supabase setup (5 minutes)

1. Create a project at <https://supabase.com/dashboard>.
2. Open **SQL Editor**, paste the whole of [`supabase/schema.sql`](supabase/schema.sql), and press **Run**. It is idempotent.
3. **Project Settings → API** → copy the project URL, the `anon` key and the `service_role` key into `.env.local`.
4. **Authentication → Providers** → enable **Google** (add your OAuth client ID/secret) and/or leave **Email** on for magic links.
5. **Authentication → URL Configuration** → set **Site URL** to your deployment and add `https://your-app.vercel.app/auth/callback` plus `http://localhost:3000/auth/callback` to **Redirect URLs**.
6. Restart `npm run dev`.

The schema creates:

- `chapter_cache` — one row per `(standard, subject, chapter, language)`; world-readable, server-writable. Notes and formula sheets are generated once and then served from here.
- `diagnostic_results` — a student's before/after scores, readable and writable **only by that student** (`auth.uid() = user_id`).
- `doubts` — saved camera answers, same per-user RLS.

> **Free-tier note:** Groq's free tier limits tokens per minute. Notes generation is sequential with a 429-aware retry, and generated content is cached in the browser and in Supabase. Add a Gemini key for the smoothest experience.

## Deploy to Vercel

1. Push this repo to GitHub.
2. Import it at <https://vercel.com/new>.
3. Add `GEMINI_API_KEY`, `GROQ_API_KEY` and the three Supabase variables under **Settings → Environment Variables**.
4. Deploy, then add the deployment URL to Supabase **Redirect URLs** so sign-in returns to the live site.
5. Vercel gives you a public link that works on phones.

## Project structure

```
app/
  page.tsx                 # state machine for the 4 learning screens
  layout.tsx               # KaTeX CSS + global camera button
  globals.css
  chapter/[standard]/[subject]/[chapter]/page.tsx   # full-page reader
  auth/callback/route.ts   # Supabase OAuth / magic-link exchange
  api/
    chapters/route.ts      # NCERT chapter list (seed or AI)
    notes/route.ts         # book summary + revision notes (partial retry)
    chapter-notes/route.ts # exam notes, cached in Supabase
    chapter-formulas/route.ts # KaTeX formula sheet, cached in Supabase
    doubt/route.ts         # camera doubt solver (Gemini Vision)
    pyq/route.ts           # JEE Main style questions with solutions
    diagnostic/route.ts    # 5 diagnostic MCQs
    proof/route.ts         # 5 new post-test MCQs
    tutor/route.ts         # explanation + check question
    judge/route.ts         # grade a free-text reply
    health/route.ts        # key presence check
components/
  Shell.tsx                # layout + progress + sign-in
  StudyHub.tsx             # class/subject/language + mode selector
  ChapterBrowser.tsx       # searchable NCERT chapter list
  ChapterCard.tsx          # one row → links to the reader
  ChapterReader.tsx        # 3-tab reader (notes / formulas / practice)
  DoubtSolver.tsx          # floating camera button + 4-part answer
  AuthButton.tsx           # Google / email sign-in
  Math.tsx                 # KaTeX renderer with safe fallback
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
  slug.ts                  # class/subject/chapter URL helpers
  prompts.ts               # AI prompt templates
  gemini.ts                # Gemini + Groq client with rate-limit retry
  vision.ts                # Gemini Vision doubt solving
  validate.ts              # strict JSON validation + option shuffling
  chapterCache.ts          # Supabase chapter cache (no-op if unset)
  cache.ts                 # localStorage cache with TTL
  supabase/{client,server,admin,scores}.ts
  context.ts               # request validation
  client.ts                # fetch helper
supabase/
  schema.sql               # paste into the Supabase SQL Editor
```

## Roadmap

- More exam boards and state syllabi
- Teacher dashboard with class-level gap maps
- Spaced review of fixed vs still-open misconceptions
- Offline preset packs for low-connectivity classrooms

---

Built with AI for the **C3 hackathon**. No streaks, no badges — just proof that someone learned.

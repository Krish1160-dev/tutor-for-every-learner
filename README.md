# 🎓 A Tutor for Every Learner

> **Find your exact gap. Learn it. Prove it.**

An AI tutor for **any topic, any level, any language** that finds a learner's specific misconception, teaches it, and **proves improvement** with a before-and-after score.

Built for the **C3 hackathon** — problem statement: *"A tutor for every learner."*

---

## The problem

Most learners never get a personal tutor. They get worksheets, videos, and streaks — activities that keep them busy but never prove they understood anything. When they get stuck, nobody pinpoints *why*.

## What it does

Four screens, one learning loop:

| Screen | What happens |
| --- | --- |
| **1. Start** | Pick **any topic**, a **learner level** (Grade 5 · High School · Competitive), and a **language** (English · Hindi · Tamil · Telugu). Three instant demo presets are one tap away. |
| **2. Diagnostic** | Five AI-generated multiple-choice questions. Every wrong option is tagged with a specific **misconception**. The score becomes the learner's **Before** score. |
| **3. Tutor** | The app finds the learner's **weakest misconception** and explains it in their language with a real-life example. It then asks a check question and judges the free-text reply. Wrong? It explains the **same idea a different way** — up to 3 attempts. |
| **4. Proof** | Five **new** questions on the same concepts. The screen shows **Before vs After**, the gaps that were fixed, and the ones still open. |

## Why this proves learning

The retest uses **different questions on the same concepts**. A higher score cannot come from memorising the diagnostic — it comes from understanding. No streaks. No badges. No leaderboards. Just honest before-and-after data.

## Features

- 🌍 **Universal** — any topic the learner types, not one hard-coded chapter.
- 🎚️ **Level-aware** — Grade 5, High School, or Competitive/Advanced.
- 🗣️ **Multilingual** — explanations and feedback in English, Hindi, Tamil, or Telugu.
- ⚡ **3 instant demo presets** — Fractions, Photosynthesis, Kinematics — backed by bundled, hand-verified question banks so a live demo never depends on a fresh AI call.
- 🔁 **Adaptive tutoring** — re-explains differently instead of repeating.
- 🛡️ **Graceful AI fallback** — Gemini first, Groq automatically as backup, friendly retry if both fail.
- 📱 **Mobile-first** — large touch targets, readable type, works on any phone.
- 💾 **No login, no database** — progress is saved in `localStorage`.

## Tech stack

- **Next.js 15** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS** for the design system
- **Google Gemini 2.5 Flash** for question generation, tutoring, and answer grading
- **Groq** (Llama 3.3 70B) as an automatic fallback
- **Vercel** for hosting

API keys live **server-side** in Next.js route handlers — never in the browser.

## Architecture

```
Browser (React)
  │
  ├── /api/diagnostic  ──┐
  ├── /api/proof        ├──►  Gemini 2.5 Flash  ──►  (fallback) Groq
  ├── /api/tutor        │
  └── /api/judge      ──┘
        │
        └── keys read from server env (GEMINI_API_KEY, GROQ_API_KEY)
```

**Division of labour:** the code owns everything that must be reliable — questions, scoring, misconception tags, before/after proof. The AI is used only where language matters — explaining and judging free-text understanding.

## Getting started

```bash
# 1. Install dependencies
npm install

# 2. Add your keys
cp .env.local.example .env.local
# then edit .env.local and paste your GEMINI_API_KEY
# (optional) add GROQ_API_KEY for the backup

# 3. Run
npm run dev
```

Open <http://localhost:3000>.

Get a free Gemini key at <https://aistudio.google.com/apikey>.
Get a free Groq key at <https://console.groq.com/keys>.

## Deploy to Vercel

1. Push this repo to GitHub.
2. Import it at <https://vercel.com/new>.
3. Add `GEMINI_API_KEY` (and optionally `GROQ_API_KEY`) under **Settings → Environment Variables**.
4. Deploy. Vercel gives you a public link that works on phones.

## Project structure

```
app/
  page.tsx                 # state machine for the 4 screens
  layout.tsx
  globals.css
  api/
    diagnostic/route.ts    # generate 5 diagnostic MCQs
    proof/route.ts         # generate 5 new post-test MCQs
    tutor/route.ts         # explanation + check question
    judge/route.ts         # grade a free-text reply
    health/route.ts        # key presence check
components/
  Shell.tsx                # layout + progress
  StartScreen.tsx
  DiagnosticScreen.tsx
  TutorScreen.tsx
  ProofScreen.tsx
  ResultsScreen.tsx
  ui.tsx
lib/
  types.ts
  presets.ts               # 3 bundled, hand-verified question banks
  prompts.ts               # AI prompt templates
  gemini.ts                # Gemini + Groq client
  validate.ts              # strict JSON validation
  client.ts                # fetch helper
```

## Roadmap

- More subjects and exam boards
- Teacher dashboard with class-level gap maps
- Spaced review of fixed vs still-open misconceptions
- Offline preset packs for low-connectivity classrooms

---

Built with AI for the **C3 hackathon**. No streaks, no badges — just proof that someone learned.

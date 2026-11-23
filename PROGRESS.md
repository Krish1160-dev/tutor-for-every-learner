# PROGRESS / HANDOFF — A Tutor for Every Learner

> Last updated: Mon 23 Nov 2026
> Problem statement: **"A tutor for every learner"**
> Goal: find a learner's exact gap → teach it → **prove** improvement. No streaks, badges or leaderboards.

---

## 1. Current status

**Repo:** <https://github.com/Krish1160-dev/tutor-for-every-learner> (public)
**Local:** `C:\Users\admin\projects\tutor-for-every-learner`
**Stack:** Next.js 15.5.29 (App Router) · React 19 · TypeScript · Tailwind 3.4

- `v1` committed and pushed (`47c5b97`) — the original universal-topic tutor.
- `v2` (NCERT Class 6–12 + JEE PYQ hub) is **built and tested locally**, not yet committed.
- GitHub CLI is authenticated as **Krish1160-dev** (`gh auth status` works).
- Dev server runs on <http://localhost:3000>.

### Verified working

- [x] `npm run build` passes (11 routes, all 8 API routes).
- [x] Class/subject/language selectors (Class 6–12 + JEE).
- [x] NCERT chapter browser: seeds instant, AI generation for other classes, cached.
- [x] Chapter tabs: Book Summary (English), Revision Notes (selected language), Practice & Diagnose.
- [x] Class 10 Science → Electricity: summary (7 sections, 8 definitions, 7 formulas) + revision notes.
- [x] Chapter diagnostic → tutor → proof: **Before 1/5 → After 5/5**, 4 gaps fixed.
- [x] JEE PYQ hub: 5 years · 60 paper sets · 300 questions, subject + year filters.
- [x] JEE PYQ flow with **step-by-step solutions** in the results review.
- [x] Tutor explanation + free-text judge (Groq) working.
- [x] Option shuffling server-side (the AI was putting every correct answer first).
- [x] Partial notes retry (`parts` param) + 429-aware Groq retry.
- [x] Friendly errors and "Skip to the proof" fallback.

### Not yet verified

- [ ] Telugu/Hindi/Tamil rendering in the browser (API returns valid Unicode; console test only).
- [ ] Mobile layout on a physical phone.
- [ ] Gemini path (no key yet — Groq is doing all generation).

---

## 2. Toolchain

| Tool | Path |
|------|------|
| Node.js | `C:\Users\admin\.local\node\node-v26.13.1-win-x64` (portable, v26.13.1) |
| npm | same folder, v11.20.0 |
| Git | `C:\Program Files\Git\cmd\git.exe` |
| GitHub CLI | `C:\Program Files\GitHub CLI\gh.exe` (v2.105.0) |

Node is **not** on the system PATH:

```powershell
$env:Path = "C:\Users\admin\.local\node\node-v26.13.1-win-x64;$env:Path"
& "C:\Users\admin\.local\node\node-v26.13.1-win-x64\npm.cmd" run dev
```

---

## 3. Files (v2)

```
app/
  page.tsx                 # 4-screen state machine + localStorage (tutor-session-v3)
  api/
    chapters/route.ts      # seed or AI chapter list
    notes/route.ts         # summary + revision (sequential, partial retry)
    pyq/route.ts           # JEE-style questions with solutions
    diagnostic/route.ts
    proof/route.ts
    tutor/route.ts
    judge/route.ts
    health/route.ts
components/
  StudyHub.tsx             # class/subject/language + NCERT/JEE mode
  ChapterBrowser.tsx       # searchable chapter list
  ChapterCard.tsx          # summary / notes / practice tabs
  PyqHub.tsx               # stats, subject cards, year pills, paper cards
  DiagnosticScreen.tsx · TutorScreen.tsx · ProofScreen.tsx · ResultsScreen.tsx
  Shell.tsx · ui.tsx
lib/
  types.ts                 # Standard, Subject, StudyConfig, helpers
  ncert.ts                 # hand-checked chapter seeds
  pyq.ts                   # 5 years × 2 sessions × 2 shifts × 3 subjects
  presets.ts               # 3 bundled demo banks
  prompts.ts               # diagnostic / proof / tutor / judge / chapters / notes / revision / pyq
  gemini.ts                # Gemini + Groq, 429 retry
  validate.ts              # strict JSON validation + option shuffling
  context.ts · cache.ts · client.ts
README.md · DEMO.md · PROGRESS.md
```

---

## 4. Next steps

1. **Run a final `npm run build`** (stop the dev server first to avoid `.next` contention).
2. **Commit + push v2**:
   ```powershell
   $env:Path = "C:\Program Files\Git\cmd;$env:Path"
   git add .
   git commit -m "feat: NCERT Class 6-12 chapter hub + JEE 5-year PYQ hub"
   git push
   ```
3. **Deploy to Vercel**: import the repo, set `GROQ_API_KEY` (and `GEMINI_API_KEY` when available), deploy.
4. **Test the live link on a phone**: one NCERT chapter run + one JEE paper run.
5. **Add the Gemini key** at <https://aistudio.google.com/apikey> for the primary model (Groq remains the backup).
6. **Record the backup demo video** using `DEMO.md`.
7. **Rotate the Groq key** — it was pasted into chat. Generate a new one and update `.env.local` + Vercel.
8. Final submission text from `DEMO.md`.

---

## 5. Implementation notes

- **Seeded chapters** (instant, no AI): Class 6 Maths, Class 9 Science/Maths, Class 10 Science/Maths, Class 11 Physics, Class 12 Physics. Everything else is AI-generated once and cached for 7 days.
- **Notes** are two AI calls (summary in English, revision in the selected language), run **sequentially** to respect Groq's 8k TPM free-tier limit. `parts` lets the client retry only the missing half.
- **PYQ sets** are exam-style, modelled on JEE Main sessions/shifts — labelled honestly, not verbatim past papers. `solution` is required by validation.
- **Shuffling:** all AI questions are shuffled server-side and `correct`/`tags` are remapped, so the answer position carries no signal.
- **Fixed-gap logic:** diagnostic and proof questions pair by index. A gap is fixed when the diagnostic answer was wrong and the paired proof answer is right.
- **No AI for preset questions**: only explanations/grading need the AI.
- **Session key:** `tutor-session-v3` (old `v2` sessions are ignored).
- **Caching:** `tutor-cache-v2:` prefix in localStorage, 7-day TTL, separate keys for chapters and chapter notes (language included).

---

## 6. Credentials (never commit)

- [x] `GROQ_API_KEY` in `.env.local` (git-ignored).
- [ ] `GEMINI_API_KEY` — still needed.
- [ ] Set both in Vercel env.
- [ ] Rotate the Groq key (was shared in chat).
- [x] GitHub auth: Krish1160-dev.
- Repo: `tutor-for-every-learner` (public).

---

## 7. Demo one-liner

> "Pick your class, open any NCERT chapter or a JEE Main paper, and the tutor finds your exact gap, teaches it in your language, and proves your before-and-after score — no streaks, no badges."

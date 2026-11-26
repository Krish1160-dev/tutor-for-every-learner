# PROGRESS / HANDOFF — A Tutor for Every Learner

> Last updated: Wed 25 Nov 2026
> Problem statement: **"A tutor for every learner"**
> Goal: find a learner's exact gap → teach it → **prove** improvement. No streaks, badges or leaderboards.

---

## 1. Current status

**Repo:** <https://github.com/Krish1160-dev/tutor-for-every-learner> (public)
**Local:** `C:\Users\admin\projects\tutor-for-every-learner`
**Stack:** Next.js 15.5.29 (App Router) · React 19 · TypeScript · Tailwind 3.4 · KaTeX · Supabase (`@supabase/ssr`) · Gemini (`@google/genai`)

- `v1` — original universal-topic tutor (`47c5b97`).
- `v2` — NCERT Class 6–12 + JEE PYQ hub (`7c0a042`).
- `v3` — full-page chapter reader, exam notes, KaTeX formula sheet, camera doubt solver, Supabase auth + shared cache (**built, typechecked, browser-verified locally; not yet committed**).
- GitHub CLI is authenticated as **Krish1160-dev**.
- Dev server runs on <http://localhost:3000>.

### Verified working (v3)

- [x] `tsc --noEmit` clean and `npm run build` passes (15 routes, 11 API routes).
- [x] Chapter list rows are **links**, not inline accordions → `/chapter/[standard]/[subject]/[chapter]`.
- [x] Reader header: back button, chapter number + title, class · subject badge, language pills.
- [x] **Exam Notes** tab: NCERT definitions, mechanisms, board points, common mistakes, solved examples.
- [x] **Formula Sheet** tab: 6 KaTeX cards for Electricity (`katex` nodes render, zero `.katex-error`), symbol/SI-unit tables, "when to use", quick solved application.
- [x] **Practice & Diagnose** tab deep-links to `/?practice=1&…` and the home page starts the diagnostic on **Electricity 1 of 5** immediately.
- [x] Floating **📷 Ask a doubt** button on every page; modal exposes `accept="image/*"` + `capture="environment"`, note field and language pills.
- [x] Supabase-free mode: no keys → auth hidden, cache functions no-op, app fully usable.
- [x] **Camera solver end-to-end** with a real photo: 4-part answer in **3.5 s**, correct results (10 V; x = 5), disclaimer shown.
- [x] **Gemini 3.1 Flash-Lite** generation: notes 6.9 s, formula sheet 5.9 s, 5-question diagnostic 5.1 s.
- [x] **Telugu notes** verified in the API: 1,687 Telugu characters, clean Unicode.
- [x] Earlier v2 checks still hold: Electricity loop **1/5 → 5/5**, JEE paper loop with solutions, tutor + free-text judge.

### Not yet verified

- [ ] Supabase sign-in, RLS and `chapter_cache` hit — **blocked on project credentials**.
- [ ] Telugu/Hindi/Tamil rendering on a physical phone.

---

## 2. Toolchain

| Tool | Path |
|------|------|
| Node.js | `C:\Users\admin\.local\node\node-v26.13.1-win-x64` (portable, v26.13.1) |
| npm | same folder, v11.20.0 |
| Git | `C:\Program Files\Git\cmd\git.exe` |
| GitHub CLI | `C:\Program Files\GitHub CLI\gh.exe` (v2.105.0) |
| Vercel CLI | `vercel` 66.6.0, logged in as `krish1160-dev` |

Node is **not** on the system PATH:

```powershell
$env:Path = "C:\Users\admin\.local\node\node-v26.13.1-win-x64;$env:Path"
& "C:\Users\admin\.local\node\node-v26.13.1-win-x64\npm.cmd" run dev
```

Typecheck without npm:

```powershell
& "C:\Users\admin\.local\node\node-v26.13.1-win-x64\node.exe" .\node_modules\typescript\bin\tsc --noEmit
```

---

## 3. Files (v3)

```
app/
  page.tsx                 # 4-screen state machine + localStorage (tutor-session-v3)
  layout.tsx               # KaTeX CSS + global <DoubtSolver />
  chapter/[standard]/[subject]/[chapter]/page.tsx   # server page, resolves slugs
  auth/callback/route.ts   # Supabase code → cookie session
  api/
    chapters/route.ts      # seed or AI chapter list
    notes/route.ts         # summary + revision (sequential, partial retry)
    chapter-notes/route.ts # exam notes (Supabase cache first)
    chapter-formulas/route.ts # KaTeX formula sheet (Supabase cache first)
    doubt/route.ts         # Gemini Vision, 4-part answer
    pyq/route.ts           # JEE-style questions with solutions
    diagnostic/route.ts · proof/route.ts · tutor/route.ts · judge/route.ts · health/route.ts
components/
  ChapterReader.tsx        # 3 tabs: notes / formulas / practice
  DoubtSolver.tsx          # floating camera button, downscale, 4-part answer + disclaimer
  AuthButton.tsx           # Google OAuth + email magic link
  Math.tsx                 # KaTeX with graceful text fallback
  ChapterCard.tsx          # link row to the reader
  StudyHub.tsx · ChapterBrowser.tsx · PyqHub.tsx
  DiagnosticScreen.tsx · TutorScreen.tsx · ProofScreen.tsx · ResultsScreen.tsx
  Shell.tsx · ui.tsx
lib/
  types.ts                 # + ExamNotes, FormulaSheet, DoubtSolution
  prompts.ts               # + examNotesPrompt, formulaSheetPrompt, doubtSystemPrompt
  validate.ts              # + sanitizeExamNotes / FormulaSheet / DoubtSolution, plainMath
  vision.ts                # Gemini Vision with model fallback
  chapterCache.ts          # Supabase chapter cache (no-op if unset)
  slug.ts                  # class/subject/chapter URL helpers
  supabase/{client,server,admin,scores}.ts
  gemini.ts · ncert.ts · pyq.ts · presets.ts · context.ts · cache.ts · client.ts
supabase/schema.sql        # paste into the SQL Editor
middleware.ts              # refreshes the Supabase session
.env.example               # key list
README.md · DEMO.md · PROGRESS.md
```

---

## 4. Next steps

1. **Create the Supabase project**, run `supabase/schema.sql`, paste the three keys, enable Google/Email auth, add `/auth/callback` to Redirect URLs. Verify: first chapter load writes a `chapter_cache` row, second load returns `source: "cache"`.
2. **Commit + push v3.1** (Gemini 3.1 Flash-Lite, tolerant doubt validator, chip scrolling).
3. **Deploy to Vercel** (`vercel link`, add env vars, `vercel --prod`), then add the live URL to Supabase Redirect URLs.
4. **Rotate the Groq key** — it was pasted into chat. Update `.env.local` and Vercel.
5. **Test the live link on a phone**: one chapter run, one camera doubt, one JEE paper.

---

## 5. Implementation notes

- **Chapter cache** is keyed by `(standard, subject, chapter, language)` and stores `exam_notes` and `formula_sheet` as separate JSONB columns, so either half can be filled independently. Writes use the service-role client; reads are public. Without Supabase env vars every cache call is a silent no-op.
- **Exam notes and formula sheets are lazy**: only the tab the student opens is generated. The client also caches per language in `localStorage` (`tutor-cache-v3:`).
- **`plainMath()`** converts leaked KaTeX (`\times`, `\frac`, `^{2}`) into readable symbols in prose fields (steps, answers, definitions) while leaving the `latex` field untouched for KaTeX.
- **Vision** uses `@google/genai` with `gemini-3.1-flash-lite` → `gemini-3.1-flash-lite-preview`, thinking disabled. The prompt forces re-checking arithmetic and forbids inventing a question; images are downscaled to 1500 px JPEG client-side.
- **Model choice is driven by the free tier:** on this key the 3.5–3.8 Flash models answer `503 high demand` and Pro answers `429 quota`, so Flash-Lite is primary and Groq is the text backup. Thinking is off (`thinkingBudget: 0`) — with thinking on, the same photo took 243 s instead of 1.8 s.
- **Deep link contract:** `/chapter/...` → Practice tab → `/?practice=1&standard&subject&chapter&lang&num` → home page starts the loop and clears the query with `history.replaceState`.
- **Seeded chapters**: Class 6 Maths, Class 9 Science/Maths, Class 10 Science/Maths, Class 11 Physics, Class 12 Physics. Everything else is AI-generated once and cached.
- **Notes** are two AI calls (summary in English, revision in the selected language), run **sequentially** for Groq's 8k TPM limit; `parts` allows a partial retry.
- **PYQ sets** are exam-style, modelled on JEE Main — labelled honestly, not verbatim past papers.
- **Shuffling:** AI questions are shuffled server-side with `correct`/`tags` remapped, so answer position carries no signal.

---

## 6. Credentials (never commit)

- [x] `GROQ_API_KEY` in `.env.local` (git-ignored).
- [ ] `GEMINI_API_KEY` — **needed for the camera solver**.
- [ ] `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
- [ ] Set all of the above in Vercel env.
- [ ] Rotate the Groq key (was shared in chat).
- [x] GitHub auth: Krish1160-dev.

---

## 7. Demo one-liner

> "Pick your class, open any NCERT chapter for exam notes and a formula sheet, photograph a doubt the camera solver can't guess at — and the tutor still finds your exact gap, teaches it in your language, and proves your before-and-after score. No streaks, no badges."

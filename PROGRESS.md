# PROGRESS / HANDOFF — A Tutor for Every Learner

> Last updated: Mon 23 Nov 2026
> Hackathon: C3 — problem statement **"A tutor for every learner"**
> Goal: a working web app that finds a learner's exact gap → teaches it → **proves** improvement with before/after scores. No streaks, badges, or leaderboards.
> Deadline: confirm on the hackathon page (roadmap says ~27/28 Nov; user said 9 days → ~29/30 Nov).

---

## 1. What is built (v1, working)

**Location:** `C:\Users\admin\projects\tutor-for-every-learner`
**Stack:** Next.js 15.5.29 (App Router) · React 19 · TypeScript · Tailwind CSS 3.4
**Hosting plan:** Vercel (server-side API routes keep the key secret)

### Verified working (in the in-app browser)
- [x] Start screen: topic input, 3 levels, 4 languages, 3 demo presets.
- [x] Preset flow uses bundled, hand-verified question banks (no AI needed for questions).
- [x] Diagnostic: 5 MCQs → Before score + weakest misconception.
- [x] Proof: 5 new questions → After score + "gaps fixed" (paired by concept index).
- [x] Results: **Before 2/5 → After 5/5**, all 3 gaps fixed.
- [x] Friendly error + Retry + **Skip to the proof** when the AI is unavailable.
- [x] `npm run build` passes cleanly (types valid, all routes compiled).

### Still to verify (needs the Gemini key)
- [ ] Live AI tutor explanation + free-text judge + adaptive re-explain (3 attempts).
- [ ] Free-form topic generation (`/api/diagnostic`, `/api/proof`).
- [ ] Telugu/Hindi/Tamil explanation quality.
- [ ] Mobile layout on a real phone.

---

## 2. Toolchain (installed)

| Tool | Path / status |
|------|---------------|
| Node.js | `C:\Users\admin\.local\node\node-v26.13.1-win-x64` (portable, v26.13.1) |
| npm | same folder, v11.20.0 |
| Git | `C:\Program Files\Git\cmd\git.exe` |
| GitHub CLI | **not installed** (use git + a PAT, or install `GitHub.cli`) |

**Important:** Node is not on the system PATH. For any npm command, prepend it:

```powershell
$env:Path = "C:\Users\admin\.local\node\node-v26.13.1-win-x64;$env:Path"
& "C:\Users\admin\.local\node\node-v26.13.1-win-x64\npm.cmd" run dev
```

The dev server is currently running on <http://localhost:3000>.

---

## 3. Files

```
app/
  page.tsx                 # 4-screen state machine + localStorage persistence
  layout.tsx
  globals.css              # Tailwind design system (@layer components)
  api/
    diagnostic/route.ts
    proof/route.ts
    tutor/route.ts
    judge/route.ts
    health/route.ts
components/
  Shell.tsx · StartScreen.tsx · DiagnosticScreen.tsx
  TutorScreen.tsx · ProofScreen.tsx · ResultsScreen.tsx · ui.tsx
lib/
  types.ts · presets.ts (3 verified banks) · prompts.ts
  gemini.ts (Gemini 2.5 Flash → 2.0 Flash → Groq fallback)
  validate.ts · client.ts
README.md                  # public-facing project README
DEMO.md                    # 3-min demo script, checklist, submission text, Q&A
.env.local.example
```

---

## 4. Next steps (in order)

1. **Add the Gemini key** (user action):
   - Get it at <https://aistudio.google.com/apikey>.
   - Put it in `.env.local` as `GEMINI_API_KEY=...` (never commit).
   - Optional backup: `GROQ_API_KEY` from <https://console.groq.com/keys>.
2. Restart the dev server (env changes need a restart) and test:
   - Preset → tutor explanation → wrong answer → different explanation → proof.
   - Free-form topic (e.g. "Newton's Laws", "Photosynthesis") in Telugu.
3. `git init`, first commit, create a **public** GitHub repo, push.
   - Need GitHub username + auth (PAT or `gh auth login`).
4. Deploy on Vercel: import repo, add `GEMINI_API_KEY` (+ `GROQ_API_KEY`), deploy.
5. Test the live link on a phone.
6. Record a backup demo video; finalize the submission text (see `DEMO.md`).
7. Update the repo with a screenshot/GIF in the README (nice for judges).

---

## 5. Key implementation notes

- **Gemini REST:** `POST https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key=...`, `responseMimeType: "application/json"`. Models tried: `gemini-2.5-flash`, `gemini-2.0-flash`.
- **Groq fallback:** OpenAI-compatible `https://api.groq.com/openai/v1/chat/completions`, model `llama-3.3-70b-versatile` (override with `GROQ_MODEL`).
- **Strict validation:** 5 questions, 4 options, correct index 0–3, tags only on wrong indices; retry once on invalid.
- **Fixed-gap logic:** diagnostic and proof questions are paired by index (proof prompt asks for the same concepts in the same order). A gap is "fixed" when the diagnostic answer was wrong and the paired proof answer is right.
- **No AI for preset questions** — only explanations/grading need the AI.
- **No new features after Day 5** — bug fixes only.

---

## 6. Credentials checklist (do not commit)

- [ ] `GEMINI_API_KEY` in `.env.local` (local) and Vercel env (prod).
- [ ] `GROQ_API_KEY` (optional but recommended).
- [ ] Confirm `.env.local` is git-ignored before the first push.
- [ ] GitHub username: ____________________
- [ ] Repo name: `tutor-for-every-learner` (public).

---

## 7. Demo one-liner

> "A tutor that finds your exact gap, teaches it in your language, and proves your before-and-after score — not streaks or badges."

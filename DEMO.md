# 🎬 Demo & Submission Kit

## The 3-minute demo

One job: show a learner **failing → being taught → succeeding**.

| Time | Beat | What to do / say |
| --- | --- | --- |
| 0:00–0:15 | **Hook** | "Most students never get a personal tutor. We built one that finds your exact gap, teaches it in your language, and proves you improved." |
| 0:15–0:25 | **Start** | Open the live link on your phone. Tap the **Photosynthesis** preset (or switch language to Telugu) to show it isn't one hard-coded chapter. |
| 0:25–1:10 | **Diagnostic** | Ask a judge or teammate to answer the 5 questions out loud. Let them get 2–3 wrong. |
| 1:10–1:25 | **The gap** | Point at the **"Your exact gap"** card: "It found the specific misconception — not just 'you got 3 wrong'." |
| 1:25–2:10 | **Teaching** | Let the tutor explain. Have the learner miss the check question **once**, so judges see the **different explanation**. Then answer correctly. |
| 2:10–2:55 | **Proof** | Run the 5 new questions. Show **Before → After** and the **gaps fixed**. |
| 2:55–3:00 | **Close** | "Not streaks or badges. Proof that someone learned." |

**Honesty rule:** only show scores you actually got. Never fake or pre-fill results. One honest improvement beats an impossible 5/5.

## Pre-demo checklist (1 hour before)

- [ ] Live link opens on **phone** and **laptop**.
- [ ] One full run tested end-to-end (API quota confirmed).
- [ ] Backup video recorded and saved on phone **and** laptop.
- [ ] Every bundled preset question verified (they're hand-checked).
- [ ] Phone charged; mobile hotspot ready.
- [ ] Script practised out loud 3 times.
- [ ] `GEMINI_API_KEY` and `GROQ_API_KEY` set in Vercel.

## Risk → quick fix

| Risk | Fix |
| --- | --- |
| Gemini rate limit | Groq fallback fires automatically. If both fail, show the friendly retry, or play the backup video. |
| Venue internet down | Phone hotspot. If that fails, play the backup video. |
| AI writes a bad question | Presets use bundled, hand-verified banks. For free-form topics, the app validates structure and retries once. |
| Telugu/Hindi sounds unnatural | Keep technical terms in English; have a native speaker sanity-check one explanation. |
| App breaks after a change | Save a working copy at the end of each day. One change at a time. |
| Tempted to add features | No new features after Day 5. Bugs only. |

## Submission text (draft)

**Problem.** Most learners have no personal tutor. They get videos and worksheets that keep them busy but never show whether they actually understood. When they're stuck, nobody pinpoints *why*.

**Solution.** *A Tutor for Every Learner* is a four-screen AI tutor for any topic, any level (Grade 5, High School, Competitive), in English, Hindi, Tamil, or Telugu. A diagnostic finds the learner's exact misconception; the tutor explains it in their language with a real-life example and adapts if they don't get it; then a retest on **new** questions proves whether they improved.

**How it proves learning.** The Before score comes from the diagnostic. The After score comes from **different questions on the same concepts**. A higher score can't come from memorising the first set. We show the gaps fixed and the ones still open — honest data, no streaks or badges.

**How it was built.** Next.js + React + TypeScript + Tailwind on the frontend; Google Gemini 2.5 Flash for question generation, tutoring, and free-text grading; Groq as an automatic fallback; deployed on Vercel with server-side keys. Built with AI assistance for the C3 hackathon.

**What's next.** More subjects and exam boards, a teacher dashboard with class-level gap maps, spaced review of fixed vs still-open misconceptions, and offline preset packs for low-connectivity classrooms.

## Likely judge questions

**"How do you prove learning?"**
> The learner takes a diagnostic, gets taught, then takes a retest with different questions on the same concepts. The score change is the proof.

**"Isn't this just ChatGPT?"**
> ChatGPT will explain anything, but it won't tell you *which specific misconception* you have, adapt across attempts, and then measure you on new questions. The code owns the assessment loop; the AI only handles language.

**"What if the AI is wrong?"**
> The demo presets use hand-verified question banks. For free-form topics we validate every question's structure and retry once; the tutor's check question is graded against an explicit correct idea.

**"Does it scale / cost money?"**
> No login, no database, no per-user storage. Presets are static; free-form generation is cached in the browser. Gemini's free tier plus Groq fallback keeps it near zero cost for a classroom pilot.

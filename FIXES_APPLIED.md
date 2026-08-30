# Fixes applied

## 1. Roadmap flowchart was collapsing into one column
`backend/src/services/ai.js` → `buildFallback()` stored each phase's
`prerequisites` as the *previous phase's raw skill name* (e.g. "Python"),
but the phase's own `title` was `"Python Fundamentals"`. The flowchart in
`Roadmap.jsx` matches dependencies by title, so the lookup always failed
and every phase defaulted to level 0 — one flat "Stage 1" instead of a
real dependency chain. Fixed so prerequisites reference the actual
previous phase title. Verified: an AIML roadmap now resolves into 9
separate stages instead of 1.

## 2. Content not matching career goal / goal sentences leaking as "skills"
`backend/src/controllers/featureController.js` had its own hardcoded
list of 6 career tracks (AI, data, cyber, cloud, design, MERN). Any goal
that didn't match one of those regexes (e.g. "Robotics Engineer", or
unusual phrasing) fell back to raw, unfiltered database fields — which is
how a literal onboarding sentence like "I want to become an AI Engineer"
could end up displayed as if it were a skill.

Fixed by extracting a single shared `canonicalTrackFor(goal)` in
`ai.js` that both the roadmap generator and the assessment generator now
use, and by always filtering any fallback skill list through the existing
`isGoalLikeSkill()` filter (also now exported from `ai.js`).

Also: changing the career goal on the Profile page only updated the user
record and never refreshed the roadmap — it self-healed on next reload,
but not immediately. `Profile.jsx` now dispatches the
`learnpath:path-updated` event on save, and `learningController.js`'s
`getPath` self-heal check is now stricter (reuses `isGoalLikeSkill` and,
when no OpenAI key is configured, verifies every phase's skills belong to
the exact canonical track for the current goal).

## 3. "Generate Another Project" always returned the same project
Without an `OPENAI_API_KEY` configured (the default), project generation
was fully deterministic — same inputs always produced the same output, so
"Generate Another" did nothing. Added 5 distinct project "angles" that are
randomly selected, and the frontend now sends the previously-shown title
so the backend avoids repeating it immediately.

## 4. Assessment questions didn't change / were too generic for AI/ML etc.
The local question bank only had one variant per skill and was missing
entries for several AI/ML-track skills (NumPy, Pandas, Deep Learning,
Model Deployment) and skills from the cloud/design/security tracks.
Expanded the bank (2–3 variants for many skills, added the missing
skills) and added Fisher–Yates shuffling of both which question is picked
per skill and the on-screen order of its answer options, so retaking the
assessment actually looks different each time.

A public trivia API was intentionally *not* used for this — general
trivia APIs don't have programming/AI-ML-specific questions, so they'd
make results less relevant to the career goal, not more.

## Note on testing
This sandbox couldn't fully run the app end-to-end (no network access to
install native build dependencies for this Linux container, and no local
MongoDB). The core logic changes above were unit-verified directly with
Node (see conversation), but please run the full app locally to confirm
UI behavior:

```
npm run setup   # installs frontend + backend deps fresh for your OS
npm run dev:server   # in one terminal (needs MongoDB running)
npm run dev:client   # in another terminal
```

# LearnPath AI — Dynamic Full-Stack Fixed

This version fixes the major dynamic-learning issues:

- Goal text is no longer treated as a learning skill/topic.
- New roadmaps start with exactly one **Current** topic; the rest are **Locked** until progress is recorded.
- Existing broken `Build JavaScript`, `Build java`, etc. roadmaps are automatically regenerated when detected.
- Roadmap flowchart is generated from the actual roadmap dependencies with one click.
- Every roadmap topic is guaranteed to have a YouTube lecture link and an article/documentation link.
- Assessment questions are practical scenario questions instead of generic self-rating questions.
- Assessment results update learner skills and automatically adapt the roadmap while preserving genuinely completed topics.
- Project Lab targets the current phase and the largest skill gap and supports Generate Another.
- Returning users with `onboardingCompleted` skip onboarding.
- Frontend and backend run independently.

## Run frontend separately

```bash
cd src
npm install
npm run dev
```

Frontend: http://localhost:5173

## Run backend separately

Open a second terminal:

```bash
cd src/backend
npm install
npm run dev
```

Backend: http://localhost:5000

Health check: http://localhost:5000/api/health

## MongoDB

Make sure MongoDB is running and `backend/.env` contains a valid `MONGO_URI`.

## If port 5000 is busy

```bash
netstat -ano | findstr :5000
cmd.exe /c "taskkill /PID ACTUAL_PID /F"
```

Replace `ACTUAL_PID` with the PID shown by `netstat` (not a PID from an older terminal). Alternatively change `PORT` in `backend/.env` and update `VITE_API_URL` in the frontend environment.


## Career-goal alignment (v3)
- The backend normalizes onboarding sentences such as "I want to become an AI/ML Developer in 4 months" to `AI/ML Developer`.
- Assessment questions are selected from the learner's career track; unrelated skills from an older profile/path are not used for known tracks.
- When an existing learning path belongs to a different goal or contains legacy "Build ..." / goal-sentence data, it is regenerated for the current career goal.
- Dashboard AI refresh updates the recommendation, progress insight, and weekly plan together.
- Assessment submission updates skill levels and adapts the roadmap.

## Run frontend and backend separately
Terminal 1:
```bash
npm install
npm run dev
```
Frontend: http://localhost:5173

Terminal 2:
```bash
cd backend
npm install
npm run dev
```
Backend: http://localhost:5000

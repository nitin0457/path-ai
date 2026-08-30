# LearnPath AI Backend

Express + MongoDB backend for the Personalized Learning Path Recommender.

## Setup

1. Install MongoDB locally or use MongoDB Atlas.
2. Copy `.env.example` to `.env`.
3. Set `MONGO_URI` and a strong `JWT_SECRET`.
4. Optionally set `OPENAI_API_KEY` to enable real AI responses. Without it, the API uses deterministic demo recommendations.
5. Run:

```bash
npm install
npm run dev
```

API: `http://localhost:5000`

Health check: `GET /api/health`

## Demo user

Run `npm run seed`, then use:

- Email: `demo@learnpath.ai`
- Password: `password`

## API

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/user/profile`
- `PUT /api/user/profile`
- `POST /api/learning-path/analyze-goal`
- `POST /api/learning-path/generate-roadmap`
- `GET /api/learning-path`
- `PUT /api/learning-path/progress`
- `POST /api/ai/chat`
- `POST /api/ai/next-action`
- `POST /api/feedback`

All routes except auth and health require `Authorization: Bearer <token>`.

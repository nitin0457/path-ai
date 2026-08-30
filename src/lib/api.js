const API_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

async function request(path, options = {}) {
  const token = localStorage.getItem('learnpath-token');

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const r = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  const d = await r.json().catch(() => ({}));

  if (!r.ok) {
    const err = new Error(d.message || 'Request failed');
    Object.assign(err, d);
    throw err;
  }

  return d;
}

export const api = {
  // Authentication
  firebase: (idToken, extra = {}) =>
    request('/auth/firebase', {
      method: 'POST',
      body: JSON.stringify({
        idToken,
        ...extra,
      }),
    }),

  register: (b) =>
    request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(b),
    }),

  login: (b) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(b),
    }),

  google: (credential) =>
    request('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ credential }),
    }),

  verifyEmail: (b) =>
    request('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify(b),
    }),

  resendVerification: (b) =>
    request('/auth/resend-verification', {
      method: 'POST',
      body: JSON.stringify(b),
    }),

  // User Profile
  profile: () =>
    request('/user/profile'),

  updateProfile: (b) =>
    request('/user/profile', {
      method: 'PUT',
      body: JSON.stringify(b),
    }),

  // AI
  analyzeGoal: (b) =>
    request('/ai/analyze-goal', {
      method: 'POST',
      body: JSON.stringify(b),
    }),

  chat: (message) =>
    request('/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ message }),
    }),

  nextAction: () =>
    request('/ai/next-action', {
      method: 'POST',
    }),

  weeklyPlan: () =>
    request('/ai/weekly-plan', {
      method: 'POST',
    }),

  progressInsight: () =>
    request('/ai/progress-insight', {
      method: 'POST',
    }),

  // Learning Path
  generateRoadmap: (b) =>
    request('/learning-path/generate-roadmap', {
      method: 'POST',
      body: JSON.stringify(b),
    }),

  getPath: () =>
    request('/learning-path'),

  updateProgress: (b) =>
    request('/learning-path/progress', {
      method: 'PUT',
      body: JSON.stringify(b),
    }),

  // Feedback
  feedback: (b) =>
    request('/feedback', {
      method: 'POST',
      body: JSON.stringify(b),
    }),

  // Assessment
  assessment: () =>
    request('/features/assessment'),

  submitAssessment: (b) =>
    request('/features/assessment/submit', {
      method: 'POST',
      body: JSON.stringify(b),
    }),

  // Project
  generateProject: (excludeTitle) =>
    request('/features/project', {
      method: 'POST',
      body: JSON.stringify({
        excludeTitle: excludeTitle || null,
      }),
    }),

  // Review & Interview
  review: () =>
    request('/features/review'),

  interview: () =>
    request('/features/interview'),
};
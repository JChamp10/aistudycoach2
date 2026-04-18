import axios from 'axios';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

const api = axios.create({ baseURL: API });

api.interceptors.request.use(config => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  res => {
    // Sync AI usage from headers if present
    const used = res.headers['x-ai-calls-used'];
    const limit = res.headers['x-ai-calls-limit'];
    if (used !== undefined && limit !== undefined) {
      import('@/lib/store').then(({ useAuthStore }) => {
        useAuthStore.getState().setUsage(parseInt(used as string), parseInt(limit as string));
      });
    }
    return res;
  },
  err => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('token');
      window.location.href = '/login';
    } else if (err.response?.status === 403 && err.response?.data?.error === 'REQUIRES_UPGRADE') {
      import('@/lib/store').then(({ useAuthStore }) => {
        const used = err.response?.data?.ai_calls_today;
        const limit = err.response?.data?.ai_limit;
        if (used !== undefined && limit !== undefined) {
          useAuthStore.getState().setUsage(used, limit);
        }
        useAuthStore.getState().setShowUpgradeModal(true);
      });
    }
    return Promise.reject(err);
  }
);

export default api;

export const authApi = {
  register: (data: { username: string; email: string; password: string; region?: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  devLogin: () => api.post('/auth/dev-login'),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
};

export const flashcardApi = {
  decks: () => api.get('/flashcards/decks'),
  createDeck: (data: any) => api.post('/flashcards/decks', data),
  deckCards: (id: string) => api.get(`/flashcards/decks/${id}/cards`),
  dueCards: () => api.get('/flashcards/due'),
  createCard: (data: any) => api.post('/flashcards', data),
  updateCard: (id: string, data: any) => api.put(`/flashcards/${id}`, data),
  deleteCard: (id: string) => api.delete(`/flashcards/${id}`),
  deleteDeck: (id: string) => api.delete(`/flashcards/decks/${id}`),
  shareDeck: (id: string) => api.post(`/flashcards/decks/${id}/share`),
  unshareDeck: (id: string) => api.post(`/flashcards/decks/${id}/unshare`),
  getPublicDeck: (token: string) => api.get(`/flashcards/public/${token}`),
  generateFromNotes: (data: any) => api.post('/flashcards/generate', data),
  generateFromPdf: (formData: FormData) =>
    api.post('/flashcards/generate-pdf', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  reviewCard: (id: string, difficulty: string) =>
    api.post(`/flashcards/${id}/review`, { difficulty }),
};

export const notesApi = {
  getAll: () => api.get('/notes'),
  create: (data: { title: string; content: string; source: string }) =>
    api.post('/notes', data),
  aiCompose: (topic: string) =>
    api.post('/notes/ai-compose', { topic }),
  scan: (formData: FormData) =>
    api.post('/notes/scan', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  lesson: (formData: FormData) =>
    api.post('/notes/lesson', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  delete: (id: string) => api.delete(`/notes/${id}`),
  transmute: (id: string, deckTitle: string) =>
    api.post(`/notes/${id}/transmute`, { deckTitle }),
};

export const homeworkApi = {
  ask: (data: any) => api.post('/homework/ask', data),
  askPdf: (formData: FormData) =>
    api.post('/homework/ask-pdf', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  askImage: (formData: FormData) =>
    api.post('/homework/ask-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  history: () => api.get('/homework/history'),
};

export const leaderboardApi = {
  global: () => api.get('/leaderboard/global'),
  weekly: () => api.get('/leaderboard/weekly'),
  regional: () => api.get('/leaderboard/regional'),
};

export const userApi = {
  profile: () => api.get('/users/profile'),
  updateProfile: (data: any) => api.put('/users/profile', data),
  stats: () => api.get('/users/stats'),
  achievements: () => api.get('/users/achievements'),
  redeemCode: (code: string) => api.post('/users/redeem-code', { code }),
  usage: () => api.get('/users/usage'),
  // Admin (jchamp101 only)
  adminResetAI: () => api.post('/users/admin/reset-ai'),
  adminSetPlan: (plan: string) => api.post('/users/admin/set-plan', { plan }),
  adminAddXP: (amount: number) => api.post('/users/admin/add-xp', { amount }),
  adminSetStreak: (streak: number) => api.post('/users/admin/set-streak', { streak }),
  adminGetUsers: () => api.get('/users/admin/users'),
  adminClearLeaderboard: () => api.post('/users/admin/clear-leaderboard'),
  getPublicProfile: (username: string) => api.get(`/users/public/${username}`),
};

export const quizApi = {
  generate: (data: any) => api.post('/quiz/generate', data),
  generateFromPdf: (formData: FormData) =>
    api.post('/quiz/generate-pdf', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  submit: (data: any) => api.post('/quiz/submit', data),
};

export const socialApi = {
  following: () => api.get('/social/following'),
  follow: (id: string) => api.post(`/social/follow/${id}`),
  unfollow: (id: string) => api.delete(`/social/unfollow/${id}`),
};

export const billingApi = {
  getPlans: () => api.get('/billing/plans'),
  checkout: (planId: string) => api.post('/billing/checkout', { planId }),
};

export const calendarApi = {
  getEvents: () => api.get('/calendar'),
  createEvent: (data: { title: string; description?: string; event_type: string; event_date: string }) => api.post('/calendar', data),
  deleteEvent: (id: string) => api.delete("/calendar/$id"),
  getToken: () => api.post('/calendar/token'),
};


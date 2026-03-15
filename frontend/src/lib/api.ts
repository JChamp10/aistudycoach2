import axios from 'axios';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const api = axios.create({ baseURL: API });

api.interceptors.request.use(config => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('token');
      window.location.href = '/login';
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
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
};

export const flashcardApi = {
  decks: () => api.get('/flashcards/decks'),
  createDeck: (data: any) => api.post('/flashcards/decks', data),
  deckCards: (id: string) => api.get(`/flashcards/decks/${id}/cards`),
  dueCards: () => api.get('/flashcards/due'),
  createCard: (data: any) => api.post('/flashcards', data),
  generateFromNotes: (data: any) => api.post('/flashcards/generate', data),
  generateFromPdf: (formData: FormData) =>
    api.post('/flashcards/generate-pdf', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  reviewCard: (id: string, difficulty: string) => api.post(`/flashcards/${id}/review`, { difficulty }),
};

export const homeworkApi = {
  ask: (data: any) => api.post('/homework/ask', data),
  askPdf: (formData: FormData) =>
    api.post('/homework/ask-pdf', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  history: () => api.get('/homework/history'),
};

export const quizApi = {
  generate: (data: any) => api.post('/quiz/generate', data),
  submit: (data: any) => api.post('/quiz/submit', data),
};

export const kahootApi = {
  questionsFromDeck: (data: { deck_id: string; count?: number }) =>
    api.post('/kahoot/questions/deck', data),
  questionsFromAI: (data: { topic: string; difficulty?: string; count?: number }) =>
    api.post('/kahoot/questions/ai', data),
  saveResults: (data: any) => api.post('/kahoot/results', data),
};

export const plannerApi = {
  get: () => api.get('/planner'),
  create: (data: any) => api.post('/planner', data),
  update: (id: string, data: any) => api.put(`/planner/${id}`, data),
  delete: (id: string) => api.delete(`/planner/${id}`),
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
};
export const studyApi = {
  start: (data: any) => api.post('/study/start', data),
  end: (id: string, data: any) => api.put(`/study/${id}/end`, data),
  sessions: () => api.get('/study/sessions'),
};

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

export const homeworkApi = {
  ask: (data: any) => api.post('/homework/ask', data),
  askPdf: (formData: FormData) =>
    api.post('/homework/ask-pdf', formData, {
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
};

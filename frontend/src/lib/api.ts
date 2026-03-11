import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  register: (data: { username: string; email: string; password: string }) => api.post('/auth/register', data),
  login: (data: { email: string; password: string }) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
};

export const userApi = {
  profile: () => api.get('/users/profile'),
  stats: () => api.get('/users/stats'),
  achievements: () => api.get('/users/achievements'),
  updateProfile: (data: any) => api.put('/users/profile', data),
};

export const flashcardApi = {
  decks: () => api.get('/flashcards/decks'),
  createDeck: (data: any) => api.post('/flashcards/decks', data),
  deckCards: (deckId: string) => api.get(`/flashcards/decks/${deckId}/cards`),
  dueCards: () => api.get('/flashcards/due'),
  createCard: (data: any) => api.post('/flashcards', data),
  generateFromNotes: (data: any) => api.post('/flashcards/generate', data),
  reviewCard: (cardId: string, difficulty: 'easy' | 'medium' | 'hard') => api.post(`/flashcards/${cardId}/review`, { difficulty }),
};

export const studyApi = {
  recordSession: (data: any) => api.post('/study/session', data),
  sessions: () => api.get('/study/sessions'),
  submitRecall: (data: any) => api.post('/study/recall', data),
  subjects: () => api.get('/study/subjects'),
  createSubject: (data: any) => api.post('/study/subjects', data),
};

export const homeworkApi = {
  ask: (data: any) => api.post('/homework', data),
  history: () => api.get('/homework'),
};

export const quizApi = {
  generate: (data: any) => api.post('/quiz/generate', data),
  submit: (data: any) => api.post('/quiz/submit', data),
};

export const plannerApi = {
  list: (params?: any) => api.get('/planner', { params }),
  generate: (data: any) => api.post('/planner/generate', data),
  update: (id: string, data: any) => api.put(`/planner/${id}`, data),
  delete: (id: string) => api.delete(`/planner/${id}`),
};

export const marketplaceApi = {
  list: (params?: any) => api.get('/marketplace', { params }),
  get: (id: string) => api.get(`/marketplace/${id}`),
  create: (data: any) => api.post('/marketplace', data),
  purchase: (id: string) => api.post(`/marketplace/${id}/purchase`),
  review: (id: string, data: any) => api.post(`/marketplace/${id}/review`, data),
  myListings: () => api.get('/marketplace/my/listings'),
  myPurchases: () => api.get('/marketplace/my/purchases'),
};

export const leaderboardApi = {
  global: () => api.get('/leaderboard/global'),
  weekly: () => api.get('/leaderboard/weekly'),
  regional: () => api.get('/leaderboard/regional'),
};

export default api;

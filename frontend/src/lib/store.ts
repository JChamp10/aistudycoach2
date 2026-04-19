import { create } from 'zustand';
import { authApi, flashcardApi } from '@/lib/api';

interface User {
  id: string;
  username: string;
  email: string;
  xp: number;
  streak: number;
  role: string;
  region?: string;
  avatar_url?: string;
  plan: string;
  ai_calls_today: number;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  source: 'scratch' | 'scan' | 'ai' | 'lesson';
  createdAt: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  darkMode: boolean;
  login: (email: string, password: string) => Promise<void>;
  devLogin: () => Promise<void>;
  register: (username: string, email: string, password: string, region?: string) => Promise<void>;
  logout: () => void;
  fetchMe: () => Promise<void>;
  setUser: (user: User) => void;
  showUpgradeModal: boolean;
  setShowUpgradeModal: (show: boolean) => void;
  toggleDarkMode: () => void;
  initTheme: () => void;
  notes: Note[];
  addNote: (note: Omit<Note, 'id' | 'createdAt'>) => void;
  deleteNote: (id: string) => void;
  transmuteNote: (id: string, deckTitle: string) => Promise<void>;
  aiUsage: { used: number; limit: number };
  setUsage: (used: number, limit: number) => void;
  setNotes: (notes: Note[]) => void;
  theme: 'classic' | 'matcha' | 'navy';
  setTheme: (theme: 'classic' | 'matcha' | 'navy') => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: typeof window !== 'undefined' ? localStorage.getItem('token') : null,
  isLoading: false,
  isAuthenticated: false,
  darkMode: false,
  showUpgradeModal: false,
  aiUsage: { used: 0, limit: 10 },
  theme: (typeof window !== 'undefined' ? (localStorage.getItem('app_theme') as 'classic' | 'matcha' | 'navy') : null) || 'matcha',
  setShowUpgradeModal: (show) => set({ showUpgradeModal: show }),

  initTheme: () => {
    if (typeof window === 'undefined') return;
    
    // Dark / light mode
    const savedDark = localStorage.getItem('dark_mode');
    const isDark = savedDark === null ? true : savedDark === 'true';
    if (isDark) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }

    // App theme
    const savedTheme = (localStorage.getItem('app_theme') as 'classic' | 'matcha' | 'navy') || 'matcha';
    document.documentElement.setAttribute('data-theme', savedTheme);

    set({ darkMode: isDark, theme: savedTheme });
  },

  toggleDarkMode: () => {
    const next = !get().darkMode;
    if (typeof window !== 'undefined') {
      localStorage.setItem('dark_mode', String(next));
      if (next) {
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
      } else {
        document.documentElement.classList.add('light');
        document.documentElement.classList.remove('dark');
      }
    }
    set({ darkMode: next });
  },

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const res = await authApi.login({ email, password });
      const { token, user } = res.data;
      localStorage.setItem('token', token);
      set({ token, user, isAuthenticated: true, isLoading: false });
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  devLogin: async () => {
    set({ isLoading: true });
    try {
      const res = await authApi.devLogin();
      const { token, user } = res.data;
      localStorage.setItem('token', token);
      set({ token, user, isAuthenticated: true, isLoading: false });
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  register: async (username, email, password, region) => {
    set({ isLoading: true });
    try {
      const res = await authApi.register({ username, email, password, region });
      const { token, user } = res.data;
      localStorage.setItem('token', token);
      set({ token, user, isAuthenticated: true, isLoading: false });
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null, isAuthenticated: false });
    window.location.href = '/login';
  },

  fetchMe: async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) return;
    try {
      const res = await authApi.me();
      set({ user: res.data.user, isAuthenticated: true });
    } catch {
      localStorage.removeItem('token');
      set({ user: null, token: null, isAuthenticated: false });
    }
  },

  notes: typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('brain_notes') || '[]') : [],

  addNote: (noteData) => {
    const newNote: Note = {
      ...noteData,
      id: Math.random().toString(36).substring(7),
      createdAt: new Date().toISOString(),
    };
    const nextNotes = [newNote, ...get().notes];
    if (typeof window !== 'undefined') {
      localStorage.setItem('brain_notes', JSON.stringify(nextNotes));
    }
    set({ notes: nextNotes });
  },

  deleteNote: (id) => {
    const nextNotes = get().notes.filter(n => n.id !== id);
    if (typeof window !== 'undefined') {
      localStorage.setItem('brain_notes', JSON.stringify(nextNotes));
    }
    set({ notes: nextNotes });
  },

  transmuteNote: async (id, deckTitle) => {
    const note = get().notes.find(n => n.id === id);
    if (!note) return;

    try {
      // Real transmutation logic
      await flashcardApi.generateFromNotes({ 
        notes: note.content, 
        title: deckTitle || note.title 
      });
      get().deleteNote(id);
    } catch (err) {
      console.error('Transmutation failed:', err);
      throw err;
    }
  },
  setUsage: (used, limit) => set((state) => ({ 
    aiUsage: { used, limit },
    user: state.user ? { ...state.user, ai_calls_today: used } : null
  })),
  setNotes: (notes) => set({ notes }),
  setUser: (user) => set({ user }),
  setTheme: (theme) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('app_theme', theme);
      document.documentElement.setAttribute('data-theme', theme);
    }
    set({ theme });
  },
}));

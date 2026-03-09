import { create } from 'zustand';
import { authApi } from '@/lib/api';

interface User {
  id: string;
  username: string;
  email: string;
  xp: number;
  streak: number;
  role: string;
  avatar_url?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  fetchMe: () => Promise<void>;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: typeof window !== 'undefined' ? localStorage.getItem('token') : null,
  isLoading: false,
  isAuthenticated: false,

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

  register: async (username, email, password) => {
    set({ isLoading: true });
    try {
      const res = await authApi.register({ username, email, password });
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
    window.location.href = '/';
  },

  fetchMe: async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await authApi.me();
      set({ user: res.data.user, isAuthenticated: true });
    } catch {
      localStorage.removeItem('token');
      set({ user: null, token: null, isAuthenticated: false });
    }
  },

  setUser: (user) => set({ user }),
}));

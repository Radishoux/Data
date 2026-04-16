import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, Answer } from '../types';
import { usersAPI } from '../services/api';

interface AppState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean; // true while checking stored token on app start
  answers: Answer[];
  setUser: (user: User) => void;
  setToken: (token: string) => void;
  setAuthenticated: (val: boolean) => void;
  setLoading: (val: boolean) => void;
  addAnswer: (answer: Answer) => void;
  logout: () => Promise<void>;
  // initAuth: called on app start, checks AsyncStorage for token
  initAuth: () => Promise<void>;
}

export const useStore = create<AppState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  answers: [],

  setUser: (user: User) => set({ user }),
  setToken: (token: string) => set({ token }),
  setAuthenticated: (val: boolean) => set({ isAuthenticated: val }),
  setLoading: (val: boolean) => set({ isLoading: val }),
  addAnswer: (answer: Answer) =>
    set((state) => ({ answers: [...state.answers, answer] })),

  logout: async () => {
    await AsyncStorage.removeItem('auth_token');
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      answers: [],
    });
  },

  initAuth: async () => {
    set({ isLoading: true });
    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (token) {
        try {
          const response = await usersAPI.getMe();
          set({
            user: response.data,
            token,
            isAuthenticated: true,
          });
        } catch (error: any) {
          // If 401, token is invalid — clear it
          if (error.response?.status === 401) {
            await AsyncStorage.removeItem('auth_token');
          }
        }
      }
    } catch (_) {
      // AsyncStorage read failed — proceed as unauthenticated
    } finally {
      set({ isLoading: false });
    }
  },
}));

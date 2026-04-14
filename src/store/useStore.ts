import { create } from 'zustand';
import { User, Answer } from '../types';

interface AppState {
  // User
  user: User | null;
  hasOnboarded: boolean;
  // Data
  answers: Answer[];
  // Actions
  setUser: (user: User) => void;
  setHasOnboarded: (val: boolean) => void;
  addAnswer: (answer: Answer) => void;
  logout: () => void;
}

export const useStore = create<AppState>((set) => ({
  // Mock initial state for development
  user: {
    id: 'me',
    nickname: 'You',
    avatarUri: undefined,
    createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
  },
  hasOnboarded: true, // set to true so we skip onboarding during dev
  answers: [
    {
      id: 'a1',
      userId: 'me',
      questionId: 'q_past1',
      content: 'Definitely Python — automation is magic.',
      answeredAt: new Date(Date.now() - 6 * 86400000).toISOString(),
    },
    {
      id: 'a2',
      userId: 'me',
      questionId: 'q_past2',
      content: 'Music, it brings people together in a way nothing else can.',
      answeredAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    },
    {
      id: 'a3',
      userId: 'me',
      questionId: 'q_past3',
      content: 'Sunrise coffee on my balcony. Simple but perfect.',
      answeredAt: new Date(Date.now() - 4 * 86400000).toISOString(),
    },
  ],

  // Actions
  setUser: (user: User) => set({ user }),
  setHasOnboarded: (val: boolean) => set({ hasOnboarded: val }),
  addAnswer: (answer: Answer) =>
    set((state) => ({ answers: [...state.answers, answer] })),
  logout: () =>
    set({
      user: null,
      hasOnboarded: false,
      answers: [],
    }),
}));

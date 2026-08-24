import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { del, get, set as setIdb } from 'idb-keyval';
import type { BackupData, Budgets, Card, Goal, Theme, Transaction } from '../types';

const STORAGE_KEY = 'meusgastinhos-storage';

const resilientStorage = {
  async getItem(name: string): Promise<string | null> {
    try {
      return (await get<string>(name)) ?? window.localStorage.getItem(name);
    } catch {
      return window.localStorage.getItem(name);
    }
  },
  async setItem(name: string, value: string): Promise<void> {
    try {
      await setIdb(name, value);
      window.localStorage.removeItem(name);
    } catch {
      window.localStorage.setItem(name, value);
    }
  },
  async removeItem(name: string): Promise<void> {
    try {
      await del(name);
    } finally {
      window.localStorage.removeItem(name);
    }
  },
};

export interface AppState {
  transactions: Transaction[];
  cards: Card[];
  goals: Goal[];
  budgets: Budgets;
  userName: string;
  theme: Theme;
  isPrivacyMode: boolean;
  currentDate: Date;
  hasHydrated: boolean;
  addTransactions: (transactions: Transaction[]) => void;
  deleteTransaction: (id: string) => void;
  updateTransaction: (id: string, updates: Partial<Transaction>) => void;
  addCard: (card: Card) => void;
  deleteCard: (id: string) => void;
  addGoal: (goal: Goal) => void;
  deleteGoal: (id: string) => void;
  updateGoal: (id: string, updates: Partial<Goal>) => void;
  setBudget: (category: string, amount: number) => void;
  setUserName: (name: string) => void;
  setTheme: (theme: Theme) => void;
  setIsPrivacyMode: (hidden: boolean) => void;
  setCurrentDate: (date: Date | ((previous: Date) => Date)) => void;
  replaceFromBackup: (data: BackupData) => void;
  clearAllData: () => void;
  setHasHydrated: (hydrated: boolean) => void;
}

const normalizePersistedState = (persisted: unknown): Partial<AppState> => {
  const data = (persisted ?? {}) as Partial<AppState>;
  return {
    ...data,
    transactions: Array.isArray(data.transactions) ? data.transactions : [],
    cards: Array.isArray(data.cards) ? data.cards : [],
    goals: Array.isArray(data.goals) ? data.goals : [],
    budgets: data.budgets && typeof data.budgets === 'object' ? data.budgets : {},
    userName: typeof data.userName === 'string' ? data.userName : '',
    theme: data.theme === 'light' ? 'light' : 'dark',
    isPrivacyMode: Boolean(data.isPrivacyMode),
  };
};

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      transactions: [],
      cards: [],
      goals: [],
      budgets: {},
      userName: '',
      theme: 'light',
      isPrivacyMode: false,
      currentDate: new Date(),
      hasHydrated: false,
      addTransactions: (transactions) =>
        set((state) => ({ transactions: [...state.transactions, ...transactions] })),
      deleteTransaction: (id) =>
        set((state) => ({ transactions: state.transactions.filter((item) => item.id !== id) })),
      updateTransaction: (id, updates) =>
        set((state) => ({
          transactions: state.transactions.map((item) => (item.id === id ? { ...item, ...updates } : item)),
        })),
      addCard: (card) => set((state) => ({ cards: [...state.cards, card] })),
      deleteCard: (id) => set((state) => ({ cards: state.cards.filter((card) => card.id !== id) })),
      addGoal: (goal) => set((state) => ({ goals: [...state.goals, goal] })),
      deleteGoal: (id) => set((state) => ({ goals: state.goals.filter((goal) => goal.id !== id) })),
      updateGoal: (id, updates) =>
        set((state) => ({ goals: state.goals.map((goal) => (goal.id === id ? { ...goal, ...updates } : goal)) })),
      setBudget: (category, amount) =>
        set((state) => {
          const budgets = { ...state.budgets };
          if (amount > 0) budgets[category] = amount;
          else delete budgets[category];
          return { budgets };
        }),
      setUserName: (userName) => set({ userName: userName.trim() }),
      setTheme: (theme) => set({ theme }),
      setIsPrivacyMode: (isPrivacyMode) => set({ isPrivacyMode }),
      setCurrentDate: (date) =>
        set((state) => ({ currentDate: typeof date === 'function' ? date(state.currentDate) : date })),
      replaceFromBackup: (data) =>
        set({
          transactions: data.transactions,
          cards: data.cards,
          goals: data.goals,
          budgets: data.budgets,
          userName: data.userName,
          theme: data.theme,
          isPrivacyMode: false,
          currentDate: new Date(),
        }),
      clearAllData: () =>
        set({
          transactions: [],
          cards: [],
          goals: [],
          budgets: {},
          userName: '',
          isPrivacyMode: false,
          currentDate: new Date(),
        }),
      setHasHydrated: (hasHydrated) => set({ hasHydrated }),
    }),
    {
      name: STORAGE_KEY,
      version: 3,
      storage: createJSONStorage(() => resilientStorage),
      migrate: (persistedState) => normalizePersistedState(persistedState),
      partialize: (state) => ({
        transactions: state.transactions,
        cards: state.cards,
        goals: state.goals,
        budgets: state.budgets,
        userName: state.userName,
        theme: state.theme,
        isPrivacyMode: state.isPrivacyMode,
      }),
      onRehydrateStorage: () => (state) => state?.setHasHydrated(true),
    },
  ),
);


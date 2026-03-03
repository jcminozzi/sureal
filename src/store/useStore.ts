import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { get, set, del } from 'idb-keyval';
import type { Transaction, Card, Goal } from '../types';

// Custom Storage adapter for Zustand to use IndexedDB
const idbStorage = {
    getItem: async (name: string): Promise<string | null> => {
        return (await get(name)) || null;
    },
    setItem: async (name: string, value: string): Promise<void> => {
        await set(name, value);
    },
    removeItem: async (name: string): Promise<void> => {
        await del(name);
    },
};

export interface AppState {
    transactions: Transaction[];
    cards: Card[];
    goals: Goal[];
    userName: string;
    theme: 'light' | 'dark';
    isPrivacyMode: boolean;

    // Actions
    addTransaction: (tx: Transaction) => void;
    deleteTransaction: (id: string) => void;
    updateTransaction: (id: string, updates: Partial<Transaction>) => void;
    deleteAllTransactions: () => void;

    addCard: (card: Card) => void;
    deleteCard: (id: string) => void;
    updateCard: (id: string, updates: Partial<Card>) => void;

    addGoal: (goal: Goal) => void;
    deleteGoal: (id: string) => void;
    updateGoal: (id: string, updates: Partial<Goal>) => void;

    setUserName: (name: string) => void;
    setTheme: (theme: 'light' | 'dark') => void;
    setIsPrivacyMode: (isPrivacyMode: boolean) => void;
}

export const useStore = create<AppState>()(
    persist(
        (set) => ({
            transactions: [],
            cards: [],
            goals: [],
            userName: 'Usuário',
            theme: 'dark',
            isPrivacyMode: false,

            // Transactions
            addTransaction: (tx) => set((state) => ({ transactions: [...state.transactions, tx] })),
            deleteTransaction: (id) => set((state) => ({ transactions: state.transactions.filter(t => t.id !== id) })),
            updateTransaction: (id, updates) => set((state) => ({
                transactions: state.transactions.map(t => t.id === id ? { ...t, ...updates } : t)
            })),
            deleteAllTransactions: () => set({ transactions: [] }),

            // Cards
            addCard: (card) => set((state) => ({ cards: [...state.cards, card] })),
            deleteCard: (id) => set((state) => ({ cards: state.cards.filter(c => c.id !== id) })),
            updateCard: (id, updates) => set((state) => ({
                cards: state.cards.map(c => c.id === id ? { ...c, ...updates } : c)
            })),

            // Goals
            addGoal: (goal) => set((state) => ({ goals: [...state.goals, goal] })),
            deleteGoal: (id) => set((state) => ({ goals: state.goals.filter(g => g.id !== id) })),
            updateGoal: (id, updates) => set((state) => ({
                goals: state.goals.map(g => g.id === id ? { ...g, ...updates } : g)
            })),

            // Options
            setUserName: (userName) => set({ userName }),
            setTheme: (theme) => set({ theme }),
            setIsPrivacyMode: (isPrivacyMode) => set({ isPrivacyMode }),
        }),
        {
            name: 'meusgastinhos-storage', // name of the item in the storage (must be unique)
            storage: createJSONStorage(() => idbStorage), // Use IndexedDB instead of localStorage
        }
    )
);

/**
 * 🎣 TIPOS PARA HOOKS
 */

import type { Dispatch, SetStateAction } from 'react';
import type { Transaction, Card, Goal, FinancialAnalytics, Insight } from './index';

// ============================================
// useOCR
// ============================================

export interface OCRState {
  isProcessing: boolean;
  progress: number;
  error: string | null;
}

export interface OCRResult {
  amount: number;
  merchant: string;
  date: string;
  category: string;
}

export interface UseOCRReturn extends OCRState {
  processImage: (file: File) => Promise<OCRResult | null>;
  reset: () => void;
}

// ============================================
// useVoiceInput
// ============================================

export interface VoiceState {
  isListening: boolean;
  transcript: string;
  error: string | null;
}

export interface ParsedVoiceCommand {
  amount: number;
  category: string;
  description: string;
  type: 'income' | 'expense';
  date?: string;
}

export interface UseVoiceInputReturn extends VoiceState {
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
  parseCommand: (text: string) => ParsedVoiceCommand | null;
}

// ============================================
// usePWAInstall
// ============================================

export interface PWAInstallState {
  canInstall: boolean;
  isInstalled: boolean;
  error: string | null;
}

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export interface UsePWAInstallReturn extends PWAInstallState {
  install: () => Promise<boolean>;
  dismiss: () => void;
}

// ============================================
// useApp
// ============================================

export interface UseAppReturn {
  transactions: Transaction[];
  cards: Card[];
  goals: Goal[];
  userName: string;
  currentDate: string;
  theme: 'light' | 'dark';
  isPrivacyMode: boolean;

  // Ações
  addTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  deleteTransaction: (id: string) => void;
  updateTransaction: (id: string, updates: Partial<Transaction>) => void;
  addCard: (card: Card) => void;
  deleteCard: (id: string) => void;
  addGoal: (goal: Omit<Goal, 'id'>) => void;
  updateGoal: (id: string, updates: Partial<Goal>) => void;
  setUserName: (name: string) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  togglePrivacyMode: () => void;
}

// ============================================
// useFinancialAnalytics
// ============================================

export interface TrendPoint {
  date: string;
  income: number;
  expense: number;
  balance: number;
}

export interface UseTrendAnalysisReturn {
  trend: TrendPoint[];
  average: {
    income: number;
    expense: number;
  };
  growth: {
    income: number;
    expense: number;
  };
}

export interface CategoryBreakdown {
  category: string;
  total: number;
  percentage: number;
  average: number;
  transaction_count: number;
}

export interface UseCategoryAnalysisReturn {
  categories: CategoryBreakdown[];
  topCategory: CategoryBreakdown | null;
  otherTotal: number;
}

export interface BudgetMetric {
  name: string;
  current: number;
  target: number;
  percentage: number;
  status: 'on-track' | 'warning' | 'exceeded';
}

export interface UseBudgetProgressReturn {
  budgets: BudgetMetric[];
  totalProgress: number;
  status: 'good' | 'warning' | 'critical';
}

export interface UseFinancialAnalyticsReturn {
  analytics: FinancialAnalytics;
  trends: UseTrendAnalysisReturn;
  categories: UseCategoryAnalysisReturn;
  budget: UseBudgetProgressReturn;
  insights: Insight[];
}

// ============================================
// USE PATTERNS
// ============================================

export type UseAsyncState<T> = {
  data: T | null;
  loading: boolean;
  error: Error | null;
};

export interface UseAsyncReturn<T> extends UseAsyncState<T> {
  refetch: () => Promise<void>;
}

export interface UseLocalStorageOptions {
  key: string;
  defaultValue?: any;
  onError?: (error: Error) => void;
}

export interface UseLocalStorageReturn<T> {
  value: T;
  setValue: (value: T | ((prev: T) => T)) => void;
  removeValue: () => void;
}

// ============================================
// FORM HOOKS
// ============================================

export interface FormFieldError {
  field: string;
  message: string;
}

export interface UseFormReturn<T> {
  values: T;
  errors: FormFieldError[];
  touched: Partial<Record<keyof T, boolean>>;
  isDirty: boolean;
  isValid: boolean;
  isSubmitting: boolean;

  setValue: <K extends keyof T>(field: K, value: T[K]) => void;
  setValues: (values: Partial<T>) => void;
  setFieldError: (field: string, error: string) => void;
  resetForm: () => void;
  handleSubmit: (callback: (values: T) => Promise<void>) => () => Promise<void>;
}

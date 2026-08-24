export type TransactionType = 'income' | 'expense';
export type TransactionStatus = 'paid' | 'pending';
export type Theme = 'light' | 'dark';

export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  status: TransactionStatus;
  description: string;
  categoryLabel: string;
  categoryIcon: string;
  date: string;
  cardId?: string;
  installment?: string;
  recurring?: boolean;
  recurringGroupId?: string;
  createdAt?: string;
}

export interface TransactionDraft {
  amount: number;
  type: TransactionType;
  status: TransactionStatus;
  description: string;
  categoryLabel: string;
  categoryIcon: string;
  date: string;
  cardId?: string;
  installments?: number;
  recurringMonths?: number;
}

export interface Card {
  id: string;
  bankName: string;
  bankId?: string;
  dueDay: string | number;
  gradient?: string;
  text?: string;
  color?: string;
  border?: string;
}

export interface Goal {
  id: string;
  name: string;
  target: number;
  current: number;
  emoji?: string;
}

export interface Category {
  id: string;
  icon: string;
  label: string;
  color: string;
  type?: TransactionType | 'both';
}

export type Budgets = Record<string, number>;

export interface FinancialSummary {
  income: number;
  expenses: number;
  payable: number;
  receivable: number;
  balance: number;
  projectedBalance: number;
}

export interface BackupData {
  app: 'meus-gastinhos';
  version: 3;
  exportedAt: string;
  transactions: Transaction[];
  cards: Card[];
  goals: Goal[];
  budgets: Budgets;
  userName: string;
  theme: Theme;
}


/**
 * 🔌 TIPOS PARA API E REQUISIÇÕES
 */

import type { Transaction, Card, Goal, BackupData } from './index';

// ============================================
// REQUISIÇÕES
// ============================================

export interface ApiRequest<T> {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  endpoint: string;
  body?: T;
  headers?: Record<string, string>;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

// ============================================
// AUTENTICAÇÃO
// ============================================

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: UserProfile;
  expiresIn: number;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  picture?: string;
  createdAt: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

// ============================================
// SINCRONIZAÇÃO
// ============================================

export interface SyncRequest {
  transactions: Transaction[];
  cards: Card[];
  goals: Goal[];
  lastSync: string;
}

export interface SyncResponse {
  success: boolean;
  transactions: Transaction[];
  cards: Card[];
  goals: Goal[];
  conflicts?: SyncConflict[];
}

export interface SyncConflict {
  id: string;
  type: 'transaction' | 'card' | 'goal';
  local: any;
  remote: any;
  resolution: 'local' | 'remote';
}

// ============================================
// TRANSAÇÕES ENDPOINTS
// ============================================

export interface CreateTransactionRequest {
  amount: number;
  type: 'income' | 'expense';
  status: 'paid' | 'pending';
  description: string;
  categoryLabel: string;
  categoryIcon: string;
  date: string;
  cardId?: string;
  installment?: string;
  recurring?: boolean;
}

export interface UpdateTransactionRequest extends Partial<CreateTransactionRequest> {}

export interface TransactionListParams {
  skip?: number;
  take?: number;
  type?: 'income' | 'expense';
  status?: 'paid' | 'pending';
  categoryLabel?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: 'date' | 'amount';
  order?: 'asc' | 'desc';
}

// ============================================
// CARTÕES ENDPOINTS
// ============================================

export interface CreateCardRequest {
  bankName: string;
  bankId: string;
  dueDay: string | number;
}

export interface UpdateCardRequest extends Partial<CreateCardRequest> {}

// ============================================
// METAS ENDPOINTS
// ============================================

export interface CreateGoalRequest {
  name: string;
  target: number;
  emoji?: string;
}

export interface UpdateGoalRequest extends Partial<CreateGoalRequest> {
  current?: number;
}

// ============================================
// RELATÓRIOS
// ============================================

export interface ReportRequest {
  startDate: string;
  endDate: string;
  groupBy?: 'category' | 'day' | 'week' | 'month';
  type?: 'income' | 'expense' | 'both';
}

export interface ReportResponse {
  summary: {
    totalIncome: number;
    totalExpense: number;
    balance: number;
    avgTransaction: number;
  };
  categories: Array<{
    name: string;
    total: number;
    percentage: number;
  }>;
  trend: Array<{
    period: string;
    income: number;
    expense: number;
  }>;
}

// ============================================
// EXPORTAÇÃO/IMPORTAÇÃO
// ============================================

export interface ExportRequest {
  format: 'json' | 'csv' | 'pdf';
  includeCards?: boolean;
  includeGoals?: boolean;
  dateRange?: {
    start: string;
    end: string;
  };
}

export interface ImportRequest {
  file: File;
  merge?: boolean;
}

export interface ImportResponse {
  imported: number;
  skipped: number;
  errors: Array<{
    row: number;
    error: string;
  }>;
}

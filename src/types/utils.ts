/**
 * 🔧 TIPOS PARA UTILITÁRIOS
 */

import type { Transaction, Card, Goal, ValidationResult } from './index';

// ============================================
// FINANCIAL UTILS
// ============================================

export interface CurrencyFormatOptions {
  locale?: string;
  currency?: string;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
  useGrouping?: boolean;
}

export interface TransactionValidationError {
  field: 'amount' | 'type' | 'category' | 'date' | 'description';
  message: string;
}

export interface CardValidationError {
  field: 'bankName' | 'dueDay';
  message: string;
}

export interface GoalValidationError {
  field: 'name' | 'target' | 'current';
  message: string;
}

// ============================================
// GROUPING & ANALYTICS
// ============================================

export interface TransactionGroup {
  key: string;
  transactions: Transaction[];
  total: number;
  count: number;
}

export interface GroupByDateResult {
  date: string;
  day: string;
  transactions: Transaction[];
  total: number;
}

export interface GroupByCategoryResult {
  category: string;
  icon: string;
  transactions: Transaction[];
  total: number;
  percentage: number;
}

export interface HealthScoreBreakdown {
  score: number;
  level: 'excellent' | 'good' | 'fair' | 'poor';
  factors: {
    savingsRate: number;
    categoryDiversity: number;
    recurringTransactions: number;
    consistency: number;
  };
  recommendations: string[];
}

// ============================================
// OCR PARSER
// ============================================

export interface OCRParseOptions {
  language?: string;
  confidence?: number;
  autoDetectCategory?: boolean;
}

export interface ParsedOCRData {
  amount: number;
  merchant: string;
  date: string;
  time?: string;
  category: string;
  description: string;
  confidence: number;
  raw: string;
}

export interface OCRExtractorResult {
  text: string;
  confidence: number;
  sections: {
    header?: string[];
    items?: OCRLineItem[];
    total?: string;
  };
}

export interface OCRLineItem {
  description: string;
  quantity: number;
  price: number;
}

// ============================================
// VOICE PARSER
// ============================================

export interface VoiceParseOptions {
  language?: string;
  timezone?: string;
  contextTransactions?: Transaction[];
}

export interface ParsedVoiceData {
  type: 'income' | 'expense' | 'goal' | 'unknown';
  amount?: number;
  category?: string;
  description?: string;
  date?: string;
  confidence: number;
  rawTranscript: string;
}

export interface VoiceCommandPattern {
  pattern: RegExp;
  extractor: (match: RegExpMatchArray) => Partial<ParsedVoiceData>;
}

// ============================================
// ENCRYPTION/BACKUP
// ============================================

export interface EncryptionOptions {
  algorithm?: 'base64' | 'aes' | 'chacha20';
  encoding?: 'utf8' | 'hex' | 'base64';
}

export interface BackupMetadata {
  version: string;
  createdAt: string;
  appVersion: string;
  dataCount: {
    transactions: number;
    cards: number;
    goals: number;
  };
  hash: string;
}

export interface CompressedBackup {
  metadata: BackupMetadata;
  data: string;
  compressed: boolean;
}

// ============================================
// PDF/EXPORT
// ============================================

export interface PDFReportOptions {
  title?: string;
  includeSummary?: boolean;
  includeCharts?: boolean;
  includeTransactionList?: boolean;
  orientation?: 'portrait' | 'landscape';
  pageSize?: 'A4' | 'letter' | 'A3';
}

export interface ExportTableRow {
  [key: string]: string | number | boolean;
}

export interface ExportOptions {
  filename?: string;
  format?: 'json' | 'csv' | 'xlsx' | 'pdf';
  prettify?: boolean;
  includeMetadata?: boolean;
}

// ============================================
// GAMIFICATION
// ============================================

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt?: string;
  progress?: number;
}

export interface AchievementCriteria {
  type: 'transaction_count' | 'total_saved' | 'consecutive_days' | 'category_master' | 'goal_complete';
  target: number;
  reward: number;
}

export interface LevelProgress {
  currentLevel: number;
  currentXP: number;
  nextLevelXP: number;
  progressPercent: number;
  milestone: string;
}

// ============================================
// DATA UTILITIES
// ============================================

export interface DataStats {
  transactions: {
    total: number;
    income: number;
    expense: number;
    pending: number;
    paid: number;
  };
  cards: {
    total: number;
    byBank: Record<string, number>;
  };
  goals: {
    total: number;
    completed: number;
    inProgress: number;
  };
  timespan: {
    firstTransaction?: string;
    lastTransaction?: string;
    daysOfData: number;
  };
}

export interface MockDataOptions {
  transactionCount?: number;
  cardCount?: number;
  goalCount?: number;
  dateRange?: {
    start: string;
    end: string;
  };
  seed?: number;
}

// ============================================
// STORAGE
// ============================================

export interface StorageItem<T> {
  key: string;
  value: T;
  expiresAt?: number;
  metadata?: {
    version: string;
    createdAt: string;
  };
}

export interface StorageEvent<T> {
  key: string;
  oldValue: T | null;
  newValue: T | null;
  timestamp: number;
}

export interface StorageOptions {
  prefix?: string;
  namespace?: string;
  ttl?: number;
  migrate?: boolean;
}

// ============================================
// VALIDATION UTILS
// ============================================

export interface ValidationOptions {
  strict?: boolean;
  sanitize?: boolean;
  normalize?: boolean;
}

export interface SanitizeOptions {
  allowedTags?: string[];
  allowedAttributes?: string[];
  stripScripts?: boolean;
}

export interface NormalizationRules {
  category?: (cat: string) => string;
  description?: (desc: string) => string;
  amount?: (amt: number) => number;
}

// ============================================
// DATE UTILITIES
// ============================================

export interface DateRangeOptions {
  locale?: string;
  weekStartsOn?: 0 | 1;
  firstWeekContainsDate?: number;
}

export interface DatePeriod {
  start: string;
  end: string;
  label: string;
  type: 'day' | 'week' | 'month' | 'quarter' | 'year' | 'custom';
}

export interface RecurringPattern {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number;
  endDate?: string;
  daysOfWeek?: number[];
  dayOfMonth?: number;
}

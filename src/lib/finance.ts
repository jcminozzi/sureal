import { addMonths, endOfMonth, isWithinInterval, parseISO, startOfMonth } from 'date-fns';
import type { BackupData, Card, FinancialSummary, Goal, Transaction, TransactionDraft } from '../types';

export const formatCurrency = (value: number, hidden = false): string => {
  if (hidden) return 'R$ ••••';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
};

export const parseMoneyInput = (value: string): number => {
  const cleaned = value.replace(/[^\d,.-]/g, '').trim();
  if (!cleaned) return 0;
  const normalized = cleaned.includes(',') ? cleaned.replace(/\./g, '').replace(',', '.') : cleaned;
  const amount = Number(normalized);
  return Number.isFinite(amount) ? Math.abs(amount) : 0;
};

export const toDateInput = (value: Date | string): string => {
  const date = typeof value === 'string' ? parseISO(value) : value;
  if (Number.isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const toLocalIso = (dateInput: string): string => `${dateInput}T12:00:00.000`;

export const isTransactionInMonth = (transaction: Transaction, month: Date): boolean => {
  try {
    return isWithinInterval(parseISO(transaction.date), {
      start: startOfMonth(month),
      end: endOfMonth(month),
    });
  } catch {
    return false;
  }
};

export const calculateSummary = (transactions: Transaction[]): FinancialSummary =>
  transactions.reduce<FinancialSummary>(
    (summary, transaction) => {
      const amount = Number(transaction.amount) || 0;
      if (transaction.type === 'income') {
        if (transaction.status === 'paid') summary.income += amount;
        else summary.receivable += amount;
      } else if (transaction.status === 'paid') {
        summary.expenses += amount;
      } else {
        summary.payable += amount;
      }
      summary.balance = summary.income - summary.expenses;
      summary.projectedBalance = summary.income + summary.receivable - summary.expenses - summary.payable;
      return summary;
    },
    { income: 0, expenses: 0, payable: 0, receivable: 0, balance: 0, projectedBalance: 0 },
  );

export const getCategorySpending = (transactions: Transaction[]): Record<string, number> =>
  transactions.reduce<Record<string, number>>((totals, transaction) => {
    if (transaction.type === 'expense') {
      totals[transaction.categoryLabel] = (totals[transaction.categoryLabel] ?? 0) + Number(transaction.amount || 0);
    }
    return totals;
  }, {});

const createId = (): string =>
  globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;

export const createTransactionSeries = (draft: TransactionDraft): Transaction[] => {
  const installments = Math.max(1, Math.min(48, Math.floor(draft.installments ?? 1)));
  const recurringMonths = installments > 1 ? 1 : Math.max(1, Math.min(24, Math.floor(draft.recurringMonths ?? 1)));
  const count = Math.max(installments, recurringMonths);
  const groupId = count > 1 ? createId() : undefined;
  const baseDate = parseISO(toLocalIso(draft.date));
  const totalCents = Math.round(draft.amount * 100);
  const baseInstallmentCents = Math.floor(totalCents / installments);
  const remainder = totalCents - baseInstallmentCents * installments;

  return Array.from({ length: count }, (_, index) => {
    const amount = installments > 1
      ? (baseInstallmentCents + (index < remainder ? 1 : 0)) / 100
      : draft.amount;
    return {
      id: createId(),
      amount,
      type: draft.type,
      status: index === 0 ? draft.status : 'pending',
      description: draft.description.trim() || draft.categoryLabel,
      categoryLabel: draft.categoryLabel,
      categoryIcon: draft.categoryIcon,
      date: addMonths(baseDate, index).toISOString(),
      cardId: draft.cardId || undefined,
      installment: installments > 1 ? `${index + 1}/${installments}` : undefined,
      recurring: recurringMonths > 1,
      recurringGroupId: groupId,
      createdAt: new Date().toISOString(),
    };
  });
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

export const parseBackup = (value: unknown): BackupData | null => {
  if (!isRecord(value) || !Array.isArray(value.transactions) || !Array.isArray(value.cards)) return null;
  const transactions = value.transactions.filter((item): item is Transaction => {
    if (!isRecord(item)) return false;
    return typeof item.id === 'string'
      && Number.isFinite(Number(item.amount))
      && (item.type === 'income' || item.type === 'expense')
      && typeof item.date === 'string';
  }).map((item) => ({
    ...item,
    amount: Number(item.amount),
    status: item.status === 'pending' ? 'pending' as const : 'paid' as const,
    description: String(item.description ?? ''),
    categoryLabel: String(item.categoryLabel ?? 'Outros gastos'),
    categoryIcon: String(item.categoryIcon ?? '📦'),
  }));
  const cards = value.cards.filter((item): item is Card => isRecord(item) && typeof item.id === 'string' && typeof item.bankName === 'string');
  const goals = Array.isArray(value.goals)
    ? value.goals.filter((item): item is Goal => isRecord(item) && typeof item.id === 'string' && typeof item.name === 'string')
    : [];
  const budgets = isRecord(value.budgets)
    ? Object.fromEntries(Object.entries(value.budgets).filter(([, amount]) => Number.isFinite(Number(amount))).map(([key, amount]) => [key, Number(amount)]))
    : {};
  return {
    app: 'meus-gastinhos',
    version: 3,
    exportedAt: typeof value.exportedAt === 'string'
      ? value.exportedAt
      : typeof value.exportDate === 'string' ? value.exportDate : new Date().toISOString(),
    transactions,
    cards,
    goals,
    budgets,
    userName: typeof value.userName === 'string' ? value.userName : '',
    theme: value.theme === 'dark' ? 'dark' : 'light',
  };
};

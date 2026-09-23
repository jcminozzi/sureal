import { format, subMonths } from 'date-fns';
import { calculateSummary, isTransactionInMonth } from './finance';
import type { Transaction } from '../types';

export function monthlyHistory(transactions: Transaction[], month: Date) {
  return Array.from({ length: 6 }, (_, index) => {
    const date = subMonths(month, 5 - index);
    const items = transactions.filter((item) => isTransactionInMonth(item, date));
    return { key: format(date, 'yyyy-MM'), date, count: items.length, ...calculateSummary(items) };
  });
}

export function categoryDistribution(transactions: Transaction[]) {
  const totals = new Map<string, number>();
  for (const item of transactions) {
    if (item.type === 'expense' && Number.isFinite(item.amount) && item.amount > 0) {
      totals.set(item.categoryLabel, (totals.get(item.categoryLabel) ?? 0) + item.amount);
    }
  }
  const sorted = [...totals].sort((a, b) => b[1] - a[1]);
  const total = sorted.reduce((sum, [, value]) => sum + value, 0);
  return sorted.map(([label, value]) => ({ label, value, share: total ? value / total : 0 }));
}

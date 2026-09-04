import { describe, expect, it } from 'vitest';
import { getDailyCashFlow, getUpcomingTransactions } from './dashboard';
import type { Transaction } from '../types';

const transaction = (id: string, date: string, overrides: Partial<Transaction> = {}): Transaction => ({
  id, date, status: 'pending', type: 'expense', amount: 100, description: 'Conta', categoryLabel: 'Moradia', categoryIcon: '', ...overrides,
});

describe('dashboard planning', () => {
  it('keeps overdue items from previous months and includes the next 30 days', () => {
    const items = [transaction('old', '2026-08-10T12:00:00'), transaction('next', '2026-10-04T00:00:00'),
      transaction('later', '2026-10-05T12:00:00'), transaction('paid', '2026-08-11T12:00:00', { status: 'paid' })];
    expect(getUpcomingTransactions(items, new Date(2026, 8, 4)).map((item) => item.id)).toEqual(['old', 'next']);
  });
  it('charts only realized activity for the selected month, with an initial zero', () => {
    const items = [transaction('income', '2026-02-02T12:00:00', { status: 'paid', type: 'income', amount: 1000 }),
      transaction('expense', '2026-02-03T12:00:00', { status: 'paid', amount: 125.5 }),
      transaction('pending', '2026-02-04T12:00:00'), transaction('outside', '2026-01-01T12:00:00', { status: 'paid' })];
    const result = getDailyCashFlow(items, new Date(2026, 1, 1));
    expect(result).toHaveLength(29);
    expect(result.slice(0, 5)).toEqual([0, 0, 1000, 874.5, 874.5]);
    expect(result[result.length - 1]).toBe(874.5);
  });
});

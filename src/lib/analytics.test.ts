import { describe, expect, it } from 'vitest';
import { categoryDistribution, monthlyHistory } from './analytics';
import type { Transaction } from '../types';
const item = (overrides: Partial<Transaction>): Transaction => ({ id: '1', date: '2026-01-05T12:00:00', amount: 100, type: 'expense', status: 'paid', categoryLabel: 'Casa', categoryIcon: '', description: 'Conta', ...overrides });
describe('financial analytics', () => {
  it('includes empty months across year boundaries without treating pending income as received', () => {
    const result = monthlyHistory([item({}), item({ type: 'income', amount: 500, status: 'pending' })], new Date(2026, 1, 1));
    expect(result.map((month) => month.key)).toEqual(['2025-09', '2025-10', '2025-11', '2025-12', '2026-01', '2026-02']);
    expect(result[4]).toMatchObject({ income: 0, expenses: 100, receivable: 500, count: 2 });
    expect(result[5].count).toBe(0);
  });
  it('includes pending expenses and excludes income and invalid amounts from distribution', () => {
    const result = categoryDistribution([item({}), item({ status: 'pending', amount: 300, categoryLabel: 'Comida' }), item({ type: 'income', amount: 1000 }), item({ amount: Infinity })]);
    expect(result).toEqual([{ label: 'Comida', value: 300, share: .75 }, { label: 'Casa', value: 100, share: .25 }]);
  });
});

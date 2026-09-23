import { describe, expect, it } from 'vitest';
import { actionFromToolCall, buildFinancialSnapshot, transactionFromAssistantAction, type FinancialAssistantInput } from './financialAssistant';
import type { Transaction } from '../types';

const transaction = (changes: Partial<Transaction> = {}): Transaction => ({
  id: 'tx-1', amount: 120, type: 'expense', status: 'paid', description: 'Supermercado',
  categoryLabel: 'Mercado', categoryIcon: '🛒', date: '2026-09-10T12:00:00.000', ...changes,
});

const input = (changes: Partial<FinancialAssistantInput> = {}): FinancialAssistantInput => ({
  transactions: [transaction()], budgets: { Mercado: 500 }, goals: [{ id: 'goal-1', name: 'Reserva', target: 1000, current: 200 }],
  currentDate: new Date('2026-09-15T12:00:00'), userName: 'João', ...changes,
});

describe('financial assistant', () => {
  it('builds a bounded, structured snapshot from local data', () => {
    const many = Array.from({ length: 100 }, (_, index) => transaction({ id: `tx-${index}`, description: `Item ${index}` }));
    const snapshot = buildFinancialSnapshot(input({ transactions: many }));
    expect(snapshot.selectedMonth.paidExpenses).toBe(12000);
    expect(snapshot.recentTransactions).toHaveLength(80);
    expect(snapshot.person).toBe('João');
    expect(snapshot.validCategories.some((item) => item.label === 'Mercado')).toBe(true);
  });

  it('normalizes a transaction action to a valid category and local transaction', () => {
    const action = actionFromToolCall('add_transaction', {
      amount: 49.9, type: 'expense', status: 'paid', description: 'Padaria', categoryLabel: 'Alimentação', date: '2026-09-23',
    }, input());
    expect(action?.type).toBe('add_transaction');
    if (!action || action.type !== 'add_transaction') throw new Error('Expected transaction action');
    const created = transactionFromAssistantAction(action);
    expect(created.amount).toBe(49.9);
    expect(created.categoryLabel).toBe('Alimentação');
    expect(created.date).toContain('2026-09-23');
  });

  it('rejects unsafe or nonexistent action targets', () => {
    expect(actionFromToolCall('set_budget', { categoryLabel: 'Categoria inventada', amount: 100 }, input())).toBeNull();
    expect(actionFromToolCall('add_goal_progress', { goalId: 'missing', amount: 100 }, input())).toBeNull();
    expect(actionFromToolCall('mark_transaction', { transactionId: 'missing', status: 'paid' }, input())).toBeNull();
  });
});

import { describe, expect, it } from 'vitest';
import { calculateSummary, createTransactionSeries, parseBackup, parseMoneyInput } from './finance';
import type { Transaction } from '../types';

const transaction = (overrides: Partial<Transaction>): Transaction => ({
  id: 'tx-1',
  amount: 100,
  type: 'expense',
  status: 'paid',
  description: 'Teste',
  categoryLabel: 'Mercado',
  categoryIcon: '🛒',
  date: '2026-08-20T12:00:00.000',
  ...overrides,
});

describe('parseMoneyInput', () => {
  it('entende valores no formato brasileiro', () => {
    expect(parseMoneyInput('R$ 1.234,56')).toBe(1234.56);
    expect(parseMoneyInput('98,10')).toBe(98.1);
  });
});

describe('calculateSummary', () => {
  it('separa valores realizados e pendentes', () => {
    const result = calculateSummary([
      transaction({ id: 'income', type: 'income', amount: 2500 }),
      transaction({ id: 'expense', amount: 600 }),
      transaction({ id: 'payable', amount: 300, status: 'pending' }),
      transaction({ id: 'receivable', type: 'income', amount: 200, status: 'pending' }),
    ]);
    expect(result).toEqual({
      income: 2500,
      expenses: 600,
      payable: 300,
      receivable: 200,
      balance: 1900,
      projectedBalance: 1800,
    });
  });
});

describe('createTransactionSeries', () => {
  it('divide o total sem perder centavos', () => {
    const result = createTransactionSeries({
      amount: 100,
      type: 'expense',
      status: 'pending',
      description: 'Compra',
      categoryLabel: 'Compras',
      categoryIcon: '🛍️',
      date: '2026-08-20',
      installments: 3,
    });
    expect(result).toHaveLength(3);
    expect(result.reduce((sum, item) => sum + item.amount, 0)).toBe(100);
    expect(result.map((item) => item.installment)).toEqual(['1/3', '2/3', '3/3']);
  });
});

describe('parseBackup', () => {
  it('aceita backups antigos e normaliza campos novos', () => {
    const result = parseBackup({
      transactions: [transaction({})],
      cards: [],
      exportDate: '2026-01-01T00:00:00.000Z',
    });
    expect(result?.version).toBe(3);
    expect(result?.goals).toEqual([]);
    expect(result?.budgets).toEqual({});
  });
});

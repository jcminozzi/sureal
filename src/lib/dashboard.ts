import { addDays, endOfDay, endOfMonth, parseISO, startOfDay } from 'date-fns';
import type { Transaction } from '../types';

export function getUpcomingTransactions(transactions: Transaction[], today: Date) {
  const until = endOfDay(addDays(startOfDay(today), 30));
  return transactions.filter((item) => item.status === 'pending' && parseISO(item.date) <= until)
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function getDailyCashFlow(transactions: Transaction[], month: Date) {
  const days = endOfMonth(month).getDate();
  const totals = Array.from({ length: days }, () => 0);
  for (const item of transactions) {
    const date = parseISO(item.date);
    if (item.status !== 'paid' || date.getMonth() !== month.getMonth() || date.getFullYear() !== month.getFullYear()) continue;
    totals[date.getDate() - 1] += item.type === 'income' ? item.amount : -item.amount;
  }
  let balance = 0;
  return [0, ...totals.map((amount) => { balance += amount; return Math.round(balance * 100) / 100; })];
}

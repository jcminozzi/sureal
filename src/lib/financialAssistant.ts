import { endOfMonth, format, isBefore, isValid, parseISO, startOfDay, startOfMonth } from 'date-fns';
import { CATEGORIES } from '../constants/categories';
import { calculateSummary, getCategorySpending, isTransactionInMonth, toLocalIso } from './finance';
import type { Budgets, Goal, Transaction, TransactionStatus, TransactionType } from '../types';

export type AssistantAction =
  | { id: string; type: 'add_transaction'; title: string; description: string; args: { amount: number; transactionType: TransactionType; status: TransactionStatus; description: string; categoryLabel: string; date: string } }
  | { id: string; type: 'set_budget'; title: string; description: string; args: { categoryLabel: string; amount: number } }
  | { id: string; type: 'create_goal'; title: string; description: string; args: { name: string; target: number } }
  | { id: string; type: 'add_goal_progress'; title: string; description: string; args: { goalId: string; amount: number } }
  | { id: string; type: 'mark_transaction'; title: string; description: string; args: { transactionId: string; status: TransactionStatus } };

export interface FinancialAssistantInput {
  transactions: Transaction[];
  budgets: Budgets;
  goals: Goal[];
  currentDate: Date;
  userName: string;
}

export interface FinancialInsight {
  tone: 'attention' | 'positive' | 'neutral';
  title: string;
  detail: string;
}

const money = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
const safeDate = (value: string) => {
  try { return format(parseISO(value), 'yyyy-MM-dd'); } catch { return value.slice(0, 10); }
};

export function buildFinancialSnapshot(input: FinancialAssistantInput) {
  const selected = input.transactions.filter((item) => isTransactionInMonth(item, input.currentDate));
  const summary = calculateSummary(selected);
  const categorySpending = getCategorySpending(selected);
  const monthStart = startOfMonth(input.currentDate);
  const monthEnd = endOfMonth(input.currentDate);
  const today = startOfDay(new Date());
  const overdue = input.transactions.filter((item) => {
    if (item.status !== 'pending') return false;
    try { return isBefore(parseISO(item.date), today); } catch { return false; }
  });
  const upcoming = input.transactions.filter((item) => {
    if (item.status !== 'pending') return false;
    try {
      const date = parseISO(item.date);
      return !isBefore(date, today) && isBefore(date, new Date(today.getTime() + 31 * 86400000));
    } catch { return false; }
  });
  const recent = [...input.transactions]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 80)
    .map((item) => ({
      id: item.id,
      date: safeDate(item.date),
      description: item.description,
      category: item.categoryLabel,
      amount: Number(item.amount.toFixed(2)),
      type: item.type,
      status: item.status,
      installment: item.installment,
    }));

  return {
    generatedAt: new Date().toISOString(),
    person: input.userName || 'pessoa usuária',
    selectedPeriod: { start: format(monthStart, 'yyyy-MM-dd'), end: format(monthEnd, 'yyyy-MM-dd') },
    selectedMonth: {
      receivedIncome: summary.income,
      paidExpenses: summary.expenses,
      receivable: summary.receivable,
      payable: summary.payable,
      confirmedBalance: summary.balance,
      projectedBalance: summary.projectedBalance,
      expensesByCategory: categorySpending,
    },
    budgets: input.budgets,
    goals: input.goals.map((goal) => ({ id: goal.id, name: goal.name, target: goal.target, current: goal.current })),
    overdue: overdue.slice(0, 25).map((item) => ({ id: item.id, date: safeDate(item.date), description: item.description, amount: item.amount, type: item.type })),
    next30Days: upcoming.slice(0, 25).map((item) => ({ id: item.id, date: safeDate(item.date), description: item.description, amount: item.amount, type: item.type })),
    recentTransactions: recent,
    validCategories: CATEGORIES.map((category) => ({ label: category.label, type: category.type })),
  };
}

export function deriveFinancialInsights(input: FinancialAssistantInput): FinancialInsight[] {
  const selected = input.transactions.filter((item) => isTransactionInMonth(item, input.currentDate));
  const summary = calculateSummary(selected);
  const spending = getCategorySpending(selected);
  const insights: FinancialInsight[] = [];
  const overdueCount = input.transactions.filter((item) => {
    if (item.status !== 'pending') return false;
    try { return isBefore(parseISO(item.date), startOfDay(new Date())); } catch { return false; }
  }).length;

  if (overdueCount > 0) insights.push({
    tone: 'attention',
    title: `${overdueCount} ${overdueCount === 1 ? 'pendência atrasada' : 'pendências atrasadas'}`,
    detail: 'Vale resolver ou reagendar antes de assumir novos compromissos.',
  });

  const exceeded = Object.entries(input.budgets)
    .map(([category, limit]) => ({ category, limit, spent: spending[category] ?? 0 }))
    .filter((item) => item.limit > 0 && item.spent > item.limit)
    .sort((a, b) => (b.spent - b.limit) - (a.spent - a.limit))[0];
  if (exceeded) insights.push({
    tone: 'attention',
    title: `${exceeded.category} passou do limite`,
    detail: `${money(exceeded.spent - exceeded.limit)} acima do planejado neste mês.`,
  });

  const topCategory = Object.entries(spending).sort((a, b) => b[1] - a[1])[0];
  if (topCategory) insights.push({
    tone: 'neutral',
    title: `${topCategory[0]} lidera seus gastos`,
    detail: `${money(topCategory[1])} comprometidos no mês selecionado.`,
  });

  if (selected.length > 0 && summary.projectedBalance >= 0) insights.push({
    tone: 'positive',
    title: `Projeção positiva de ${money(summary.projectedBalance)}`,
    detail: 'O cálculo considera entradas e saídas pendentes deste mês.',
  });
  if (selected.length > 0 && summary.projectedBalance < 0) insights.push({
    tone: 'attention',
    title: `Projeção negativa de ${money(Math.abs(summary.projectedBalance))}`,
    detail: 'A IA pode ajudar a montar um plano para reduzir esse desvio.',
  });

  if (insights.length === 0) insights.push({
    tone: 'neutral',
    title: 'Ainda preciso de movimentações',
    detail: 'Importe um extrato ou registre alguns lançamentos para receber análises úteis.',
  });
  return insights.slice(0, 3);
}

const id = () => globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
const asObject = (value: unknown): Record<string, unknown> => value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
const amount = (value: unknown) => typeof value === 'number' && Number.isFinite(value) && value > 0 && value <= 1_000_000_000 ? Math.round(value * 100) / 100 : 0;
const text = (value: unknown) => String(value ?? '').trim();

export function actionFromToolCall(name: string, rawArgs: unknown, input: FinancialAssistantInput): AssistantAction | null {
  const args = asObject(rawArgs);
  if (name === 'add_transaction') {
    if (!['income', 'expense'].includes(text(args.type)) || !['paid', 'pending'].includes(text(args.status))) return null;
    const transactionType = args.type === 'income' ? 'income' : 'expense';
    const valid = CATEGORIES.filter((category) => category.type === transactionType);
    const requested = text(args.categoryLabel);
    const category = valid.find((item) => item.label.toLocaleLowerCase('pt-BR') === requested.toLocaleLowerCase('pt-BR')) ?? valid[valid.length - 1];
    const value = amount(args.amount);
    if (!category || value <= 0) return null;
    const date = text(args.date);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !isValid(parseISO(date))) return null;
    const description = text(args.description) || category.label;
    const status: TransactionStatus = args.status === 'pending' ? 'pending' : 'paid';
    return {
      id: id(), type: 'add_transaction', title: transactionType === 'income' ? 'Adicionar entrada' : 'Adicionar despesa',
      description: `${description} · ${money(value)} · ${category.label} · ${format(parseISO(date), 'dd/MM/yyyy')} · ${status === 'paid' ? 'Confirmado' : 'Pendente'}`,
      args: { amount: value, transactionType, status, description, categoryLabel: category.label, date },
    };
  }
  if (name === 'set_budget') {
    const category = CATEGORIES.find((item) => item.type === 'expense' && item.label.toLocaleLowerCase('pt-BR') === text(args.categoryLabel).toLocaleLowerCase('pt-BR'));
    const value = amount(args.amount);
    if (!category || value <= 0) return null;
    return { id: id(), type: 'set_budget', title: 'Definir limite mensal', description: `${category.label} · ${money(value)}`, args: { categoryLabel: category.label, amount: value } };
  }
  if (name === 'create_goal') {
    const nameValue = text(args.name).slice(0, 80); const target = amount(args.target);
    if (!nameValue || target <= 0) return null;
    return { id: id(), type: 'create_goal', title: 'Criar meta', description: `${nameValue} · ${money(target)}`, args: { name: nameValue, target } };
  }
  if (name === 'add_goal_progress') {
    const goal = input.goals.find((item) => item.id === text(args.goalId)); const value = amount(args.amount);
    if (!goal || value <= 0) return null;
    return { id: id(), type: 'add_goal_progress', title: 'Atualizar meta', description: `${goal.name} · +${money(value)}`, args: { goalId: goal.id, amount: value } };
  }
  if (name === 'mark_transaction') {
    if (!['paid', 'pending'].includes(text(args.status))) return null;
    const transaction = input.transactions.find((item) => item.id === text(args.transactionId));
    if (!transaction) return null;
    const status: TransactionStatus = args.status === 'pending' ? 'pending' : 'paid';
    return { id: id(), type: 'mark_transaction', title: status === 'paid' ? 'Confirmar pagamento' : 'Marcar como pendente', description: transaction.description, args: { transactionId: transaction.id, status } };
  }
  return null;
}

export function transactionFromAssistantAction(action: Extract<AssistantAction, { type: 'add_transaction' }>): Transaction {
  const category = CATEGORIES.find((item) => item.label === action.args.categoryLabel) ?? CATEGORIES[CATEGORIES.length - 1];
  return {
    id: id(), amount: action.args.amount, type: action.args.transactionType, status: action.args.status,
    description: action.args.description, categoryLabel: category.label, categoryIcon: category.icon,
    date: toLocalIso(action.args.date), createdAt: new Date().toISOString(),
  };
}

import type { Category } from '../types';

export const CATEGORIES: Category[] = [
  { id: 'market', icon: '🛒', label: 'Mercado', color: '#d88432', type: 'expense' },
  { id: 'food', icon: '🍽️', label: 'Alimentação', color: '#d85b57', type: 'expense' },
  { id: 'transport', icon: '🚗', label: 'Transporte', color: '#4f7cac', type: 'expense' },
  { id: 'home', icon: '🏠', label: 'Moradia', color: '#8266a8', type: 'expense' },
  { id: 'leisure', icon: '🎉', label: 'Lazer', color: '#c45f87', type: 'expense' },
  { id: 'health', icon: '💊', label: 'Saúde', color: '#3b8d7a', type: 'expense' },
  { id: 'education', icon: '📚', label: 'Educação', color: '#667bb6', type: 'expense' },
  { id: 'services', icon: '💡', label: 'Contas e serviços', color: '#4f91a1', type: 'expense' },
  { id: 'shopping', icon: '🛍️', label: 'Compras', color: '#b76f53', type: 'expense' },
  { id: 'other-expense', icon: '📦', label: 'Outros gastos', color: '#7a837e', type: 'expense' },
  { id: 'salary', icon: '💰', label: 'Salário', color: '#2f806c', type: 'income' },
  { id: 'freelance', icon: '💻', label: 'Renda extra', color: '#477f71', type: 'income' },
  { id: 'investment', icon: '📈', label: 'Rendimentos', color: '#5d7293', type: 'income' },
  { id: 'other-income', icon: '✨', label: 'Outras entradas', color: '#6f7f53', type: 'income' },
];

export const EXPENSE_CATEGORIES = CATEGORIES.filter((category) => category.type === 'expense');
export const INCOME_CATEGORIES = CATEGORIES.filter((category) => category.type === 'income');

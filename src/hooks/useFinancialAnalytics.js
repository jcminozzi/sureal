import React, { useMemo } from 'react';
import { calculateHealthScore, calculateSavingsRate, groupTransactionsByCategory } from '../utils/financial';

export function useFinancialAnalytics(transactions, income, expenses, balance) {
  return useMemo(() => {
    const healthScore = calculateHealthScore(income, expenses);
    const savingsRate = calculateSavingsRate(income, expenses);
    const expenseTransactions = transactions.filter(t => t.type === 'expense');
    const categoryDistribution = groupTransactionsByCategory(expenseTransactions);
    
    // Calcular maior gasto
    const topExpense = transactions
      .filter(t => t.type === 'expense')
      .reduce((max, t) => parseFloat(t.amount) > max ? parseFloat(t.amount) : max, 0);
    
    // Calcular média de transações
    const avgTransaction = transactions.length > 0 
      ? transactions.reduce((sum, t) => sum + parseFloat(t.amount), 0) / transactions.length 
      : 0;
    
    // Categoria com maior gasto
    const topCategory = categoryDistribution[0] || null;
    
    // Tendências
    const incomeTransactions = transactions.filter(t => t.type === 'income');
    const recurringExpenses = transactions.filter(t => t.type === 'expense' && t.recurring);
    
    const insights = [];
    
    if (healthScore >= 80) {
      insights.push({
        type: 'success',
        title: 'Saúde Financeira Excelente',
        message: `Você mantém ${healthScore}% de sua renda após despesas. Continue assim!`
      });
    } else if (healthScore >= 50) {
      insights.push({
        type: 'info',
        title: 'Saúde Financeira Boa',
        message: `Você economiza ${healthScore}% da sua renda. Bom trabalho!`
      });
    } else if (healthScore >= 20) {
      insights.push({
        type: 'warning',
        title: 'Saúde Financeira Preocupante',
        message: `Você economiza apenas ${healthScore}% da sua renda. Considere reduzir despesas.`
      });
    } else {
      insights.push({
        type: 'error',
        title: 'Alerta Financeiro',
        message: `Você está gastando mais do que ganha. Revise suas despesas urgentemente.`
      });
    }
    
    if (topCategory && topCategory.total > income * 0.4) {
      insights.push({
        type: 'warning',
        title: `${topCategory.label} é alta`,
        message: `${topCategory.label} representa ${Math.round((topCategory.total / income) * 100)}% de sua renda.`
      });
    }
    
    if (recurringExpenses.length > 5) {
      insights.push({
        type: 'info',
        title: 'Muitas Despesas Fixas',
        message: `Você tem ${recurringExpenses.length} despesas recorrentes. Mantenha-as sob controle.`
      });
    }

    return {
      healthScore,
      savingsRate,
      categoryDistribution,
      topExpense,
      avgTransaction,
      topCategory,
      recurringExpensesCount: recurringExpenses.length,
      insights
    };
  }, [transactions, income, expenses, balance]);
}

export function useTrendAnalysis(transactions, months = 3) {
  return useMemo(() => {
    const now = new Date();
    const data = [];
    
    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStart = date;
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      
      const monthTransactions = transactions.filter(t => {
        const tDate = new Date(t.date);
        return tDate >= monthStart && tDate <= monthEnd;
      });
      
      const monthIncome = monthTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);
      
      const monthExpense = monthTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);
      
      data.push({
        month: `${date.getMonth() + 1}/${date.getFullYear().toString().slice(-2)}`,
        income: monthIncome,
        expense: monthExpense,
        balance: monthIncome - monthExpense
      });
    }
    
    return data;
  }, [transactions, months]);
}

export function useCategoryAnalysis(transactions) {
  return useMemo(() => {
    const expenseTransactions = transactions.filter(t => t.type === 'expense');
    const categories = groupTransactionsByCategory(expenseTransactions);
    
    return {
      categories,
      total: categories.reduce((sum, cat) => sum + cat.total, 0),
      count: expenseTransactions.length,
      average: expenseTransactions.length > 0 
        ? categories.reduce((sum, cat) => sum + cat.total, 0) / expenseTransactions.length 
        : 0
    };
  }, [transactions]);
}

export function useBudgetProgress(goals, transactions) {
  return useMemo(() => {
    return goals.map(goal => {
      const progress = Math.min(100, (goal.current / goal.target) * 100);
      const remaining = goal.target - goal.current;
      const isCompleted = goal.current >= goal.target;
      
      return {
        ...goal,
        progress,
        remaining,
        isCompleted,
        percentageText: `${Math.round(progress)}%`
      };
    });
  }, [goals, transactions]);
}

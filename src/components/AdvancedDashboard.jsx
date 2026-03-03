import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, TrendingDown, Target, 
  Calendar, MoreHorizontal, Filter 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  LineChart, Line, BarChart, Bar, 
  XAxis, YAxis, Tooltip, ResponsiveContainer,
  Area, AreaChart, Legend, CartesianGrid
} from 'recharts';
import { useApp } from '../hooks/useApp';
import { useFinancialAnalytics, useTrendAnalysis } from '../hooks/useFinancialAnalytics';
import { formatCurrency } from '../utils/financial';
import { StatCard, MetricCard } from '../components/CommonComponents';

export function AdvancedDashboard() {
  const { transactions, income, expenses, balance, categoryData } = useApp();
  const [selectedPeriod, setSelectedPeriod] = useState(3); // meses
  const [filterCategory, setFilterCategory] = useState(null);

  const analytics = useFinancialAnalytics(transactions, income, expenses, balance);
  const trendData = useTrendAnalysis(transactions, selectedPeriod);

  // Calcular dados por dia para o gráfico
  const dailyData = useMemo(() => {
    const data = {};
    transactions.forEach(t => {
      const day = t.date.split('T')[0];
      if (!data[day]) {
        data[day] = { date: day, income: 0, expense: 0 };
      }
      if (t.type === 'income') {
        data[day].income += parseFloat(t.amount);
      } else {
        data[day].expense += parseFloat(t.amount);
      }
    });
    return Object.values(data)
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(-30);
  }, [transactions]);

  // Comparação com período anterior
  const comparison = useMemo(() => {
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    const currentData = transactions.filter(t => {
      const date = new Date(t.date);
      return date >= currentMonthStart;
    });

    const previousData = transactions.filter(t => {
      const date = new Date(t.date);
      return date >= previousMonthStart && date <= previousMonthEnd;
    });

    const currentExpense = currentData
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const previousExpense = previousData
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const trend = previousExpense > 0 
      ? Math.round(((currentExpense - previousExpense) / previousExpense) * 100)
      : 0;

    return {
      currentExpense,
      previousExpense,
      trend
    };
  }, [transactions]);

  return (
    <div className="min-h-screen bg-slate-900 p-8 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Dashboard Financeiro</h1>
          <p className="text-slate-400">Análise completa de suas finanças</p>
        </div>
        <div className="flex gap-2">
          <button className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
            <Filter size={20} className="text-slate-400" />
          </button>
          <button className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
            <MoreHorizontal size={20} className="text-slate-400" />
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-6">
        <StatCard
          label="Saldo Total"
          value={balance}
          icon={TrendingUp}
          color="#8b5cf6"
          sub="Disponível"
        />
        <StatCard
          label="Receita do Mês"
          value={income}
          icon={TrendingUp}
          color="#10b981"
          sub="Entradas"
        />
        <StatCard
          label="Despesa do Mês"
          value={expenses}
          icon={TrendingDown}
          color="#ef4444"
          sub="Saídas"
        />
        <StatCard
          label="Economia"
          value={income - expenses}
          icon={Target}
          color="#3b82f6"
          sub={`${analytics.healthScore}% saudável`}
        />
      </div>

      {/* Comparação com período anterior */}
      <div className="grid grid-cols-3 gap-6">
        <MetricCard
          title="Despesa Este Mês"
          value={formatCurrency(comparison.currentExpense)}
          icon={TrendingDown}
          color="#ef4444"
          trend={comparison.trend}
        />
        <MetricCard
          title="Taxa de Poupança"
          value={`${analytics.savingsRate}%`}
          icon={Target}
          color="#8b5cf6"
        />
        <MetricCard
          title="Transações"
          value={transactions.length}
          icon={Calendar}
          color="#3b82f6"
        />
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-2 gap-6">
        {/* Gráfico de Tendência */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-800 p-6 rounded-2xl border border-slate-700"
        >
          <h3 className="text-lg font-bold text-white mb-4">Tendência {selectedPeriod} Meses</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
              <XAxis dataKey="month" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip
                contentStyle={{
                  background: '#1e293b',
                  border: '1px solid #475569',
                  borderRadius: '8px'
                }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="income" 
                stroke="#10b981" 
                name="Receita"
                strokeWidth={2}
              />
              <Line 
                type="monotone" 
                dataKey="expense" 
                stroke="#ef4444" 
                name="Despesa"
                strokeWidth={2}
              />
              <Line 
                type="monotone" 
                dataKey="balance" 
                stroke="#8b5cf6" 
                name="Saldo"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Gráfico Diário */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-800 p-6 rounded-2xl border border-slate-700"
        >
          <h3 className="text-lg font-bold text-white mb-4">Últimos 30 Dias</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
              <XAxis dataKey="date" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip
                contentStyle={{
                  background: '#1e293b',
                  border: '1px solid #475569',
                  borderRadius: '8px'
                }}
              />
              <Area 
                type="monotone" 
                dataKey="income" 
                stackId="1" 
                stroke="#10b981" 
                fill="#10b981" 
                fillOpacity={0.3}
              />
              <Area 
                type="monotone" 
                dataKey="expense" 
                stackId="1" 
                stroke="#ef4444" 
                fill="#ef4444" 
                fillOpacity={0.3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Categorias com Breakdown */}
      <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
        <h3 className="text-lg font-bold text-white mb-4">Gastos por Categoria</h3>
        <div className="grid grid-cols-3 gap-4">
          {categoryData
            .sort((a, b) => b.value - a.value)
            .slice(0, 6)
            .map((cat) => {
              const percentage = (cat.value / expenses) * 100;
              return (
                <motion.div
                  key={cat.name}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-slate-700/50 p-4 rounded-xl hover:border-violet-500/50 border border-transparent transition-colors"
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-white">{cat.name}</span>
                    <span className="text-xs font-bold text-slate-400">{Math.round(percentage)}%</span>
                  </div>
                  <div className="h-2 bg-slate-600 rounded-full overflow-hidden mb-2">
                    <div
                      className="h-full transition-all duration-500"
                      style={{ width: `${percentage}%`, backgroundColor: cat.color }}
                    />
                  </div>
                  <div className="text-sm font-bold text-white">
                    {formatCurrency(cat.value)}
                  </div>
                </motion.div>
              );
            })}
        </div>
      </div>

      {/* Insights */}
      {analytics.insights.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-bold text-white">Insights Inteligentes</h3>
          <AnimatePresence>
            {analytics.insights.map((insight, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className={`p-4 rounded-xl border ${
                  insight.type === 'success' 
                    ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-300'
                    : insight.type === 'warning'
                    ? 'bg-amber-500/10 border-amber-500/50 text-amber-300'
                    : insight.type === 'error'
                    ? 'bg-red-500/10 border-red-500/50 text-red-300'
                    : 'bg-blue-500/10 border-blue-500/50 text-blue-300'
                }`}
              >
                <div className="font-bold mb-1">{insight.title}</div>
                <div className="text-sm">{insight.message}</div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

export default AdvancedDashboard;

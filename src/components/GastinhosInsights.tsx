import React, { useMemo } from 'react';
import { TrendingUp, TrendingDown, AlertCircle, Lightbulb, ArrowRight, Zap } from 'lucide-react';
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Transaction } from '../types';

interface GastinhosInsightsProps {
    transactions: Transaction[];
    currentDate: Date;
    income: number;
    expenses: number;
}

export function GastinhosInsights({ transactions, currentDate, income, expenses }: GastinhosInsightsProps) {
    const isPrivacyMode = false; // Add to props if needed, or get from store
    const formatMoney = (v: number) => isPrivacyMode ? '****' : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

    const insights = useMemo(() => {
        const generatedInsights = [];

        // 1. Comparação Mensal
        const lastMonthDate = subMonths(currentDate, 1);
        const lastMonthStart = startOfMonth(lastMonthDate);
        const lastMonthEnd = endOfMonth(lastMonthDate);

        const lastMonthTransactions = transactions.filter(t =>
            isWithinInterval(new Date(t.date), { start: lastMonthStart, end: lastMonthEnd })
        );

        const lastMonthIncome = lastMonthTransactions.filter(t => t.type === 'income').reduce((acc, t) => acc + Number(t.amount), 0);
        const lastMonthExpenses = lastMonthTransactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + Number(t.amount), 0);

        // Despesas vs Mês Anterior
        if (lastMonthExpenses > 0) {
            const expenseDiff = ((expenses - lastMonthExpenses) / lastMonthExpenses) * 100;
            if (expenseDiff > 10) {
                generatedInsights.push({
                    id: 'expense-up',
                    type: 'warning',
                    icon: <TrendingDown size={20} className="text-red-400" />,
                    title: 'Atenção aos Gastos',
                    message: `Suas despesas aumentaram ${Math.round(expenseDiff)}% em relação ao mês anterior.`
                });
            } else if (expenseDiff < -10) {
                generatedInsights.push({
                    id: 'expense-down',
                    type: 'success',
                    icon: <TrendingUp size={20} className="text-emerald-400" />,
                    title: 'Ótima Economia!',
                    message: `Suas despesas caíram ${Math.abs(Math.round(expenseDiff))}% em relação ao mês anterior.`
                });
            }
        }

        // 2. Maior Gasto do Mês
        const currentMonthExpenses = transactions.filter(t =>
            t.type === 'expense' &&
            new Date(t.date).getMonth() === currentDate.getMonth() &&
            new Date(t.date).getFullYear() === currentDate.getFullYear()
        );

        if (currentMonthExpenses.length > 0) {
            const maxExpense = currentMonthExpenses.reduce((max, t) => Number(t.amount) > Number(max.amount) ? t : max, currentMonthExpenses[0]);
            generatedInsights.push({
                id: 'max-expense',
                type: 'info',
                icon: <AlertCircle size={20} className="text-blue-400" />,
                title: 'Maior Despesa',
                message: `O seu maior gasto este mês foi com ${maxExpense.description} (${formatMoney(Number(maxExpense.amount))}).`
            });
        }

        // 3. Taxa de Poupança (Savings Rate)
        if (income > 0) {
            const savingsRate = ((income - expenses) / income) * 100;
            if (savingsRate >= 20) {
                generatedInsights.push({
                    id: 'savings-great',
                    type: 'success',
                    icon: <Zap size={20} className="text-yellow-400" />,
                    title: 'Saúde Financeira Brilhante',
                    message: `Você está poupando ${Math.round(savingsRate)}% da sua renda. Incrível!`
                });
            } else if (savingsRate > 0 && savingsRate < 10) {
                generatedInsights.push({
                    id: 'savings-warning',
                    type: 'warning',
                    icon: <Lightbulb size={20} className="text-amber-400" />,
                    title: 'Dica de Economia',
                    message: `Sua taxa de poupança está em ${Math.round(savingsRate)}%. Que tal tentar separar 10% no próximo mês?`
                });
            }
        }

        // Default Se nada for engatilhado
        if (generatedInsights.length === 0) {
            generatedInsights.push({
                id: 'default',
                type: 'info',
                icon: <Lightbulb size={20} className="text-violet-400" />,
                title: 'Tudo Tranquilo',
                message: 'Continue registrando seus gastos para gerar insights personalizados.'
            });
        }

        return generatedInsights.slice(0, 3); // Top 3 insights
    }, [transactions, currentDate, income, expenses]);

    return (
        <div className="bg-slate-900/60 backdrop-blur-2xl p-6 rounded-[2rem] border border-white/[0.08] shadow-2xl shadow-violet-900/10 h-full overflow-hidden flex flex-col">
            <h3 className="font-bold text-xl text-white tracking-tight mb-6 flex items-center gap-2">
                <Zap className="text-violet-400" size={24} />
                Insights Inteligentes
            </h3>

            <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                {insights.map(insight => (
                    <div key={insight.id} className="bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 p-5 rounded-2xl transition-colors group">
                        <div className="flex gap-4">
                            <div className="mt-1">
                                {insight.icon}
                            </div>
                            <div>
                                <h4 className="font-bold text-white text-base mb-1">{insight.title}</h4>
                                <p className="text-sm text-slate-400 leading-relaxed">
                                    {insight.message}
                                </p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            <button className="mt-6 w-full py-3 bg-violet-600/10 hover:bg-violet-600/20 text-violet-400 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors">
                Ver Relatório Completo <ArrowRight size={16} />
            </button>
        </div>
    );
}

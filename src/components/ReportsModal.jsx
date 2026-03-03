import React, { useState } from 'react';
import { X, Download, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import { formatCurrency } from '../utils/financial';
import { motion, AnimatePresence } from 'framer-motion';

export function ReportsModal({ onClose, transactions, income, expenses, balance, categoryData = [] }) {
  const [activeTab, setActiveTab] = useState('summary');

  const monthTransactions = transactions.length;
  const avgTransaction = monthTransactions > 0 
    ? transactions.reduce((sum, t) => sum + parseFloat(t.amount), 0) / monthTransactions
    : 0;

  const topExpenseTransaction = transactions
    .filter(t => t.type === 'expense')
    .reduce((max, t) => parseFloat(t.amount) > parseFloat(max.amount || 0) ? t : max, {});

  const topIncomeTransaction = transactions
    .filter(t => t.type === 'income')
    .reduce((max, t) => parseFloat(t.amount) > parseFloat(max.amount || 0) ? t : max, {});

  const exportReport = () => {
    const report = `
RELATÓRIO FINANCEIRO - MEU GASTINHOS
Gerado em: ${new Date().toLocaleDateString('pt-BR')}

=== RESUMO GERAL ===
Saldo Total: ${formatCurrency(balance)}
Receitas: ${formatCurrency(income)}
Despesas: ${formatCurrency(expenses)}
Economia: ${formatCurrency(income - expenses)}

Total de Transações: ${monthTransactions}
Valor Médio por Transação: ${formatCurrency(avgTransaction)}

=== CATEGORIAS ===
${categoryData
  .sort((a, b) => b.value - a.value)
  .map(cat => `${cat.name}: ${formatCurrency(cat.value)} (${Math.round((cat.value / expenses) * 100)}%)`)
  .join('\n')}

=== TOP TRANSAÇÕES ===
Maior Despesa: ${topExpenseTransaction.description} - ${formatCurrency(topExpenseTransaction.amount || 0)}
Maior Receita: ${topIncomeTransaction.description} - ${formatCurrency(topIncomeTransaction.amount || 0)}

=== TRANSAÇÕES ===
${transactions
  .map(t => `${new Date(t.date).toLocaleDateString('pt-BR')} | ${t.description} | ${t.categoryLabel} | ${t.type === 'income' ? '+' : '-'}${formatCurrency(t.amount)}`)
  .join('\n')}
    `;

    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio_gastinhos_${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-slate-800 w-full max-w-2xl max-h-[80vh] rounded-2xl shadow-2xl border border-slate-700 overflow-hidden flex flex-col"
      >
        <div className="p-6 border-b border-slate-700 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white">Relatório Mensal</h2>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-700 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex gap-2 px-6 pt-4 border-b border-slate-700 overflow-x-auto">
          {['summary', 'categories', 'transactions'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 font-medium rounded-t-lg transition-colors whitespace-nowrap ${
                activeTab === tab
                  ? 'bg-violet-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab === 'summary' && 'Resumo'}
              {tab === 'categories' && 'Categorias'}
              {tab === 'transactions' && 'Transações'}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          <AnimatePresence mode="wait">
            {activeTab === 'summary' && (
              <motion.div
                key="summary"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4"
              >
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-xl">
                    <div className="flex items-center gap-2 text-emerald-400 mb-2">
                      <TrendingUp size={16} />
                      <span className="text-xs font-bold">RECEITAS</span>
                    </div>
                    <div className="text-2xl font-bold text-white">{formatCurrency(income)}</div>
                  </div>

                  <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-xl">
                    <div className="flex items-center gap-2 text-red-400 mb-2">
                      <TrendingDown size={16} />
                      <span className="text-xs font-bold">DESPESAS</span>
                    </div>
                    <div className="text-2xl font-bold text-white">{formatCurrency(expenses)}</div>
                  </div>

                  <div className="bg-violet-500/10 border border-violet-500/30 p-4 rounded-xl col-span-2">
                    <div className="text-xs font-bold text-violet-400 mb-2">ECONOMIA</div>
                    <div className="text-2xl font-bold text-white">{formatCurrency(income - expenses)}</div>
                    <div className="text-xs text-slate-400 mt-1">
                      Taxa de Poupança: {income > 0 ? Math.round(((income - expenses) / income) * 100) : 0}%
                    </div>
                  </div>
                </div>

                <div className="bg-slate-700/50 p-4 rounded-xl border border-slate-700">
                  <h3 className="font-bold text-white mb-3">Principais Transações</h3>
                  <div className="space-y-2 text-sm">
                    {topExpenseTransaction.description && (
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Maior Despesa:</span>
                        <span className="text-white font-medium">{topExpenseTransaction.description}</span>
                        <span className="text-red-400 font-bold">{formatCurrency(topExpenseTransaction.amount || 0)}</span>
                      </div>
                    )}
                    {topIncomeTransaction.description && (
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Maior Receita:</span>
                        <span className="text-white font-medium">{topIncomeTransaction.description}</span>
                        <span className="text-emerald-400 font-bold">{formatCurrency(topIncomeTransaction.amount || 0)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'categories' && (
              <motion.div
                key="categories"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-3"
              >
                {categoryData.length === 0 ? (
                  <div className="text-center text-slate-500 py-8">Nenhuma despesa registrada</div>
                ) : (
                  categoryData.map(cat => {
                    const percentage = (cat.value / expenses) * 100;
                    return (
                      <div key={cat.name} className="bg-slate-700/50 p-4 rounded-xl">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium text-white">{cat.name}</span>
                          <span className="font-bold text-white">{formatCurrency(cat.value)}</span>
                        </div>
                        <div className="flex gap-2 items-center">
                          <div className="flex-1 h-2 bg-slate-600 rounded-full overflow-hidden">
                            <div
                              className="h-full transition-all duration-500"
                              style={{ width: `${percentage}%`, backgroundColor: cat.color }}
                            />
                          </div>
                          <span className="text-xs text-slate-400 w-10 text-right">{Math.round(percentage)}%</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </motion.div>
            )}

            {activeTab === 'transactions' && (
              <motion.div
                key="transactions"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-2"
              >
                {transactions.length === 0 ? (
                  <div className="text-center text-slate-500 py-8">Nenhuma transação</div>
                ) : (
                  transactions
                    .sort((a, b) => new Date(b.date) - new Date(a.date))
                    .map(t => (
                      <div key={t.id} className="flex justify-between items-center p-3 bg-slate-700/30 rounded-lg text-sm">
                        <div className="flex items-center gap-3 flex-1">
                          <span className="text-lg">{t.categoryIcon}</span>
                          <div>
                            <div className="text-white font-medium">{t.description}</div>
                            <div className="text-xs text-slate-400">{new Date(t.date).toLocaleDateString('pt-BR')}</div>
                          </div>
                        </div>
                        <span className={`font-bold ${t.type === 'income' ? 'text-emerald-400' : 'text-white'}`}>
                          {t.type === 'income' ? '+' : '-'} {formatCurrency(t.amount)}
                        </span>
                      </div>
                    ))
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="p-6 border-t border-slate-700 flex gap-3">
          <button
            onClick={exportReport}
            className="flex-1 py-3 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <Download size={20} />
            Exportar Relatório
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-xl transition-colors"
          >
            Fechar
          </button>
        </div>
      </motion.div>
    </div>
  );
}

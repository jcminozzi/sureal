import React from 'react';
import { X } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function DayDetailsModal({ date, transactions, onClose, onDelete }) {
    const income = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + Number(t.amount), 0);
    const expense = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + Number(t.amount), 0);

    return (
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center">
            <div className="bg-slate-800 w-[400px] max-h-[80vh] flex flex-col rounded-2xl shadow-2xl border border-slate-700 animate-in fade-in zoom-in-95">
                <div className="p-6 border-b border-slate-700 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold text-white">{format(date, "d 'de' MMMM", { locale: ptBR })}</h2>
                        <div className="text-xs text-slate-400 mt-1 flex gap-3">
                            <span className="text-emerald-400">Receita: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(income)}</span>
                            <span className="text-red-400">Despesa: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(expense)}</span>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={20} /></button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-3">
                    {transactions.length === 0 ? (
                        <div className="text-center text-slate-500 py-8">Nenhuma transação neste dia.</div>
                    ) : (
                        transactions.map(t => (
                            <div key={t.id} className="bg-slate-700/30 p-3 rounded-xl border border-slate-700/50 flex items-center justify-between group">
                                <div className="flex items-center gap-3">
                                    <div className="text-xl">{t.categoryIcon}</div>
                                    <div>
                                        <div className="font-medium text-white text-sm">{t.description}</div>
                                        <div className="text-[10px] text-slate-400">{t.categoryLabel} • {t.type === 'income' ? 'Receita' : 'Despesa'}</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className={`font-bold text-sm ${t.type === 'income' ? 'text-emerald-400' : 'text-white'}`}>
                                        {t.type === 'income' ? '+' : '-'} {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(t.amount)}
                                    </div>
                                    <button onClick={() => onDelete(t.id)} className="text-red-400 text-[10px] hover:underline opacity-0 group-hover:opacity-100 transition-opacity">Excluir</button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

import React, { useState } from 'react';
import {
    Plus, TrendingUp, TrendingDown, Wallet, Calendar,
    MoreHorizontal, ChevronLeft, ChevronRight, X, Trash2,
    Check, CreditCard, PieChart, Search
} from 'lucide-react';
import { format } from 'date-fns';
import { BANCOS } from '../constants/bancos'; // Assuming BANKS/BANCOS are consistent, verify if BANKS is used

// Since we are migrating, let's assume BANKS import is needed or use the prop passed down if available
// Checking previous code, Desktop used BANKS from '../constants/banks'. Mobile might need it too or pass logic.
// For now, keeping core structure but replacing styles.

export const CATEGORIES = [
    { id: 'market', icon: '🛒', label: 'Mercado', color: '#f59e0b' },
    { id: 'food', icon: '🍽️', label: 'Alimentação', color: '#ef4444' },
    { id: 'transport', icon: '🚗', label: 'Transporte', color: '#3b82f6' },
    { id: 'home', icon: '🏠', label: 'Moradia', color: '#8b5cf6' },
    { id: 'leisure', icon: '🎉', label: 'Lazer', color: '#ec4899' },
    { id: 'health', icon: '💊', label: 'Saúde', color: '#10b981' },
    { id: 'education', icon: '📚', label: 'Educação', color: '#6366f1' },
    { id: 'services', icon: '💡', label: 'Serviços', color: '#06b6d4' },
    { id: 'salary', icon: '💰', label: 'Salário', color: '#10b981' },
    { id: 'investment', icon: '📈', label: 'Investimento', color: '#8b5cf6' },
];

function TransactionForm({ onClose, onSave, categories, cards }) {
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [type, setType] = useState('expense');
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [paymentMethod, setPaymentMethod] = useState('debit');
    const [selectedCardId, setSelectedCardId] = useState('');
    const [isInstallment, setIsInstallment] = useState(false);
    const [installmentsCount, setInstallmentsCount] = useState(2);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!amount || !selectedCategory) return;
        const val = parseFloat(amount.replace(/\./g, '').replace(',', '.'));

        onSave({
            id: Date.now().toString(),
            description: description || selectedCategory.label,
            amount: val,
            type,
            status: (type === 'expense' && paymentMethod === 'credit') ? 'pending' : 'paid',
            date: new Date().toISOString(),
            categoryIcon: selectedCategory.icon,
            categoryLabel: selectedCategory.label,
            cardId: (type === 'expense' && paymentMethod === 'credit') ? selectedCardId : null,
            installment: (type === 'expense' && paymentMethod === 'credit' && isInstallment) ? `1/${installmentsCount}` : null
        });
    };

    return (
        <div className="fixed inset-0 z-[9999] bg-slate-900/95 backdrop-blur-sm flex flex-col items-center justify-end sm:justify-center">
            <div className="w-full h-[90vh] sm:h-auto sm:max-w-md bg-slate-800 rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl overflow-y-auto border-t border-slate-700">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold">Nova Transação</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-700 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Type Toggle */}
                <div className="flex gap-3 mb-6">
                    <button
                        onClick={() => setType('income')}
                        className={`flex-1 py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${type === 'income' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50' : 'bg-slate-700/50 text-slate-400'}`}
                    >
                        <TrendingUp size={20} /> Receita
                    </button>
                    <button
                        onClick={() => setType('expense')}
                        className={`flex-1 py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${type === 'expense' ? 'bg-red-500/20 text-red-400 border border-red-500/50' : 'bg-slate-700/50 text-slate-400'}`}
                    >
                        <TrendingDown size={20} /> Despesa
                    </button>
                </div>

                {/* Amount Input */}
                <div className="mb-6">
                    <input
                        type="tel"
                        placeholder="R$ 0,00"
                        value={amount}
                        onChange={e => setAmount(e.target.value)}
                        className="w-full bg-transparent text-center text-5xl font-bold text-white placeholder-slate-600 outline-none pb-2 border-b-2 border-slate-700 focus:border-violet-500 transition-colors"
                        autoFocus
                    />
                </div>

                {/* Expense Details */}
                {type === 'expense' && (
                    <div className="space-y-4 mb-6">
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPaymentMethod('debit')}
                                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${paymentMethod === 'debit' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-400'}`}
                            >
                                Débito / Dinheiro
                            </button>
                            <button
                                onClick={() => setPaymentMethod('credit')}
                                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${paymentMethod === 'credit' ? 'bg-violet-600 text-white' : 'bg-slate-700 text-slate-400'}`}
                            >
                                Cartão de Crédito
                            </button>
                        </div>

                        {paymentMethod === 'credit' && (
                            <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700 animate-in fade-in slide-in-from-top-2">
                                <label className="block text-sm text-slate-400 mb-2">Cartão</label>
                                <select
                                    value={selectedCardId}
                                    onChange={e => setSelectedCardId(e.target.value)}
                                    className="w-full bg-slate-800 text-white p-3 rounded-lg outline-none border border-slate-600 focus:border-violet-500"
                                >
                                    <option value="">Selecione...</option>
                                    {cards.map(c => <option key={c.id} value={c.id}>{c.bankName}</option>)}
                                </select>

                                <div className="mt-4 flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        id="installment"
                                        checked={isInstallment}
                                        onChange={e => setIsInstallment(e.target.checked)}
                                        className="w-5 h-5 accent-violet-600"
                                    />
                                    <label htmlFor="installment" className="text-sm">Parcelar?</label>
                                </div>

                                {isInstallment && (
                                    <div className="mt-2">
                                        <label className="block text-sm text-slate-400 mb-1">Parcelas</label>
                                        <div className="flex items-center gap-4">
                                            <input
                                                type="range" min="2" max="12"
                                                value={installmentsCount}
                                                onChange={e => setInstallmentsCount(parseInt(e.target.value))}
                                                className="flex-1 accent-violet-600"
                                            />
                                            <span className="font-bold text-lg w-8 text-center">{installmentsCount}x</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Categories */}
                <div className="mb-6">
                    <label className="block text-sm text-slate-400 mb-2">Categoria</label>
                    <div className="grid grid-cols-5 gap-2">
                        {categories.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => setSelectedCategory(cat)}
                                className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all ${selectedCategory?.id === cat.id ? 'bg-violet-600 text-white scale-105' : 'bg-slate-700/30 text-slate-400 hover:bg-slate-700'}`}
                            >
                                <span className="text-2xl mb-1">{cat.icon}</span>
                                <span className="text-[10px] font-medium truncate w-full text-center">{cat.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Description */}
                <div className="mb-20">
                    <input
                        type="text"
                        placeholder="Descrição (Opcional)"
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        className="w-full bg-slate-900/50 border border-slate-700 rounded-xl p-4 text-white outline-none focus:border-violet-500"
                    />
                </div>

                {/* Submit Button */}
                <div className="fixed sm:absolute bottom-0 left-0 w-full p-6 bg-slate-800 border-t border-slate-700 sm:border-0 sm:bg-transparent">
                    <button
                        onClick={handleSubmit}
                        disabled={!amount || !selectedCategory}
                        className="w-full py-4 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-violet-500/25 active:scale-95 disabled:opacity-50 disabled:active:scale-100 transition-all flex items-center justify-center gap-2"
                    >
                        <Check size={20} /> Confirmar Lançamento
                    </button>
                </div>
            </div>
        </div>
    );
}

export function MobileLayout({
    balance, income, expenses, transactions, setTransactions,
    nextMonth, prevMonth, currentDate, addCard, deleteCard, cards
}) {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('home');

    const formatMoney = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

    const renderContent = () => {
        if (activeTab === 'home') {
            return (
                <div className="space-y-6 pb-24">
                    {/* Header Card */}
                    <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-6 border border-slate-700 shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-violet-600/20 blur-3xl rounded-full -mr-10 -mt-10"></div>

                        <div className="relative z-10">
                            <span className="text-slate-400 text-sm font-medium">Saldo Total</span>
                            <div className="flex items-baseline gap-1 mt-1">
                                <span className="text-3xl font-bold text-white">{formatMoney(balance)}</span>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mt-6">
                                <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-700/50">
                                    <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold mb-1">
                                        <div className="p-1 bg-emerald-500/20 rounded-full"><TrendingUp size={12} /></div>
                                        ENTRADAS
                                    </div>
                                    <span className="text-lg font-semibold text-white">{formatMoney(income)}</span>
                                </div>
                                <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-700/50">
                                    <div className="flex items-center gap-2 text-red-400 text-xs font-bold mb-1">
                                        <div className="p-1 bg-red-500/20 rounded-full"><TrendingDown size={12} /></div>
                                        SAÍDAS
                                    </div>
                                    <span className="text-lg font-semibold text-white">{formatMoney(expenses)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Recent Transactions */}
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-lg">Últimas</h3>
                            <button className="text-violet-400 text-sm font-medium">Ver todas</button>
                        </div>

                        <div className="space-y-3">
                            {transactions.length === 0 && (
                                <div className="text-center py-10 text-slate-500 border-2 border-dashed border-slate-700 rounded-xl">
                                    Sem lançamentos ainda.
                                </div>
                            )}
                            {transactions.map(t => (
                                <div key={t.id} className="bg-slate-800 p-4 rounded-xl flex items-center justify-between border border-slate-700/50 hover:bg-slate-700/50 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-xl">
                                            {t.categoryIcon}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-white">{t.description}</p>
                                            <p className="text-xs text-slate-400">{format(new Date(t.date), 'dd/MM')}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className={`font-bold ${t.type === 'income' ? 'text-emerald-400' : 'text-white'}`}>
                                            {t.type === 'income' ? '+' : '-'} {formatMoney(t.amount)}
                                        </p>
                                        {t.status === 'pending' && <p className="text-[10px] text-red-400 font-bold bg-red-500/10 px-2 py-0.5 rounded-full inline-block mt-1">PENDENTE</p>}
                                    </div>

                                    {/* Delete embedded action (simplified for mobile) */}
                                    <button
                                        onClick={(e) => { e.stopPropagation(); if (confirm('Excluir?')) setTransactions(prev => prev.filter(x => x.id !== t.id)) }}
                                        className="ml-2 p-2 text-slate-500 hover:text-red-400"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )
        }
        return <div className="p-10 text-center text-slate-500">Em breve...</div>
    }

    return (
        <div className="min-h-screen bg-slate-900 text-white font-sans max-w-md mx-auto relative overflow-hidden flex flex-col">
            {/* Top Bar */}
            <header className="p-6 flex justify-between items-center bg-slate-900/80 backdrop-blur-md sticky top-0 z-40">
                <div className="flex flex-col">
                    <span className="text-slate-400 text-sm">Olá, Usuário</span>
                    <h1 className="text-xl font-bold">Meus Gastinhos</h1>
                </div>
                <div className="flex items-center gap-2 bg-slate-800 rounded-full px-3 py-1 border border-slate-700">
                    <button onClick={prevMonth} className="p-1 text-slate-400 hover:text-white"><ChevronLeft size={16} /></button>
                    <span className="text-sm font-semibold">{format(currentDate, 'MMM yyyy')}</span>
                    <button onClick={nextMonth} className="p-1 text-slate-400 hover:text-white"><ChevronRight size={16} /></button>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 px-6 overflow-y-auto">
                {renderContent()}
            </main>

            {/* FAB */}
            <button
                onClick={() => setIsFormOpen(true)}
                className="fixed bottom-24 right-6 w-14 h-14 bg-violet-600 rounded-full flex items-center justify-center shadow-lg shadow-violet-600/40 z-50 text-white hover:scale-110 active:scale-90 transition-all"
            >
                <Plus size={28} />
            </button>

            {/* Bottom Nav */}
            <nav className="fixed bottom-0 left-0 w-full bg-slate-800/90 backdrop-blur-md border-t border-slate-700/50 p-4 pb-8 z-40 max-w-md mx-auto right-0">
                <div className="flex justify-around items-center">
                    <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center gap-1 ${activeTab === 'home' ? 'text-violet-400' : 'text-slate-500'}`}>
                        <Wallet size={24} />
                    </button>
                    <button onClick={() => setActiveTab('stats')} className={`flex flex-col items-center gap-1 ${activeTab === 'stats' ? 'text-violet-400' : 'text-slate-500'}`}>
                        <PieChart size={24} />
                    </button>
                    <button onClick={() => setActiveTab('cards')} className={`flex flex-col items-center gap-1 ${activeTab === 'cards' ? 'text-violet-400' : 'text-slate-500'}`}>
                        <CreditCard size={24} />
                    </button>
                </div>
            </nav>

            {isFormOpen && <TransactionForm onClose={() => setIsFormOpen(false)} onSave={(t) => { setTransactions([t, ...transactions]); setIsFormOpen(false); }} categories={CATEGORIES} cards={cards} />}
        </div>
    );
}

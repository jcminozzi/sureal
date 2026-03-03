import React, { useState, useMemo, useEffect } from 'react';
import {
    Plus, TrendingUp, TrendingDown, Wallet, Calendar,
    MoreHorizontal, ChevronLeft, ChevronRight, X, Trash2,
    Check, CreditCard, PieChart, Search, Repeat,
    Eye, EyeOff, Target, Settings, Mic, Camera, Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { BANKS } from '../constants/banks';
import { calculateLevel } from '../utils/gamification';
import { motion, AnimatePresence } from 'framer-motion';
import { PieChart as RechartsPie, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { SmartTips } from '../components/SmartTips';
import { SettingsModal } from '../components/SettingsModal';
import { useVoiceInput } from '../hooks/useVoiceInput';
import { parseVoiceCommand } from '../utils/voiceParser';
import { useOCR } from '../hooks/useOCR';
import { UnifiedTransactionForm } from '../components/UnifiedTransactionForm';

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

// Componente importado do UnifiedTransactionForm

export function MobileLayout({
    balance, income, expenses, transactions, setTransactions,
    nextMonth, prevMonth, currentDate, addCard, deleteCard, cards,
    goals, setGoals, userName
}) {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('home');
    const [isPrivacyMode, setIsPrivacyMode] = useState(false);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

    const formatMoney = (val) => isPrivacyMode ? '****' : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
    const { currentLevel, progress } = calculateLevel(balance, transactions.length);

    const categoryData = useMemo(() => {
        const catMap = {};
        transactions.filter(t => t.type === 'expense').forEach(t => {
            if (!catMap[t.categoryLabel]) catMap[t.categoryLabel] = 0;
            catMap[t.categoryLabel] += Number(t.amount);
        });
        return Object.keys(catMap).map(key => {
            const cat = CATEGORIES.find(c => c.label === key);
            return { name: key, value: catMap[key], color: cat?.color || '#94a3b8' };
        });
    }, [transactions]);

    const renderContent = () => {
        if (activeTab === 'home') {
            return (
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-6 pb-24">
                    <div className="bg-slate-900/60 backdrop-blur-2xl rounded-3xl p-6 border border-white/[0.08] shadow-2xl shadow-indigo-900/20 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-violet-600/30 blur-[60px] rounded-full -mr-10 -mt-10 animate-pulse"></div>
                        <div className="absolute bottom-0 left-0 w-32 h-32 bg-secondary/20 blur-[50px] rounded-full -ml-10 -mb-10"></div>
                        <div className="relative z-10">
                            <span className="text-slate-400 text-sm font-medium">Saldo Total</span>
                            <div className="text-4xl font-black text-white mt-1 font-outfit tracking-tight">{formatMoney(balance)}</div>
                            <div className="grid grid-cols-2 gap-4 mt-6">
                                <div className="bg-slate-800/80 p-4 rounded-2xl border border-white/[0.05] shadow-inner">
                                    <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold mb-1"><TrendingUp size={14} /> ENTRADAS</div>
                                    <span className="text-xl font-bold text-white font-outfit">{formatMoney(income)}</span>
                                </div>
                                <div className="bg-slate-800/80 p-4 rounded-2xl border border-white/[0.05] shadow-inner">
                                    <div className="flex items-center gap-2 text-red-400 text-xs font-bold mb-1"><TrendingDown size={14} /> SAÍDAS</div>
                                    <span className="text-xl font-bold text-white font-outfit">{formatMoney(expenses)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-lg">Últimas</h3>
                            <button className="text-violet-400 text-sm font-medium">Ver todas</button>
                        </div>
                        <div className="space-y-3">
                            {transactions.length === 0 && <div className="text-center py-10 text-slate-500 border-2 border-dashed border-slate-700 rounded-xl">Sem lançamentos.</div>}
                            <AnimatePresence mode='popLayout'>
                                {transactions.map((t, i) => (
                                    <motion.div
                                        key={t.id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ delay: i * 0.05 }}
                                        className="bg-slate-800/60 backdrop-blur-md p-4 rounded-2xl flex items-center justify-between border border-white/[0.05] shadow-sm hover:bg-slate-800 transition-colors"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-xl">{t.categoryIcon}</div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="font-semibold text-white">{t.description}</p>
                                                    {t.recurring && <Repeat size={12} className="text-violet-400" />}
                                                </div>
                                                <p className="text-xs text-slate-400">{format(new Date(t.date), 'dd/MM')}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className={`font-bold font-outfit text-base ${t.type === 'income' ? 'text-emerald-400' : 'text-white'} `}>{t.type === 'income' ? '+' : '-'} {formatMoney(t.amount)}</p>
                                            {t.status === 'pending' && <p className="text-[10px] text-red-400 font-bold bg-red-500/10 px-2 py-0.5 rounded-full inline-block mt-1">PENDENTE</p>}
                                        </div>
                                        <button onClick={(e) => { e.stopPropagation(); if (confirm('Excluir?')) setTransactions(prev => prev.filter(x => x.id !== t.id)) }} className="ml-2 p-2 text-slate-500 hover:text-red-400"><Trash2 size={16} /></button>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    </div>
                </motion.div>
            )
        }

        if (activeTab === 'stats') {
            return (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6 pb-24">
                    <h2 className="text-2xl font-bold mb-4">Estatísticas</h2>
                    {categoryData.length > 0 ? (
                        <div className="bg-slate-800 rounded-3xl p-6 border border-slate-700 shadow-lg h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <RechartsPie data={categoryData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                    {categoryData.map((entry, index) => (
                                        <Cell key={`cell - ${index} `} fill={entry.color} stroke="none" />
                                    ))}
                                </RechartsPie>
                                <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: 12 }} />
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="text-center py-20 text-slate-500">Sem dados de despesas.</div>
                    )}

                    <div className="space-y-4">
                        <h3 className="font-bold text-lg">Gastos por Categoria</h3>
                        {categoryData.sort((a, b) => b.value - a.value).map(item => (
                            <div key={item.name} className="flex items-center justify-between p-4 bg-slate-800 rounded-xl border border-slate-700/50">
                                <div className="flex items-center gap-3">
                                    <div className="w-3 h-3 rounded-full" style={{ background: item.color }}></div>
                                    <span className="font-medium">{item.name}</span>
                                </div>
                                <span className="font-bold">{formatMoney(item.value)}</span>
                            </div>
                        ))}
                    </div>
                </motion.div>
            )
        }

        if (activeTab === 'cards') {
            return (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6 pb-24">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-2xl font-bold">Meus Cartões</h2>
                        <button onClick={() => alert('Use o Desktop para adicionar cartões por enquanto.')} className="text-violet-400 text-sm">Adicionar</button>
                    </div>
                    {cards.length === 0 ? <div className="text-center py-20 text-slate-500">Nenhum cartão cadastrado.</div> : (
                        <div className="space-y-4">
                            {cards.map(card => {
                                const bankPreset = BANKS.find(b => b.id === card.bankId) || BANKS.find(b => b.name === card.bankName) || {};
                                const gradient = card.gradient || bankPreset.gradient || 'linear-gradient(135deg, #64748b 0%, #475569 100%)';
                                return (
                                    <div key={card.id} className="relative rounded-2xl p-6 shadow-lg text-white h-48 flex flex-col justify-between" style={{ background: gradient }}>
                                        <div className="flex justify-between items-start">
                                            <span className="font-bold text-lg">{card.bankName}</span>
                                            <CreditCard />
                                        </div>
                                        <div className="flex justify-between items-end">
                                            <div>
                                                <div className="text-xs opacity-80">Limite/Fatura</div>
                                                <div className="text-xl font-bold">****</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-xs opacity-80">FECHA</div>
                                                <div className="text-lg font-semibold">{card.dueDay}</div>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </motion.div>
            )
        }

        if (activeTab === 'goals') {
            return (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6 pb-24">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-2xl font-bold">Metas & Sonhos</h2>
                        <button onClick={() => {
                            const name = prompt('Nome da meta (ex: PS5):');
                            if (!name) return;
                            const target = Number(prompt('Valor alvo (ex: 4000):'));
                            if (!target) return;
                            setGoals([...goals, { id: Date.now(), name, target, current: 0, emoji: '🎯' }]);
                        }} className="text-violet-400 text-sm font-bold bg-violet-500/10 px-3 py-1 rounded-lg">+ Nova Meta</button>
                    </div>

                    {goals.length === 0 ? <div className="text-center py-20 text-slate-500">Nenhuma meta. Bora sonhar?</div> : (
                        <div className="space-y-4">
                            {goals.map(goal => {
                                const progress = Math.min(100, (goal.current / goal.target) * 100);
                                return (
                                    <div key={goal.id} className="bg-slate-800 p-5 rounded-2xl border border-slate-700/50 relative overflow-hidden">
                                        <div className="flex justify-between items-start mb-2 relative z-10">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center text-xl">{goal.emoji}</div>
                                                <div>
                                                    <div className="font-bold text-lg">{goal.name}</div>
                                                    <div className="text-xs text-slate-400">{formatMoney(goal.current)} de {formatMoney(goal.target)}</div>
                                                </div>
                                            </div>
                                            <button onClick={() => {
                                                const val = Number(prompt('Quanto quer guardar?'));
                                                if (val) {
                                                    const newGoals = goals.map(g => g.id === goal.id ? { ...g, current: g.current + val } : g);
                                                    setGoals(newGoals);
                                                }
                                            }} className="bg-emerald-500 text-white px-3 py-1 rounded-lg text-xs font-bold shadow-lg shadow-emerald-500/20 active:scale-95 transition-transform">Depositar</button>
                                        </div>
                                        <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden relative z-10">
                                            <div className="h-full bg-gradient-to-r from-violet-600 to-indigo-500 transition-all duration-1000" style={{ width: `${progress}% ` }}></div>
                                        </div>
                                        {progress >= 100 && <div className="absolute inset-0 bg-emerald-500/10 flex items-center justify-center z-0"><span className="text-4xl opacity-20 rotate-12">CONQUISTADO!</span></div>}
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </motion.div>
            )
        }
    }

    return (
        <div className="min-h-screen bg-slate-900 text-white font-sans max-w-md mx-auto relative overflow-hidden flex flex-col">
            <header className="p-6 flex justify-between items-center bg-slate-900/80 backdrop-blur-md sticky top-0 z-40">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xl shadow-lg relative">
                        {currentLevel.emoji}
                        <div className="absolute bottom-0 w-full h-1 bg-slate-700 rounded-full overflow-hidden">
                            <div className="h-full transition-all duration-1000" style={{ width: `${progress}% `, backgroundColor: currentLevel.color }}></div>
                        </div>
                    </div>
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                            <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">{currentLevel.name}</span>
                            <button onClick={() => setIsPrivacyMode(!isPrivacyMode)} className="text-slate-500 hover:text-white pb-0.5">
                                {isPrivacyMode ? <EyeOff size={14} /> : <Eye size={14} />}
                            </button>
                            <button onClick={() => setIsSettingsModalOpen(true)} className="text-slate-500 hover:text-white pb-0.5">
                                <Settings size={14} />
                            </button>
                        </div>
                        <h1 className="text-lg font-bold">Meus Gastinhos</h1>
                        <span className="text-xs text-slate-400">Olá, {userName || 'Usuário'}</span>
                    </div>
                </div>
                <div className="flex items-center gap-2 bg-slate-800 rounded-full px-3 py-1 border border-slate-700">
                    <button onClick={prevMonth} className="p-1 text-slate-400 hover:text-white"><ChevronLeft size={16} /></button>
                    <span className="text-sm font-semibold capitalize">{format(currentDate, 'MMM yyyy', { locale: ptBR })}</span>
                    <button onClick={nextMonth} className="p-1 text-slate-400 hover:text-white"><ChevronRight size={16} /></button>
                </div>
            </header>

            <main className="flex-1 px-6 overflow-y-auto custom-scrollbar">
                <AnimatePresence mode='wait'>
                    {renderContent()}
                </AnimatePresence>
            </main>

            <motion.button
                whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                onClick={() => setIsFormOpen(true)}
                className="fixed bottom-28 right-6 w-14 h-14 bg-gradient-to-tr from-violet-600 to-indigo-500 rounded-full flex items-center justify-center shadow-lg shadow-violet-600/40 z-50 text-white"
            >
                <Plus size={28} />
            </motion.button>

            <div className="fixed bottom-6 left-0 right-0 px-6 z-40 max-w-md mx-auto flex justify-center">
                <nav className="glass w-full px-6 py-4 flex justify-around items-center rounded-[2rem]">
                    <button onClick={() => setActiveTab('home')} className={`relative p-2 rounded-xl transition-all ${activeTab === 'home' ? 'text-violet-400 bg-violet-500/10' : 'text-slate-500 hover:text-slate-300'} `}>
                        <Wallet size={24} />
                    </button>
                    <button onClick={() => setActiveTab('stats')} className={`relative p-2 rounded-xl transition-all ${activeTab === 'stats' ? 'text-violet-400 bg-violet-500/10' : 'text-slate-500 hover:text-slate-300'} `}>
                        <PieChart size={24} />
                    </button>
                    <button onClick={() => setActiveTab('cards')} className={`relative p-2 rounded-xl transition-all ${activeTab === 'cards' ? 'text-violet-400 bg-violet-500/10' : 'text-slate-500 hover:text-slate-300'} `}>
                        <CreditCard size={24} />
                    </button>
                    <button onClick={() => setActiveTab('goals')} className={`relative p-2 rounded-xl transition-all ${activeTab === 'goals' ? 'text-violet-400 bg-violet-500/10' : 'text-slate-500 hover:text-slate-300'} `}>
                        <Target size={24} />
                    </button>
                </nav>
            </div>

            <AnimatePresence>
                {isFormOpen && <UnifiedTransactionForm isDesktop={false} onClose={() => setIsFormOpen(false)} onSave={(t) => { setTransactions([t, ...transactions]); setIsFormOpen(false); }} categories={CATEGORIES} cards={cards} />}
            </AnimatePresence>
            {isSettingsModalOpen && <SettingsModal onClose={() => setIsSettingsModalOpen(false)} userName={userName} setUserName={setUserName} />}
            <SmartTips transactions={transactions} income={income} expenses={expenses} balance={balance} />
        </div>
    );
}

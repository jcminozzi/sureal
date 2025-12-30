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
    const [isRecurring, setIsRecurring] = useState(false);

    const { isListening, transcript, startListening, stopListening, isSupported, error: voiceError } = useVoiceInput();
    const { processImage, isProcessing, progress } = useOCR();

    useEffect(() => {
        if (transcript) {
            const { type: newType, amount: newAmount, category: newCategory, description: newDesc } = parseVoiceCommand(transcript);

            if (newType) setType(newType);
            if (newAmount) setAmount(newAmount.toFixed(2).replace('.', ','));
            if (newCategory) setSelectedCategory(newCategory);
            if (newDesc) setDescription(newDesc);
        }
    }, [transcript]);

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (file) {
            const data = await processImage(file);
            if (data) {
                if (data.amount) setAmount(data.amount.toFixed(2).replace('.', ','));
                if (data.category) setSelectedCategory(data.category);
                if (data.description) setDescription(data.description);
            }
        }
    };

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
            installment: (type === 'expense' && paymentMethod === 'credit' && isInstallment) ? `1 / ${installmentsCount} ` : null,
            recurring: isRecurring
        });
    };

    return (
        <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] bg-slate-900/95 backdrop-blur-sm flex flex-col items-center justify-end sm:justify-center"
        >
            <motion.div
                initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="w-full h-[90vh] sm:h-auto sm:max-w-md bg-slate-800 rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl overflow-y-auto border-t border-slate-700"
            >
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold">Nova Transação</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-700 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Smart Input Buttons */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                    {isSupported && (
                        <button
                            onClick={isListening ? stopListening : startListening}
                            className={`py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all text-sm ${isListening ? 'bg-red-500/20 text-red-400 border border-red-500 animate-pulse' : 'bg-violet-600/10 text-violet-400 border border-violet-500/30 hover:bg-violet-600/20'}`}
                        >
                            <Mic size={18} className={isListening ? 'animate-bounce' : ''} />
                            {isListening ? 'Ouvindo...' : 'Voz'}
                        </button>
                    )}

                    <label className={`py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all text-sm cursor-pointer ${isProcessing ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20'}`}>
                        {isProcessing ? <Loader2 size={18} className="animate-spin" /> : <Camera size={18} />}
                        {isProcessing ? `${progress}%` : 'Foto / Scan'}
                        <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={isProcessing} />
                    </label>
                </div>

                {voiceError && (
                    <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-xl text-red-300 text-xs text-center">
                        {voiceError}
                    </div>
                )}

                <div className="flex gap-3 mb-6">
                    <button
                        onClick={() => setType('income')}
                        className={`flex-1 py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${type === 'income' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50' : 'bg-slate-700/50 text-slate-400'} `}
                    >
                        <TrendingUp size={20} /> Receita
                    </button>
                    <button
                        onClick={() => setType('expense')}
                        className={`flex-1 py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${type === 'expense' ? 'bg-red-500/20 text-red-400 border border-red-500/50' : 'bg-slate-700/50 text-slate-400'} `}
                    >
                        <TrendingDown size={20} /> Despesa
                    </button>
                </div>

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

                {type === 'expense' && (
                    <div className="space-y-4 mb-6">
                        <div className="flex gap-2">
                            <button onClick={() => setPaymentMethod('debit')} className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${paymentMethod === 'debit' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-400'} `}>Débito</button>
                            <button onClick={() => setPaymentMethod('credit')} className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${paymentMethod === 'credit' ? 'bg-violet-600 text-white' : 'bg-slate-700 text-slate-400'} `}>Crédito</button>
                        </div>
                        {paymentMethod === 'credit' && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="bg-slate-900/50 p-4 rounded-xl border border-slate-700">
                                <label className="block text-sm text-slate-400 mb-2">Cartão</label>
                                <select value={selectedCardId} onChange={e => setSelectedCardId(e.target.value)} className="w-full bg-slate-800 text-white p-3 rounded-lg outline-none border border-slate-600 focus:border-violet-500">
                                    <option value="">Selecione...</option>
                                    {cards.map(c => <option key={c.id} value={c.id}>{c.bankName}</option>)}
                                </select>
                                <div className="mt-4 flex items-center gap-3">
                                    <input type="checkbox" id="installment" checked={isInstallment} onChange={e => setIsInstallment(e.target.checked)} className="w-5 h-5 accent-violet-600" />
                                    <label htmlFor="installment" className="text-sm">Parcelar?</label>
                                </div>
                                {isInstallment && (
                                    <div className="mt-2">
                                        <div className="flex items-center gap-4">
                                            <input type="range" min="2" max="12" value={installmentsCount} onChange={e => setInstallmentsCount(parseInt(e.target.value))} className="flex-1 accent-violet-600" />
                                            <span className="font-bold text-lg w-8 text-center">{installmentsCount}x</span>
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </div>
                )}

                <div className="mb-6">
                    <label className="block text-sm text-slate-400 mb-2">Categoria</label>
                    <div className="grid grid-cols-5 gap-2">
                        {categories.map(cat => (
                            <button key={cat.id} onClick={() => setSelectedCategory(cat)} className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all ${selectedCategory?.id === cat.id ? 'bg-violet-600 text-white scale-105' : 'bg-slate-700/30 text-slate-400 hover:bg-slate-700'} `}>
                                <span className="text-2xl mb-1">{cat.icon}</span>
                                <span className="text-[10px] font-medium truncate w-full text-center">{cat.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="mb-20 space-y-4">
                    <input type="text" placeholder="Descrição (Opcional)" value={description} onChange={e => setDescription(e.target.value)} className="w-full bg-slate-900/50 border border-slate-700 rounded-xl p-4 text-white outline-none focus:border-violet-500" />

                    <div className="flex items-center gap-3 px-2">
                        <input type="checkbox" id="mobile-recurring" checked={isRecurring} onChange={e => setIsRecurring(e.target.checked)}
                            className="w-5 h-5 accent-violet-600 rounded" />
                        <label htmlFor="mobile-recurring" className="text-slate-300 text-sm flex items-center gap-2">
                            <Repeat size={16} /> Repetir todo mês (Fixo)
                        </label>
                    </div>
                </div>

                <div className="fixed sm:absolute bottom-0 left-0 w-full p-6 bg-slate-800 border-t border-slate-700 sm:border-0 sm:bg-transparent">
                    <button onClick={handleSubmit} disabled={!amount || !selectedCategory} className="w-full py-4 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-violet-500/25 active:scale-95 disabled:opacity-50 disabled:active:scale-100 transition-all flex items-center justify-center gap-2">
                        <Check size={20} /> Confirmar Lançamento
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}

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
                    <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-6 border border-slate-700 shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-violet-600/20 blur-3xl rounded-full -mr-10 -mt-10 animate-pulse"></div>
                        <div className="relative z-10">
                            <span className="text-slate-400 text-sm font-medium">Saldo Total</span>
                            <div className="text-3xl font-bold text-white mt-1">{formatMoney(balance)}</div>
                            <div className="grid grid-cols-2 gap-4 mt-6">
                                <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-700/50">
                                    <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold mb-1"><TrendingUp size={12} /> ENTRADAS</div>
                                    <span className="text-lg font-semibold text-white">{formatMoney(income)}</span>
                                </div>
                                <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-700/50">
                                    <div className="flex items-center gap-2 text-red-400 text-xs font-bold mb-1"><TrendingDown size={12} /> SAÍDAS</div>
                                    <span className="text-lg font-semibold text-white">{formatMoney(expenses)}</span>
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
                                        className="bg-slate-800 p-4 rounded-xl flex items-center justify-between border border-slate-700/50"
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
                                            <p className={`font - bold ${t.type === 'income' ? 'text-emerald-400' : 'text-white'} `}>{t.type === 'income' ? '+' : '-'} {formatMoney(t.amount)}</p>
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
                className="fixed bottom-24 right-6 w-14 h-14 bg-violet-600 rounded-full flex items-center justify-center shadow-lg shadow-violet-600/40 z-50 text-white"
            >
                <Plus size={28} />
            </motion.button>

            <nav className="fixed bottom-0 left-0 w-full bg-slate-800/90 backdrop-blur-md border-t border-slate-700/50 p-4 pb-8 z-40 max-w-md mx-auto right-0">
                <div className="flex justify-around items-center">
                    <button onClick={() => setActiveTab('home')} className={`relative flex flex - col items - center gap - 1 ${activeTab === 'home' ? 'text-violet-400' : 'text-slate-500'} `}>
                        <Wallet size={24} />
                        {activeTab === 'home' && <motion.div layoutId="nav-pill" className="absolute -bottom-2 w-1 h-1 bg-violet-400 rounded-full" />}
                    </button>
                    <button onClick={() => setActiveTab('stats')} className={`relative flex flex - col items - center gap - 1 ${activeTab === 'stats' ? 'text-violet-400' : 'text-slate-500'} `}>
                        <PieChart size={24} />
                        {activeTab === 'stats' && <motion.div layoutId="nav-pill" className="absolute -bottom-2 w-1 h-1 bg-violet-400 rounded-full" />}
                    </button>
                    <button onClick={() => setActiveTab('cards')} className={`relative flex flex - col items - center gap - 1 ${activeTab === 'cards' ? 'text-violet-400' : 'text-slate-500'} `}>
                        <CreditCard size={24} />
                        {activeTab === 'cards' && <motion.div layoutId="nav-pill" className="absolute -bottom-2 w-1 h-1 bg-violet-400 rounded-full" />}
                    </button>
                    <button onClick={() => setActiveTab('goals')} className={`relative flex flex - col items - center gap - 1 ${activeTab === 'goals' ? 'text-violet-400' : 'text-slate-500'} `}>
                        <Target size={24} />
                        {activeTab === 'goals' && <motion.div layoutId="nav-pill" className="absolute -bottom-2 w-1 h-1 bg-violet-400 rounded-full" />}
                    </button>
                </div>
            </nav>

            <AnimatePresence>
                {isFormOpen && <TransactionForm onClose={() => setIsFormOpen(false)} onSave={(t) => { setTransactions([t, ...transactions]); setIsFormOpen(false); }} categories={CATEGORIES} cards={cards} />}
            </AnimatePresence>
            {isSettingsModalOpen && <SettingsModal onClose={() => setIsSettingsModalOpen(false)} userName={userName} setUserName={setUserName} />}
            <SmartTips transactions={transactions} income={income} expenses={expenses} balance={balance} />
        </div>
    );
}

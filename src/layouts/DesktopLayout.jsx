import React, { useState } from 'react';
import {
    LayoutDashboard, Wallet, PieChart, Calendar as CalendarIcon, Settings,
    Plus, Search, Bell, TrendingUp, TrendingDown, DollarSign,
    ArrowUpRight, ArrowDownRight, CreditCard, Trash2, X, Check, Download, ChevronLeft, ChevronRight
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, getDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { CATEGORIES } from './MobileLayout';
import { BANKS } from '../constants/banks';

function DesktopTransactionModal({ onClose, onSave, categories, cards }) {
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [type, setType] = useState('expense');
    const [paymentMethod, setPaymentMethod] = useState('debit');
    const [selectedCardId, setSelectedCardId] = useState('');
    const [selectedCategory, setSelectedCategory] = useState(null);

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
            installment: null
        });
    };

    return (
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center">
            <div className="bg-slate-800 w-[500px] p-8 rounded-2xl shadow-2xl border border-slate-700 animate-in fade-in zoom-in-95">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-white">Nova Transação</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white"><X /></button>
                </div>

                <div className="flex gap-3 mb-6">
                    <button
                        onClick={() => setType('income')}
                        className={`flex-1 py-3 rounded-xl font-semibold border transition-colors ${type === 'income' ? 'bg-emerald-500/10 border-emerald-500 text-emerald-500' : 'border-slate-600 text-slate-400 hover:bg-slate-700'}`}
                    >Receita</button>
                    <button
                        onClick={() => setType('expense')}
                        className={`flex-1 py-3 rounded-xl font-semibold border transition-colors ${type === 'expense' ? 'bg-red-500/10 border-red-500 text-red-500' : 'border-slate-600 text-slate-400 hover:bg-slate-700'}`}
                    >Despesa</button>
                </div>

                <div className="mb-6">
                    <input autoFocus type="text" placeholder="0,00" value={amount} onChange={e => setAmount(e.target.value)}
                        className="w-full bg-transparent text-center text-4xl font-bold text-white placeholder-slate-600 border-b-2 border-slate-600 focus:border-violet-500 outline-none pb-2 transition-colors" />
                </div>

                {type === 'expense' && (
                    <div className="flex gap-3 mb-6">
                        <button onClick={() => setPaymentMethod('debit')} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${paymentMethod === 'debit' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300'}`}>Débito/Dinheiro</button>
                        <button onClick={() => setPaymentMethod('credit')} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${paymentMethod === 'credit' ? 'bg-violet-600 text-white' : 'bg-slate-700 text-slate-300'}`}>Crédito</button>
                    </div>
                )}

                {type === 'expense' && paymentMethod === 'credit' && (
                    <div className="mb-6">
                        <label className="block text-sm text-slate-400 mb-2">Cartão</label>
                        <select
                            value={selectedCardId} onChange={e => setSelectedCardId(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-600 rounded-xl p-3 text-white outline-none focus:border-violet-500"
                        >
                            <option value="">Selecione um cartão...</option>
                            {cards.map(c => <option key={c.id} value={c.id}>{c.bankName || 'Cartão sem nome'}</option>)}
                        </select>
                    </div>
                )}

                <div className="grid grid-cols-5 gap-2 mb-6 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                    {categories.map(cat => (
                        <div key={cat.id} onClick={() => setSelectedCategory(cat)}
                            className={`p-2 rounded-xl cursor-pointer text-center transition-all ${selectedCategory?.id === cat.id ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/30' : 'bg-slate-700/50 hover:bg-slate-700 text-slate-400'}`}>
                            <div className="text-xl mb-1">{cat.icon}</div>
                            <div className="text-[10px] font-medium truncate">{cat.label}</div>
                        </div>
                    ))}
                </div>

                <div className="mb-6">
                    <input type="text" placeholder="Descrição" value={description} onChange={e => setDescription(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-600 rounded-xl p-3 text-white outline-none focus:border-violet-500" />
                </div>

                <button onClick={handleSubmit} className="w-full py-4 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl shadow-lg shadow-violet-600/20 active:scale-95 transition-all">
                    Salvar Lançamento
                </button>
            </div>
        </div>
    )
}

function AddCardModal({ onClose, onSave }) {
    const [selectedBankKey, setSelectedBankKey] = useState(BANKS[0].id);
    const [dueDay, setDueDay] = useState('');
    const selectedBank = BANKS.find(b => b.id === selectedBankKey) || BANKS[0];

    return (
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center">
            <div className="bg-slate-800 w-[450px] p-8 rounded-2xl shadow-2xl border border-slate-700 animate-in fade-in zoom-in-95">
                <h2 className="text-2xl font-bold mb-6 text-white">Novo Cartão</h2>

                <div className="mb-6">
                    <label className="block text-sm text-slate-400 mb-2">Banco</label>
                    <div className="grid grid-cols-3 gap-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                        {BANKS.map(bank => (
                            <div key={bank.id} onClick={() => setSelectedBankKey(bank.id)}
                                className={`p-3 rounded-xl cursor-pointer text-center border transition-all ${selectedBankKey === bank.id ? 'border-violet-500 bg-violet-500/10' : 'border-slate-600 hover:bg-slate-700/50'}`}>
                                <div className="w-6 h-6 rounded-full mx-auto mb-2" style={{ backgroundColor: bank.color }}></div>
                                <span className="text-xs font-medium text-slate-300">{bank.name}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="mb-6">
                    <label className="block text-sm text-slate-400 mb-2">Dia do Fechamento</label>
                    <input type="number" placeholder="Ex: 05" value={dueDay} onChange={e => setDueDay(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-600 rounded-xl p-3 text-white outline-none focus:border-violet-500" />
                    <small className="block mt-2 text-xs text-slate-500">Dia que a fatura fecha (melhor dia de compra).</small>
                </div>

                <div className="mb-8">
                    <label className="block text-sm text-slate-400 mb-2">Pré-visualização</label>
                    <div className="rounded-2xl p-6 h-44 relative shadow-lg" style={{ background: selectedBank.gradient, color: selectedBank.text }}>
                        <div className="flex justify-between items-center">
                            <span className="font-bold text-lg">{selectedBank.name}</span>
                            <CreditCard size={24} />
                        </div>
                        <div className="absolute bottom-5 left-6">
                            <div className="text-xs opacity-80 mb-1">Fatura Atual</div>
                            <div className="text-2xl font-bold">R$ 0,00</div>
                        </div>
                        <div className="absolute bottom-5 right-6 text-right">
                            <div className="text-xs opacity-80 mb-1">FECHA</div>
                            <div className="text-lg font-semibold">{dueDay || 'DD'}</div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-3">
                    <button onClick={() => { if (dueDay) onSave({ id: Date.now().toString(), bankId: selectedBank.id, bankName: selectedBank.name, dueDay, color: selectedBank.color, gradient: selectedBank.gradient, text: selectedBank.text }); }}
                        className="w-full py-3 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl transition-colors">Criar Cartão</button>
                    <button onClick={onClose} className="w-full py-3 text-slate-400 hover:text-white font-medium transition-colors">Cancelar</button>
                </div>
            </div>
        </div>
    );
}

function CalendarView({ transactions, currentDate }) {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    const days = eachDayOfInterval({ start, end });
    const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const startDay = getDay(start);
    const padding = Array(startDay).fill(null);

    return (
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-8 h-full flex flex-col overflow-hidden">
            <h2 className="text-2xl font-bold mb-6">Calendário de Atividades</h2>

            <div className="grid grid-cols-7 gap-4 mb-4">
                {weekDays.map(d => <div key={d} className="text-center text-slate-500 font-semibold text-sm">{d}</div>)}
            </div>

            <div className="grid grid-cols-7 gap-4 overflow-y-auto pr-2 custom-scrollbar">
                {padding.map((_, i) => <div key={`pad-${i}`}></div>)}
                {days.map(day => {
                    const dayTx = transactions.filter(t => isSameDay(new Date(t.date), day));
                    const hasIncome = dayTx.some(t => t.type === 'income');
                    const hasExpense = dayTx.some(t => t.type === 'expense');
                    const isToday = isSameDay(day, new Date());

                    return (
                        <div key={day.toString()}
                            className={`aspect-square rounded-xl p-2 flex flex-col justify-between cursor-pointer transition-all hover:bg-slate-700 ${isToday ? 'bg-violet-600/10 border border-violet-500' : 'bg-slate-800/50 border border-slate-700/30'}`}>
                            <span className={`text-sm ${isToday ? 'text-violet-400 font-bold' : 'text-slate-400'}`}>{format(day, 'd')}</span>
                            <div className="flex justify-end gap-1">
                                {hasIncome && <div className="w-2 h-2 rounded-full bg-emerald-500"></div>}
                                {hasExpense && <div className="w-2 h-2 rounded-full bg-red-500"></div>}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function MenuItem({ icon, label, active, onClick }) {
    return (
        <button onClick={onClick}
            className={`w-full flex items-center gap-3 px-5 py-4 rounded-xl transition-all ${active ? 'bg-violet-600/10 text-violet-400 border-l-4 border-violet-600' : 'text-slate-400 hover:bg-slate-800 hover:text-white border-l-4 border-transparent'}`}>
            {icon}
            <span className="font-medium">{label}</span>
        </button>
    );
}

function StatCard({ label, value, icon, color, sub }) {
    const formatMoney = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
    return (
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 p-6 rounded-2xl hover:scale-105 transition-transform cursor-default shadow-lg">
            <div className="flex justify-between items-start mb-4">
                <div style={{ color, backgroundColor: `${color}20` }} className="p-3 rounded-xl">
                    {icon}
                </div>
            </div>
            <div>
                <div className="text-3xl font-extrabold text-white mb-2 tracking-tight">{formatMoney(value)}</div>
                <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-sm font-medium">{label}</span>
                    <span style={{ color, backgroundColor: `${color}15` }} className="text-xs px-2 py-1 rounded-lg font-bold">{sub}</span>
                </div>
            </div>
        </div>
    )
}

export function DesktopLayout({ transactions, setTransactions, cards, addCard, deleteCard, cardInvoices, currentDate, nextMonth, prevMonth, balance, income, expenses }) {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [searchTerm, setSearchTerm] = useState('');
    const [isTxModalOpen, setIsTxModalOpen] = useState(false);
    const [isCardModalOpen, setIsCardModalOpen] = useState(false);

    const formatMoney = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
    const healthScore = income > 0 ? Math.min(100, Math.round(((income - expenses) / income) * 100)) : 0;

    const renderContent = () => {
        switch (activeTab) {
            case 'transactions':
                return (
                    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-8 h-full flex flex-col">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-white">Lançamentos</h2>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="text" placeholder="Filtrar..."
                                    value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                                    className="bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-sm text-white outline-none focus:border-violet-500 w-64"
                                />
                            </div>
                        </div>
                        <div className="overflow-auto flex-1 custom-scrollbar">
                            <table className="w-full text-left border-collapse">
                                <thead className="sticky top-0 bg-slate-800/95 z-10">
                                    <tr className="text-slate-400 text-sm border-b border-slate-700">
                                        <th className="p-4 font-medium">Data</th>
                                        <th className="p-4 font-medium">Categoria</th>
                                        <th className="p-4 font-medium">Descrição</th>
                                        <th className="p-4 font-medium">Valor</th>
                                        <th className="p-4 font-medium">Status</th>
                                        <th className="p-4 font-medium"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-700/50">
                                    {transactions.filter(t => t.description.toLowerCase().includes(searchTerm.toLowerCase())).sort((a, b) => new Date(b.date) - new Date(a.date)).map(t => (
                                        <tr key={t.id} className="hover:bg-slate-700/30 transition-colors group">
                                            <td className="p-4 text-slate-400 text-sm">{new Date(t.date).toLocaleDateString()}</td>
                                            <td className="p-4"><span className="inline-flex items-center gap-2 bg-slate-700/50 px-3 py-1 rounded-full text-xs text-slate-300">{t.categoryIcon} {t.categoryLabel}</span></td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    {t.description}
                                                    {t.cardId && <span className="text-[10px] bg-violet-500/20 text-violet-400 px-1.5 py-0.5 rounded uppercase font-bold">Crédito</span>}
                                                    {t.installment && <span className="text-[10px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded font-bold">{t.installment}</span>}
                                                </div>
                                            </td>
                                            <td className={`p-4 font-bold ${t.type === 'income' ? 'text-emerald-400' : 'text-white'}`}>{t.type === 'income' ? '+' : '-'} {formatMoney(t.amount)}</td>
                                            <td className="p-4">{t.status === 'paid' ? <div className="flex items-center gap-1 text-emerald-400 text-xs font-bold"><Check size={14} /> PAGO</div> : <div className="text-red-400 text-xs font-bold bg-red-500/10 px-2 py-0.5 rounded-full inline-block">PENDENTE</div>}</td>
                                            <td className="p-4 text-right">
                                                <button onClick={() => { if (confirm('Apagar?')) setTransactions(prev => prev.filter(x => x.id !== t.id)) }} className="text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={16} /></button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            case 'calendar': return <CalendarView transactions={transactions} currentDate={currentDate} />;
            case 'reports':
                return (
                    <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-4">
                        <PieChart size={64} className="opacity-20" />
                        <p>Relatórios detalhados em breve.</p>
                    </div>
                );
            case 'dashboard':
            default:
                return (
                    <div className="grid grid-cols-[2fr_1fr] gap-8 h-full overflow-hidden">
                        <div className="flex flex-col gap-8 h-full overflow-y-auto pr-2 custom-scrollbar">
                            {/* Chart Area */}
                            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-6 min-h-[300px]">
                                <h3 className="font-bold text-lg mb-6 text-white">Fluxo Mensal</h3>
                                <div className="h-64">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={[{ name: 'Total', entrada: income, saida: expenses }]}>
                                            <XAxis dataKey="name" hide />
                                            <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: 12, boxShadow: '0 10px 15px -3px rgba(0,0,0,0.5)' }} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                                            <Bar dataKey="entrada" fill="#10b981" radius={[4, 4, 0, 0]} barSize={80} />
                                            <Bar dataKey="saida" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={80} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Recent Activity */}
                            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-6">
                                <h3 className="font-bold text-lg mb-4 text-white">Últimas Atividades</h3>
                                <div className="space-y-4">
                                    {transactions.slice(0, 5).map(t => (
                                        <div key={t.id} className="flex justify-between items-center py-2 border-b border-slate-700/50 last:border-0">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-slate-700/50 flex items-center justify-center text-lg">{t.categoryIcon}</div>
                                                <div>
                                                    <div className="font-medium text-white">{t.description}</div>
                                                    <div className="text-xs text-slate-400">{new Date(t.date).toLocaleDateString()}</div>
                                                </div>
                                            </div>
                                            <div className={`font-bold ${t.type === 'income' ? 'text-emerald-400' : 'text-white'}`}>{formatMoney(t.amount)}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Right Column (Cards) */}
                        <div className="flex flex-col gap-6">
                            <div className="bg-gradient-to-b from-slate-800 to-slate-900 p-6 rounded-3xl border border-slate-700 h-full overflow-hidden flex flex-col">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="font-bold text-white">Meus Cartões</h3>
                                    <button onClick={() => setIsCardModalOpen(true)} className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-white"><Plus size={18} /></button>
                                </div>

                                <div className="flex-1 overflow-y-auto space-y-4 pr-1 custom-scrollbar">
                                    {cards.length === 0 && <div className="text-center py-10 text-slate-500 text-sm border-2 border-dashed border-slate-700 rounded-xl">Nenhum cartão. Adicione um!</div>}

                                    {cards.map(card => {
                                        const bankPreset = BANKS.find(b => b.id === card.bankId) ||
                                            BANKS.find(b => b.name === card.bankName) ||
                                            BANKS.find(b => card.bankName && card.bankName.toLowerCase().includes(b.name.toLowerCase())) ||
                                            {};
                                        const gradient = card.gradient || bankPreset.gradient || 'linear-gradient(135deg, #64748b 0%, #475569 100%)';
                                        return (
                                            <div key={card.id} className="relative rounded-2xl p-5 shadow-lg transform transition-transform hover:scale-[1.02]" style={{ background: gradient, color: card.text || bankPreset.text || 'white' }}>
                                                <div className="flex justify-between items-start mb-6">
                                                    <div>
                                                        <div className="font-bold text-lg tracking-wide">{card.bankName}</div>
                                                        <div className="w-8 h-6 bg-gradient-to-tr from-yellow-400 to-yellow-600 rounded mt-3 opacity-80"></div>
                                                    </div>
                                                    <CreditCard className="opacity-80" />
                                                </div>
                                                <div className="flex justify-between items-end">
                                                    <div>
                                                        <div className="text-[10px] uppercase opacity-80">Fatura Atual</div>
                                                        <div className="text-xl font-bold">{formatMoney(cardInvoices[card.id] || 0)}</div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-[10px] uppercase opacity-80">FECHA</div>
                                                        <div className="text-lg font-semibold">{card.dueDay}</div>
                                                    </div>
                                                </div>
                                                <button onClick={() => { if (confirm('Remover?')) deleteCard(card.id) }} className="absolute top-3 right-3 opacity-0 hover:opacity-100 text-white/50 hover:text-white transition-opacity"><Trash2 size={14} /></button>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                );
        }
    }

    return (
        <div className="flex h-screen bg-slate-950 text-slate-200 overflow-hidden font-sans">
            {/* Sidebar */}
            <aside className="w-72 bg-slate-900/50 backdrop-blur-xl border-r border-slate-800 p-6 flex flex-col">
                <div className="flex items-center gap-4 mb-10">
                    <div className="w-12 h-12 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-600/20">
                        <Wallet className="text-white" />
                    </div>
                    <div>
                        <h1 className="font-extrabold text-xl text-white tracking-tight">Gastinhos</h1>
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pro Dashboard</span>
                    </div>
                </div>

                <nav className="flex-1 space-y-2">
                    <MenuItem icon={<LayoutDashboard size={20} />} label="Visão Geral" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
                    <MenuItem icon={<Wallet size={20} />} label="Lançamentos" active={activeTab === 'transactions'} onClick={() => setActiveTab('transactions')} />
                    <MenuItem icon={<CalendarIcon size={20} />} label="Calendário" active={activeTab === 'calendar'} onClick={() => setActiveTab('calendar')} />
                    <MenuItem icon={<PieChart size={20} />} label="Relatórios" active={activeTab === 'reports'} onClick={() => setActiveTab('reports')} />
                </nav>

                <div className="mt-auto pt-6 border-t border-slate-800">
                    <button onClick={() => { if (confirm('⚠️ Resetar tudo?')) { localStorage.clear(); window.location.reload(); } }} className="w-full py-3 flex items-center justify-center gap-2 text-red-500 hover:bg-red-500/10 rounded-xl transition-colors font-medium">
                        <Trash2 size={18} /> Resetar App
                    </button>
                </div>
            </aside>

            {/* Main */}
            <main className="flex-1 flex flex-col overflow-hidden relative">
                {/* Header */}
                <header className="h-20 px-8 flex justify-between items-center border-b border-slate-800 bg-slate-900/30">
                    <div className="flex items-center gap-4">
                        <div className="flex bg-slate-800 rounded-lg p-1">
                            <button onClick={prevMonth} className="p-1 hover:text-white text-slate-400"><ChevronLeft /></button>
                            <button onClick={nextMonth} className="p-1 hover:text-white text-slate-400"><ChevronRight /></button>
                        </div>
                        <h2 className="text-2xl font-bold text-white">{format(currentDate, 'MMMM yyyy', { locale: ptBR })}</h2>
                    </div>
                    <div className="flex gap-4">
                        <button className="p-3 text-slate-400 hover:text-white bg-slate-800 rounded-xl border border-slate-700" title="PDF em breve"><Download size={20} /></button>
                        <button onClick={() => setIsTxModalOpen(true)} className="flex items-center gap-2 px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl shadow-lg shadow-violet-600/20 active:scale-95 transition-all">
                            <Plus size={20} /> Nova Transação
                        </button>
                    </div>
                </header>

                <div className="flex-1 overflow-hidden p-8">
                    {activeTab === 'dashboard' && (
                        <div className="grid grid-cols-4 gap-6 mb-8">
                            <StatCard label="Saldo Total" value={balance} icon={<Wallet />} color="#8b5cf6" sub="Disponível" />
                            <StatCard label="Receita" value={income} icon={<ArrowUpRight />} color="#10b981" sub="Mensal" />
                            <StatCard label="Despesa" value={expenses} icon={<ArrowDownRight />} color="#ef4444" sub="Mensal" />
                            <StatCard label="Economia" value={income - expenses} icon={<DollarSign />} color="#3b82f6" sub="Reserva" />
                        </div>
                    )}
                    {renderContent()}
                </div>
            </main>

            {isTxModalOpen && <DesktopTransactionModal onClose={() => setIsTxModalOpen(false)} onSave={t => { setTransactions([t, ...transactions]); setIsTxModalOpen(false) }} categories={CATEGORIES} cards={cards} />}
            {isCardModalOpen && <AddCardModal onClose={() => setIsCardModalOpen(false)} onSave={c => { addCard(c); setIsCardModalOpen(false) }} />}
        </div>
    );
}
